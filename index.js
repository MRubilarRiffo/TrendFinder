const server = require('./src/config/server');
const { conn } = require('./src/config/database');
const { logMessage } = require('./src/helpers/logMessage');

const PORT = 3005;

conn.sync({ force: false })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });