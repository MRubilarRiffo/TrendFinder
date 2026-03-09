require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { conn, ProductSale, Product, SalesSnapshot } = require('../src/config/database');
const { Op } = require('sequelize');
const { logMessage } = require('./helpers/logMessage');
const { calculateTrendGrowth } = require('../src/functions/salesCalculations');
const fs = require('fs');
const path = require('path');
const PERIODS = [1, 7, 30];

/**
 * Calcula y almacena snapshots de ventas para los periodos definidos.
 * Diseñado para ejecutarse vía cron de forma independiente a la API.
 */
const calculateSnapshots = async () => {
    try {
        logMessage('[CRON] Inicializando cálculo de snapshots de ventas...');

        // Sincronizar tabla SalesSnapshot (crearla si no existe)
        await SalesSnapshot.sync({ alter: true });
        logMessage('[CRON] Base de datos sincronizada correctamente.');

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

            logMessage(`[CRON] Calculando snapshot para ${period} día(s)...`);

            // Query agregado: SUM de ventas, profit, revenue y ventas por mitad de periodo
            const aggregatedData = await ProductSale.findAll({
                attributes: [
                    'ProductId',
                    [ProductSale.sequelize.fn('SUM', ProductSale.sequelize.col('quantitySold')), 'totalQuantitySold'],
                    [ProductSale.sequelize.literal('SUM(quantitySold * GREATEST(Product.suggested_price - Product.sale_price, 0))'), 'totalProfit'],
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

                    return {
                        ProductId: row.ProductId,
                        periodDays: period,
                        totalQuantitySold: parseInt(row.totalQuantitySold) || 0,
                        totalProfit,
                        totalRevenue,
                        performanceRate,
                        trendGrowth,
                        calculatedAt: endDate
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
    // 1. REVISAR CANDADO: Si existe, abortamos inmediatamente.
    if (fs.existsSync(LOCK_FILE)) {
        logMessage('[CRON] ALERTA: Ejecución solapada detectada. El cron anterior sigue corriendo (o el lock quedó huérfano). Abortando...');
        process.exit(0);
    }

    // 2. PONER CANDADO
    try {
        fs.writeFileSync(LOCK_FILE, 'locked');
        logMessage('[CRON] Inicializando script de snapshots de ventas desde Cronjob/Terminal');
        await calculateSnapshots();

        // 3. QUITAR CANDADO AL FINALIZAR
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
            logMessage('[CRON] Archivo candado eliminado exitosamente.');
        }
        logMessage('[CRON] Proceso finalizado correctamente. Saliendo... (0)');
        process.exit(0);
    } catch (error) {
        logMessage(`[CRON] CRÍTICO - El script de snapshots ha fallado: ${error.message}`);

        // 3. QUITAR CANDADO EN CASO DE ERROR FATAL
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
            logMessage('[CRON] Archivo candado eliminado tras error crítico.');
        }
        process.exit(1);
    }
};

runCron();