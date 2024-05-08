const fs = require('fs');
const path = require('path');
const { logMessage } = require('../../helpers/logMessage');

const  checkAndRunApp = () => {
    const lockFilePath = path.resolve(__dirname, 'app.lock');

    if (fs.existsSync(lockFilePath)) {
        logMessage('La aplicación ya está en ejecución.');
        return true;
    };

    fs.writeFileSync(lockFilePath, process.pid.toString());

    process.on('exit', () => {
        fs.unlinkSync(lockFilePath);
    });
};

module.exports = checkAndRunApp;