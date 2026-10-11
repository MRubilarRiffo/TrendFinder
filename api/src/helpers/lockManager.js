const fs = require('fs');
const { logMessage } = require('./logMessage');

/**
 * Gestor de Candados de Proceso para Crons en cPanel.
 * Evita la ejecución solapada y recupera automáticamente candados huérfanos
 * dejados por procesos que murieron abruptamente por límites de cPanel (LVE / CloudLinux).
 *
 * @param {string} lockFilePath - Ruta absoluta al archivo .lock
 * @param {number} maxAgeHours - Tiempo de vida máximo del candado antes de considerarlo huérfano (defecto: 2 horas)
 * @returns {boolean} true si el candado fue adquirido exitosamente, false si hay otro proceso activo
 */
const acquireLock = (lockFilePath, maxAgeHours = 2) => {
    try {
        if (fs.existsSync(lockFilePath)) {
            const stats = fs.statSync(lockFilePath);
            const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 3600);

            if (ageHours > maxAgeHours) {
                logMessage(`[LOCK MANAGER] Candado huérfano detectado (${ageHours.toFixed(1)}h > ${maxAgeHours}h). Liberando y re-adquiriendo...`);
                fs.unlinkSync(lockFilePath);
            } else {
                logMessage(`[LOCK MANAGER] ALERTA: Ejecución solapada detectada. Proceso activo desde hace ${ageHours.toFixed(1)}h. Abortando.`);
                return false;
            }
        }

        const lockContent = JSON.stringify({
            pid: process.pid,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(lockFilePath, lockContent, 'utf8');
        return true;
    } catch (error) {
        logMessage(`[LOCK MANAGER ERROR] Error adquiriendo candado en ${lockFilePath}: ${error.message}`);
        return false;
    }
};

/**
 * Libera de forma segura el candado al finalizar el proceso.
 *
 * @param {string} lockFilePath - Ruta absoluta al archivo .lock
 */
const releaseLock = (lockFilePath) => {
    try {
        if (fs.existsSync(lockFilePath)) {
            fs.unlinkSync(lockFilePath);
            logMessage('[LOCK MANAGER] Archivo candado eliminado exitosamente.');
        }
    } catch (error) {
        logMessage(`[LOCK MANAGER ERROR] Error liberando candado: ${error.message}`);
    }
};

module.exports = {
    acquireLock,
    releaseLock
};
