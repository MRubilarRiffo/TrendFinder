const { logMessage } = require("../../helpers/logMessage");
const { scraper } = require("../cron/scraper");
const CronJob = require('cron').CronJob;

const configCron = async () => {
    logMessage('Configurando Cron');
    
    new CronJob('0 */2 * * *', async () => { await scraper() }, null, true);
    
    logMessage('Cron configurado');
};

module.exports = { configCron };