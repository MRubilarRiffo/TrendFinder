const server = require('./src/config/server');
const { conn } = require('./src/config/database');
const { logMessage } = require('./src/helpers/logMessage');

const PORT = 3005;

let serverInstance;

conn.sync({ force: false })
    .then(() => {
        serverInstance = server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });

// Función de apagado elegante
const gracefulShutdown = async (signal) => {
    logMessage(`[API] Señal de apagado recibida (${signal}). Cerrando servidor...`);

    // FAIL-SAFE: Si en 10 segundos no se ha cerrado solo, forzamos la salida
    setTimeout(() => {
        logMessage('[API] Forzando salida por timeout de cierre.');
        process.exit(1);
    }, 10000);

    if (serverInstance) {
        serverInstance.close(async () => {
            logMessage('[API] Servidor Express cerrado.');
            try {
                await conn.close();
                logMessage('[API] Conexión a la base de datos cerrada limpiamente.');
                process.exit(0);
            } catch (error) {
                logMessage(`[API] Error al cerrar la conexión a la base de datos: ${error.message}`);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
};

// Escuchar señales de terminación
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));