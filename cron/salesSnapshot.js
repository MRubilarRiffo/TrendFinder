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

            logMessage(`[CRON] Calculando snapshot para ${period} día(s)...`);

            // Query agregado: SUM de ventas y profit por producto en el periodo
            const aggregatedData = await ProductSale.findAll({
                attributes: [
                    'ProductId',
                    [ProductSale.sequelize.fn('SUM', ProductSale.sequelize.col('quantitySold')), 'totalQuantitySold'],
                    [ProductSale.sequelize.literal('SUM(quantitySold * (Product.suggested_price - Product.sale_price))'), 'totalProfit']
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
                const snapshots = aggregatedData.map(row => ({
                    ProductId: row.ProductId,
                    periodDays: period,
                    totalQuantitySold: parseInt(row.totalQuantitySold) || 0,
                    totalProfit: parseFloat(row.totalProfit) || 0,
                    calculatedAt: now
                }));

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
