const fs = require('fs');
const path = require('path');
const { logMessage } = require('../helpers/logMessage');

let proxiesCache = [];
let tokensCache = [];

function loadProxiesAndTokens() {
    // 1. Cargar Proxies
    try {
        const proxiesPath = path.join(__dirname, '../config/proxies.txt');
        if (!fs.existsSync(proxiesPath)) {
            logMessage(`[ROTATION MANAGER] Archivo de proxies no encontrado en ${proxiesPath}. Se realizarán peticiones sin proxy.`);
        } else {
            const content = fs.readFileSync(proxiesPath, 'utf-8');
            const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

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
                return `http://${line}`;
            });
            logMessage(`[ROTATION MANAGER] ${proxiesCache.length} proxies cargados.`);
        }
    } catch (error) {
        logMessage(`[ROTATION ERROR] Fallo parseando proxies: ${error.message}`);
    }

    // 2. Cargar Tokens Adicionales (Bypass 429 WAF Laravel)
    try {
        const tokensPath = path.join(__dirname, '../config/tokens.txt');
        if (!fs.existsSync(tokensPath)) {
            logMessage(`[ROTATION MANAGER] Archivo de tokens.txt no encontrado. Se usará el token base del entorno.`);
        } else {
            const tokenContent = fs.readFileSync(tokensPath, 'utf-8');
            tokensCache = tokenContent.split('\n').map(t => t.trim()).filter(t => t.length > 0);
            logMessage(`[ROTATION MANAGER] ${tokensCache.length} tokens extra cargados a memoria exitosamente.`);
        }
    } catch (err) {
        logMessage(`[ROTATION ERROR] Fallo parseando tokens: ${err.message}`);
    }
}

// Inicializar en caché global tan pronto como se requiere el módulo
loadProxiesAndTokens();

// Retorna null si no hay proxies
function getRandomProxy() {
    if (proxiesCache.length === 0) return null;
    let randomIndex = Math.floor(Math.random() * proxiesCache.length);
    return proxiesCache[randomIndex];
}

// Retorna el token base fallback si no hay extras en TXT
function getRandomToken(baseToken) {
    if (tokensCache.length === 0) return baseToken; // Fallback env
    const randomIndex = Math.floor(Math.random() * tokensCache.length);
    return tokensCache[randomIndex];
}

module.exports = { getRandomProxy, getRandomToken };