const { logMessage } = require("../../helpers/logMessage");
const { dailySaleReport } = require("../cron/dailySaleReport");
const { scraper } = require("../cron/scraper");
const { weeklySaleReport } = require("../cron/weeklySaleReport");
const CronJob = require('cron').CronJob;

const configCron = () => {
    logMessage('Configurando Cron');
    
    new CronJob('0 */2 * * *', async () => {
        logMessage('Scraper iniciado');
        await scraper();
        logMessage('Scraper terminado');
    }, null, true);

    new CronJob('0 3 * * *', async () => {
        logMessage('Reporte diario iniciado');
        await dailySaleReport();
        logMessage('Reporte diario terminado');
    }, null, true);

    new CronJob('30 3 * * 1', async () => {
        logMessage('Reporte semanal iniciado');
        await weeklySaleReport();
        logMessage('Reporte semanal terminado');
    }, null, true);
    
    logMessage('Cron configurado');
};

module.exports = { configCron };