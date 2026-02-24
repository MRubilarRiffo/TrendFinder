const { logMessage } = require('../../helpers/logMessage');

/**
 * Cliente HTTP puramente enfocado en llamar a la API de Dropi.
 * Se encarga del error handling en la capa de red.
 */
const fetchDropiProductsPage = async (apiUrl, headers, body, apiCountry) => {
    try {
        logMessage(`[DEBUG RED] Enviando Headers a Dropi ${apiCountry}: ${headers['dropi-integration-key'].substring(0, 15)}...`);
        console.log(apiUrl);
        console.log(headers);
        console.log(body);
        console.log(apiCountry);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} - Response: ${errorText}`);
        }

        const data = await response.json();
        const { objects, isSuccess, error } = data;

        if (!isSuccess || !objects) {
            logMessage(`Error en la capa de red al obtener productos (${apiCountry}). Error retornado por Dropi: ${error || 'Desconocido'}`);
            return {
                success: false,
                data: []
            };
        }

        if (objects.length === 0) {
            logMessage(`No se encontraron más productos en ${apiCountry}. Fin de listado alcanzado.`);
            return {
                success: true,
                data: []
            };
        }

        return {
            success: true,
            data: objects
        };

    } catch (error) {
        logMessage(`Excepción HTTP irrecuperable al contactar a Dropi API (${apiCountry}): ${error.message}`);
        return {
            success: false,
            data: []
        };
    }
};

module.exports = { fetchDropiProductsPage };