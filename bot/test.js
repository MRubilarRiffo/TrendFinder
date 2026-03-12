require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { conn } = require('../src/config/database');
const { scraperConfig } = require('./services/scraperOrchestrator');
const { logMessage } = require('./helpers/logMessage');
const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, 'bot.lock');

const runBot = async () => {
    // 1. REVISAR CANDADO: Si existe, abortamos inmediatamente.
    if (fs.existsSync(LOCK_FILE)) {
        logMessage('[TEST.JS] ALERTA: Ejecución solapada detectada. El bot anterior sigue corriendo (o el lock quedó huérfano). Abortando...');
        process.exit(0);
    }

    // 2. PONER CANDADO
    try {
        fs.writeFileSync(LOCK_FILE, 'locked');
        logMessage('[TEST.JS] Inicializando Bot de Scraper desde Cronjob/Terminal');
        await scraperConfig();

        // 3. QUITAR CANDADO AL FINALIZAR
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
            logMessage('[TEST.JS] Archivo candado eliminado exitosamente.');
        }
        logMessage('[TEST.JS] Cerrando conexión con la base de datos...');
        await conn.close();
        logMessage('[TEST.JS] Proceso finalizado correctamente. Saliendo... (0)');
        process.exit(0);
    } catch (error) {
        logMessage(`[TEST.JS] CRÍTICO - El Bot de scraper ha fallado: ${error.message}`);

        // 3. QUITAR CANDADO EN CASO DE ERROR FATAL
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
            logMessage('[TEST.JS] Archivo candado eliminado tras error crítico.');
        }
        try {
            await conn.close();
            logMessage('[TEST.JS] Conexión cerrada tras error.');
        } catch (closeError) {
            logMessage(`[TEST.JS] Error al cerrar conexión tras fallo: ${closeError.message}`);
        }
        process.exit(1);
    }
};

runBot();