const fs = require('fs');
const path = require('path');

function logMessage(message) {
    const logsDirectory = 'logs';
    if (!fs.existsSync(logsDirectory)) {
        fs.mkdirSync(logsDirectory);
    }

    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getDate()}-${timestamp.getMonth() + 1}-${timestamp.getFullYear()}`;
    const filename = path.join(logsDirectory, `${formattedTimestamp}.txt`);

    fs.appendFileSync(filename, `${timestamp} - ${message}\n`);
    console.log(message);
}

module.exports = { logMessage };