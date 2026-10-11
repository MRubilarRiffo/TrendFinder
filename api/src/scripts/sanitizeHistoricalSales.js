require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { conn, ProductSale } = require('../config/database');
const { calculateSnapshots } = require('../workers/snapshots/salesSnapshotRunner');
const { logMessage } = require('../helpers/logMessage');
const { Op } = require('sequelize');

/**
 * Script de Saneamiento de Ventas Históricas
 * Elimina las transacciones de ventas anómalas (ajustes manuales de proveedores en Dropi)
 * y regenera los snapshots de ventas para restaurar la integridad del catálogo y del DropScore.
 *
 * Uso:
 *   node src/scripts/sanitizeHistoricalSales.js --dry-run
 *   node src/scripts/sanitizeHistoricalSales.js --execute
 */
const runSanitization = async () => {
    const isDryRun = process.argv.includes('--dry-run');
    const isExecute = process.argv.includes('--execute');

    if (!isDryRun && !isExecute) {
        console.log('Por favor especifica --dry-run o --execute.');
        console.log('Ejemplo: node src/scripts/sanitizeHistoricalSales.js --execute');
        process.exit(1);
    }

    try {
        logMessage(`[SANEAMIENTO] Iniciando análisis de ventas anómalas (Modo: ${isDryRun ? 'DRY-RUN' : 'EJECUCIÓN REAL'})...`);

        // Umbral de corte para transacciones individuales anómalas en Dropi
        const THRESHOLD = 100;

        // 1. Contar registros y volumen afectados
        const totalSalesBefore = await ProductSale.count();
        const anomalousRecords = await ProductSale.findAll({
            attributes: ['id', 'ProductId', 'quantitySold', 'saleDate'],
            where: {
                quantitySold: { [Op.gte]: THRESHOLD }
            },
            order: [['quantitySold', 'DESC']]
        });

        const totalAnomalousUnits = anomalousRecords.reduce((sum, r) => sum + r.quantitySold, 0);

        logMessage(`[SANEAMIENTO] Transacciones totales en base de datos: ${totalSalesBefore}`);
        logMessage(`[SANEAMIENTO] Transacciones anómalas detectadas (>= ${THRESHOLD} uds): ${anomalousRecords.length}`);
        logMessage(`[SANEAMIENTO] Unidades ficticias acumuladas en esas transacciones: ${totalAnomalousUnits}`);

        if (anomalousRecords.length === 0) {
            logMessage('[SANEAMIENTO] No se encontraron transacciones anómalas. La base de datos ya está limpia.');
            await conn.close();
            process.exit(0);
        }

        if (isDryRun) {
            logMessage('[SANEAMIENTO] Modo DRY-RUN finalizado. No se realizaron modificaciones en la base de datos.');
            await conn.close();
            process.exit(0);
        }

        // 2. Ejecutar limpieza dentro de una transacción segura
        logMessage('[SANEAMIENTO] Ejecutando eliminación de transacciones anómalas en la base de datos...');
        const transaction = await conn.transaction();

        try {
            const deletedCount = await ProductSale.destroy({
                where: {
                    quantitySold: { [Op.gte]: THRESHOLD }
                },
                transaction
            });

            await transaction.commit();
            logMessage(`[SANEAMIENTO] ÉXITO: Se eliminaron ${deletedCount} registros anómalos de ProductSales.`);
        } catch (dbError) {
            await transaction.rollback();
            logMessage(`[SANEAMIENTO ERROR] Error al eliminar registros: ${dbError.message}. Transacción revertida.`);
            throw dbError;
        }

        // 3. Recalcular Snapshots de Ventas (1, 7 y 30 días)
        logMessage('[SANEAMIENTO] Recalculando Snapshots de Ventas para actualizar el catálogo y el DropScore...');
        await calculateSnapshots();
        logMessage('[SANEAMIENTO] Snapshots recalculados exitosamente.');

        const totalSalesAfter = await ProductSale.count();
        logMessage(`[SANEAMIENTO] Transacciones legítimas finales en BD: ${totalSalesAfter}`);
        logMessage('[SANEAMIENTO] Proceso de saneamiento completado con éxito.');

    } catch (error) {
        logMessage(`[SANEAMIENTO ERROR CRÍTICO] ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        try {
            await conn.close();
        } catch (e) {}
    }
};

if (require.main === module) {
    runSanitization();
}

module.exports = { runSanitization };
