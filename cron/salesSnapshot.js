require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { conn, ProductSale, Product, SalesSnapshot } = require('../src/config/database');
const { Op } = require('sequelize');
const { logMessage } = require('./helpers/logMessage');

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

        for (const period of PERIODS) {
            const dateLimit = new Date();
            dateLimit.setDate(now.getDate() - period);

            // Punto medio del periodo para calcular trendGrowth
            const midDate = new Date();
            midDate.setDate(now.getDate() - Math.floor(period / 2));
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
                        [Op.between]: [dateLimit, now]
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
                    let trendGrowth = 0;
                    if (oldSales > 0) {
                        trendGrowth = parseFloat((((recentSales - oldSales) / oldSales) * 100).toFixed(2));
                    } else if (recentSales > 0) {
                        trendGrowth = 100;
                    }

                    return {
                        ProductId: row.ProductId,
                        periodDays: period,
                        totalQuantitySold: parseInt(row.totalQuantitySold) || 0,
                        totalProfit,
                        totalRevenue,
                        performanceRate,
                        trendGrowth,
                        calculatedAt: now
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

const runCron = async () => {
    try {
        logMessage('[CRON] Inicializando script de snapshots de ventas desde Cronjob/Terminal');
        await calculateSnapshots();
        logMessage('[CRON] Proceso finalizado correctamente. Saliendo... (0)');
        process.exit(0);
    } catch (error) {
        logMessage(`[CRON] CRÍTICO - El script de snapshots ha fallado: ${error.message}`);
        process.exit(1);
    }
};

runCron();