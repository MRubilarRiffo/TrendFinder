const { logMessage } = require("../../helpers/logMessage");
const { dailySaleReport } = require("../cron/dailySaleReport");
const { scraper } = require("../cron/scraper");
const CronJob = require('cron').CronJob;

const configCron = async () => {
    logMessage('Configurando Cron');
    
    new CronJob('0 */2 * * *', async () => {
        await scraper();
        logMessage('Scraper ejecutado');
    }, null, true);
    new CronJob('0 3 * * *', async () => {
        await dailySaleReport();
        logMessage('Daily sale report ejecutado');
    }, null, true);
    
    logMessage('Cron configurado');
};

module.exports = { configCron };