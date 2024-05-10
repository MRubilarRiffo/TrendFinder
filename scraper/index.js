const { conn } = require('./src/infrastructure/config/database');
const { logMessage } = require('./src/helpers/logMessage');
const { configCategory } = require('./src/infrastructure/config/configCategory');
const { configCron } = require('./src/infrastructure/config/configCron');
// const { scraperConfig } = require('./src/infrastructure/cron/scraper');

conn.sync({ force: false })
    .then(async () => {
        await configCategory();
        configCron();
        // scraperConfig();
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });