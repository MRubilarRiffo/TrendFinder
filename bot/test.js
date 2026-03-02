require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { scraperConfig } = require('./services/scraperOrchestrator');
const { logMessage } = require('./helpers/logMessage');

const runBot = async () => {
    try {
        logMessage('[TEST.JS] Inicializando Bot de Scraper desde Cronjob/Terminal');
        await scraperConfig();
        logMessage('[TEST.JS] Proceso finalizado correctamente. Saliendo... (0)');
        process.exit(0);
    } catch (error) {
        logMessage(`[TEST.JS] CRÍTICO - El Bot de scraper ha fallado: ${error.message}`);
        process.exit(1);
    }
};

runBot();