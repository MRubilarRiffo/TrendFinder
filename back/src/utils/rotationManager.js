const fs = require('fs');
const path = require('path');
const { logMessage } = require('../helpers/logMessage');

let proxiesCache = [];

function loadProxies() {
    try {
        const proxiesPath = path.join(__dirname, '../config/proxies.txt');
        if (!fs.existsSync(proxiesPath)) {
            logMessage(`[ROTATION MANAGER] Archivo de proxies no encontrado en ${proxiesPath}. Se realizarán peticiones sin proxy.`);
            return;
        }

        const content = fs.readFileSync(proxiesPath, 'utf-8');
        // Separamos por nuevas lineas y eliminamos vacías
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Parsear ip:port:user:pass a http://user:pass@ip:port
        proxiesCache = lines.map(line => {
            if (line.startsWith('http://') || line.startsWith('https://')) return line;

            const parts = line.split(':');
            if (parts.length === 4) {
                const [host, port, user, pass] = parts;
                return `http://${user}:${pass}@${host}:${port}`;
            } else if (parts.length === 2) {
                const [host, port] = parts;
                return `http://${host}:${port}`;
            }
            return `http://${line}`; // Fallback genérico
        });

        logMessage(`[ROTATION MANAGER] ${proxiesCache.length} proxies IP:PORT cargados a memoria exitosamente.`);
    } catch (error) {
        logMessage(`[ROTATION ERROR] Hubo un fallo parseando proxies.txt: ${error.message}`);
    }
}

// Inicializar en caché global tan pronto como se requiere el módulo
loadProxies();

function getRandomProxy() {
    if (proxiesCache.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * proxiesCache.length);
    return proxiesCache[randomIndex];
}

module.exports = { getRandomProxy };