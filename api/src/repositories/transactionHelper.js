const { conn } = require('../config/database');

/**
 * Helper de Transacciones de Base de Datos (Unit of Work)
 * Ejecuta operaciones de forma atómica: realiza ROLLBACK automático si ocurre cualquier error
 * o COMMIT automático si todo finaliza exitosamente.
 */
const runTransaction = async (callback) => {
    return await conn.transaction(callback);
};

module.exports = { runTransaction };
