const server = require('./src/config/server');
const { conn } = require('./src/config/database');
const { logMessage } = require('./src/helpers/logMessage');

const PORT = 3001;

conn.sync({ force: false })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });

// Manejo de Cierre Forzoso (Ctrl + C)
// Evita que el Scraper siga corriendo como "Zombie" en la memoria de Windows
process.on('SIGINT', () => {
    logMessage('\n[APAGADO] Señal de cierre (Ctrl+C) detectada. Terminando forzosamente el servidor y todos sus hilos asíncronos...');
    process.exit(0);
});