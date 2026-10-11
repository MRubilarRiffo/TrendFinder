const fs = require('fs');
const path = require('path');
const { logMessage } = require('./logMessage');

const DEFAULT_STATE_FILE = path.join(__dirname, '../workers/scraper/bot_state.json');

/**
 * Registra la fecha y hora de finalización exitosa de una corrida del bot scraper.
 *
 * @param {string} [filePath=DEFAULT_STATE_FILE] - Ruta del archivo de estado
 */
const recordBotRunFinished = (filePath = DEFAULT_STATE_FILE) => {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const state = {
            lastRunFinishedAt: new Date().toISOString()
        };
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
        logMessage(`[BOT STATE] Error guardando estado del bot: ${error.message}`);
    }
};

/**
 * Obtiene la fecha y hora de la última corrida exitosa del bot scraper.
 *
 * @param {string} [filePath=DEFAULT_STATE_FILE] - Ruta del archivo de estado
 * @returns {Date|null} Objeto Date si existe y es válido, o null si no existe
 */
const getLastRunFinishedAt = (filePath = DEFAULT_STATE_FILE) => {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && parsed.lastRunFinishedAt) {
            const date = new Date(parsed.lastRunFinishedAt);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Limpia el archivo de estado del bot (útil para tests o reset).
 *
 * @param {string} [filePath=DEFAULT_STATE_FILE] - Ruta del archivo de estado
 */
const clearBotState = (filePath = DEFAULT_STATE_FILE) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        // Ignorar errores al limpiar
    }
};

module.exports = {
    recordBotRunFinished,
    getLastRunFinishedAt,
    clearBotState,
    DEFAULT_STATE_FILE
};
