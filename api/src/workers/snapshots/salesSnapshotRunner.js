require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { conn, ProductSale, Product, SalesSnapshot } = require('../../config/database');
const { Op } = require('sequelize');
const { logMessage } = require('../../helpers/logMessage');
const { acquireLock, releaseLock } = require('../../helpers/lockManager');
const { calculateTrendGrowth, calculateBreakoutMetrics, winsorizeDailySales } = require('../../functions/salesCalculations');
const path = require('path');
const PERIODS = [1, 7, 30];

/**
 * Calcula y almacena snapshots de ventas para los periodos definidos.
 * Diseñado para ejecutarse vía cron de forma independiente a la API HTTP.
 */
const calculateSnapshots = async () => {
    try {
        logMessage('[CRON] Inicializando cálculo de snapshots de ventas...');

        const now = new Date();

        // Truncar a medianoche: rangos en días calendario completos
        // Si corre a las 4:30 AM del 5/mar, endDate = 5/mar 00:00:00
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        for (const period of PERIODS) {
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - period);

            logMessage(`[CRON] Calculando snapshot para ${period} día(s)... ${startDate.toISOString().slice(0, 19).replace('T', ' ')} - ${endDate.toISOString().slice(0, 19).replace('T', ' ')}`);

            // Punto medio del periodo para calcular trendGrowth
            const midDate = new Date(endDate);
            midDate.setDate(endDate.getDate() - Math.floor(period / 2));
            const midDateStr = midDate.toISOString().slice(0, 19).replace('T', ' ');

            // Query agregado: SUM de ventas, profit, revenue y ventas por mitad de periodo (ANSI SQL compatible)
            const aggregatedData = await ProductSale.findAll({
                attributes: [
                    'ProductId',
                    [ProductSale.sequelize.fn('SUM', ProductSale.sequelize.col('quantitySold')), 'totalQuantitySold'],
                    [ProductSale.sequelize.literal('SUM(quantitySold * (CASE WHEN (Product.suggested_price - Product.sale_price) > 0 THEN (Product.suggested_price - Product.sale_price) ELSE 0 END))'), 'totalProfit'],
                    [ProductSale.sequelize.literal('SUM(quantitySold * Product.sale_price)'), 'totalRevenue'],
                    [ProductSale.sequelize.literal(`SUM(CASE WHEN ProductSale.saleDate >= '${midDateStr}' THEN quantitySold ELSE 0 END)`), 'recentSales'],
                    [ProductSale.sequelize.literal(`SUM(CASE WHEN ProductSale.saleDate < '${midDateStr}' THEN quantitySold ELSE 0 END)`), 'oldSales']
                ],
                where: {
                    saleDate: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                },
                include: [{
                    model: Product,
                    attributes: ['id', 'sale_price', 'suggested_price']
                }],
                group: ['ProductId', 'Product.id'],
                raw: true,
                nest: true
            });

            // Ventas por día para el sparkline
            const dailyData = await ProductSale.findAll({
                attributes: [
                    'ProductId',
                    [ProductSale.sequelize.fn('DATE', ProductSale.sequelize.col('saleDate')), 'saleDay'],
                    [ProductSale.sequelize.fn('SUM', ProductSale.sequelize.col('quantitySold')), 'dailyQty']
                ],
                where: {
                    saleDate: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                },
                group: ['ProductId', ProductSale.sequelize.fn('DATE', ProductSale.sequelize.col('saleDate'))],
                raw: true
            });

            const sparklineMap = {};
            dailyData.forEach(row => {
                if (!sparklineMap[row.ProductId]) sparklineMap[row.ProductId] = {};
                sparklineMap[row.ProductId][row.saleDay] = parseInt(row.dailyQty) || 0;
            });

            // Eliminar snapshots anteriores de este periodo
            const deleted = await SalesSnapshot.destroy({ where: { periodDays: period } });
            logMessage(`[CRON] ${deleted} snapshots anteriores eliminados para periodo de ${period} día(s).`);

            // Insertar nuevos snapshots
            if (aggregatedData.length > 0) {
                const snapshots = aggregatedData.map(row => {
                    const totalProfit = parseFloat(row.totalProfit) || 0;
                    const totalRevenue = parseFloat(row.totalRevenue) || 0;
                    const recentSales = parseInt(row.recentSales) || 0;
                    const oldSales = parseInt(row.oldSales) || 0;

                    // performanceRate: % de ganancia sobre ingreso
                    const performanceRate = totalRevenue > 0
                        ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
                        : 0;

                    // trendGrowth: % de crecimiento (mitad reciente vs mitad antigua)
                    let trendGrowth = calculateTrendGrowth(recentSales, oldSales);

                    // breakout: detección de despegue desde 0 ventas
                    const { isBreakout, breakoutScore } = calculateBreakoutMetrics(recentSales, oldSales, Math.floor(period / 2));

                    const dailySales = [];
                    for (let i = 0; i < period; i++) {
                        const d = new Date(startDate);
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().slice(0, 10);
                        const salesThatDay = sparklineMap[row.ProductId]?.[dateStr] || 0;
                        dailySales.push(salesThatDay);
                    }

                    const cleanDailySales = winsorizeDailySales(dailySales);

                    return {
                        ProductId: row.ProductId,
                        periodDays: period,
                        totalQuantitySold: parseInt(row.totalQuantitySold) || 0,
                        totalProfit,
                        totalRevenue,
                        performanceRate,
                        trendGrowth,
                        breakoutScore,
                        isBreakout,
                        calculatedAt: endDate,
                        dailySales: cleanDailySales
                    };
                });

                await SalesSnapshot.bulkCreate(snapshots);
                logMessage(`[CRON] ${snapshots.length} snapshots insertados para periodo de ${period} día(s).`);
            } else {
                logMessage(`[CRON] Sin datos de ventas para periodo de ${period} día(s).`);
            }
        }

        logMessage('[CRON] Proceso de snapshots finalizado correctamente.');
    } catch (error) {
        logMessage(`[CRON] CRÍTICO - Error en cálculo de snapshots: ${error.message}`);
        throw error;
    }
};

const LOCK_FILE = path.join(__dirname, 'cron.lock');

const runCron = async () => {
    // 1. REVISAR CANDADO CON RECUPERACIÓN DE HUÉRFANOS DE CPANEL
    if (!acquireLock(LOCK_FILE, 2)) {
        process.exit(0);
    }

    try {
        logMessage('[CRON] Inicializando script de snapshots de ventas desde Workers (Cron)');
        await calculateSnapshots();

        // 2. QUITAR CANDADO AL FINALIZAR
        releaseLock(LOCK_FILE);

        logMessage('[CRON] Cerrando conexión con la base de datos...');
        await conn.close();
        logMessage('[CRON] Proceso finalizado correctamente. Saliendo... (0)');
        process.exit(0);
    } catch (error) {
        logMessage(`[CRON] CRÍTICO - El script de snapshots ha fallado: ${error.message}`);
        releaseLock(LOCK_FILE);

        try {
            await conn.close();
            logMessage('[CRON] Conexión cerrada tras error.');
        } catch (closeError) {
            logMessage(`[CRON] Error al cerrar conexión tras fallo: ${closeError.message}`);
        }
        process.exit(1);
    }
};

if (require.main === module) {
    runCron();
}

module.exports = { calculateSnapshots, runCron };
