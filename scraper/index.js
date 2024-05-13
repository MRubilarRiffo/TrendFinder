const { conn } = require('./src/infrastructure/config/database');
const { logMessage } = require('./src/helpers/logMessage');
const { configCategory } = require('./src/infrastructure/config/configCategory');
const { configCron } = require('./src/infrastructure/config/configCron');

conn.sync({ force: false })
    .then(async () => {
        await configCategory();
        configCron();
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });