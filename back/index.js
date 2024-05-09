const server = require('./src/infrastructure/config/server');
const { conn } = require('./src/infrastructure/config/database');
const { logMessage } = require('./src/helpers/logMessage');

const PORT = 3001;

conn.sync({ force: false })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`)
    });