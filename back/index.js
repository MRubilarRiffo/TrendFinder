const server = require('./src/config/server');
const { conn } = require('./src/config/database');
const { logMessage } = require('./src/helpers/logMessage');
// const { configCategory } = require('./src/config/configCategory');

const PORT = 3001;

conn.sync({ force: false })
    .then(async () => {
        // await configCategory();
    })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });