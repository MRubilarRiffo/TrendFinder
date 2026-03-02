const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { logMessage } = require('../helpers/logMessage');
const { getRandomProxy, getSequentialToken } = require('../utils/rotationManager');

/**
 * Cliente HTTP puramente enfocado en llamar a la API de Dropi con anti-bloqueo.
 * Utiliza Axios + HttpsProxyAgent para evadir errores 405 (mutación de POST en túneles).
 */
const fetchDropiProductsPage = async (apiUrl, headers, body, apiCountry, maxRetries = 5) => {
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        const proxyUrl = getRandomProxy();

        // Asignación Secuencial del Token V3 (Evadir 429 WAF Laravel ThrottleRequests)
        const currentToken = getSequentialToken(headers['dropi-integration-key']);
        headers['dropi-integration-key'] = currentToken;

        // Limpiamos headers que pueden romper la petición axios (como content-length manual)
        delete headers['Content-Length'];

        try {
            logMessage(`[DEBUG RED] Intento ${attempt}/${maxRetries} (${apiCountry}) - Proxy: ${proxyUrl ? 'SI' : 'NO'} | Token: ...${currentToken.substring(86, 130)}...`);

            const axiosConfig = {
                url: apiUrl,
                method: 'POST',
                headers: headers,
                data: body,
                timeout: 30000 // 30s timeout máximo
            };

            if (proxyUrl) {
                // HttpsProxyAgent establece un CONNECT tunnel puro sin corromper el Payload POST
                axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
                axiosConfig.proxy = false; // Desactiva el proxy transparente de axios por defecto
            }

            const response = await axios(axiosConfig);
            const { objects, isSuccess, error, count } = response.data;

            if (!isSuccess || !objects) {
                logMessage(`Error Dropi Payload IS_SUCCESS=false. Error: ${error || 'Desconocido'}`);
                throw new Error('API isSuccess=false payload');
            }

            if (objects.length === 0) {
                logMessage(`Fin de catálogo alcanzado en ${apiCountry}.`);
                return { success: true, data: [], count: count || 0 };
            }

            return { success: true, data: objects, count: count || 0 };

        } catch (error) {
            const errorMsg = error.response ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
            logMessage(`[REINTENTO ${attempt}] Fallo en Fetch Dropi API (${apiCountry}) usando Proxy [${proxyUrl || 'LOCAL IP'}]: ${errorMsg}`);

            if (attempt >= maxRetries) {
                logMessage(`[CANCELADO] Máximo de reintentos (${maxRetries}) superado en ${apiCountry}. Retornando array vacío.`);
                return { success: false, data: [], count: 0 };
            }

            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    return { success: false, data: [], count: 0 };
};

module.exports = { fetchDropiProductsPage };