const server = require('./src/infrastructure/config/server');
const { conn } = require('./src/infrastructure/config/database');
const { logMessage } = require('./src/helpers/logMessage');
const { configCategory } = require('./src/infrastructure/config/configCategory');
const { configCron } = require('./src/infrastructure/config/configCron');
const checkAndRunApp = require('./src/infrastructure/config/checkAndRunApp');

const PORT = 3001;

const check = checkAndRunApp();
if (check) return;

conn.sync({ force: false })
    .then(async () => {
        await configCategory();
        configCron();
    })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`)
    });