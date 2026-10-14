# Guía de Resiliencia de Red, Proxies y Evasión de Bloqueos

Esta guía documenta la infraestructura de red implementada en `api/src/adapters/dropiApi/` para evadir los sistemas de protección perimetral y rate limits de la API de Dropi.

---

## 📌 1. Los Desafíos de Red con Dropi

La API de Dropi cuenta con dos capas principales de protección:
1. **Laravel WAF (`ThrottleRequests`)**: Aplica límites estrictos de peticiones por minuto basándose en la dirección IP de origen y la clave de integración (`dropi-integration-key`). Si se superan, responde con `HTTP 429 Too Many Requests`.
2. **Cortafuegos Perimetral (Cloudflare)**: Analiza el comportamiento de las conexiones HTTP y bloquea solicitudes con cabeceras anómalas o proxies mal configurados.

---

## 🛡️ 2. El Problema de los Proxies Transparentes y `HTTP 405`

Al enviar peticiones `POST` a través de proxies HTTP estándar, muchos intermediarios mutan la petición a `GET` o descartan el cuerpo del payload JSON, causando que Dropi rechace la petición con:
```
HTTP 405 Method Not Allowed
```

### Solución Arquitectónica: Túneles TCP `CONNECT` con `HttpsProxyAgent`

En [`dropiApiService.js`](../../api/src/adapters/dropiApi/dropiApiService.js), cada solicitud se configura de la siguiente forma:

```javascript
const { HttpsProxyAgent } = require('https-proxy-agent');

const axiosConfig = {
    url: apiUrl,
    method: 'POST',
    headers: headers,
    data: body,
    timeout: 30000 // 30s de timeout
};

if (proxyUrl) {
    // Establece un túnel TCP CONNECT ciego de extremo a extremo
    axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.proxy = false; // DESACTIVA el proxy transparente de Axios
}
```

Al deshabilitar `axiosConfig.proxy = false` y pasar `httpsAgent`, el cliente establece una conexión directa por túnel `CONNECT`. El proxy únicamente retransmite bytes TCP cifrados sin poder inspeccionar ni alterar el método `POST` o las cabeceras.

---

## 🌐 3. Configuración del Pool de Proxies (`proxies.txt`)

Ubicación del archivo:
```
api/src/adapters/dropiApi/config/proxies.txt
```

### Formatos Soportados por Línea:
El analizador en `rotationManager.js` admite:
- **Con autenticación básica**: `host:port:user:pass` (se convierte a `http://user:pass@host:port`).
- **Con autenticación en URL**: `http://user:pass@host:port`.
- **Sin autenticación (IP Whitelist)**: `host:port`.

### Comportamiento de Fallback:
Si el archivo `proxies.txt` no existe o está vacío, el sistema no se detiene: emite un mensaje informativo en log y realiza las peticiones saliendo directamente por la **IP pública del servidor cPanel**.

---

## 🔑 4. Rotación Secuencial de Tokens (Round-Robin) (`tokens.txt`)

Ubicación del archivo:
```
api/src/adapters/dropiApi/config/tokens.txt
```

Para distribuir el volumen de peticiones y evitar el agotamiento de cuotas por usuario:
1. `rotationManager.js` carga los tokens a un array en memoria.
2. La función `getSequentialToken()` entrega secuencialmente un token distinto en cada ráfaga o página consultada (`token[i++ % N]`).
3. Si `tokens.txt` no existe, se utiliza el token base configurado en las variables de entorno (`configByCountries`).
4. **Protección en Logs**: Por directrices de seguridad, los logs nunca imprimen el token completo, sino fragmentos ofuscados como:
   `Token: ...${currentToken.substring(86, 130)}...`

---

## 🔁 5. Estrategia de Reintentos y Concurrencia

- **Reintentos por Página**: Hasta **5 intentos** (`maxRetries = 5`).
- **Rotación Aleatoria en Fallo**: Si un proxy falla por timeout o error de socket, el siguiente reintento selecciona inmediatamente otro proxy aleatorio del pool.
- **Ráfagas Concurrentes Escalonadas**: En `scraperRunner.js`, las páginas se procesan en lotes de 3 (`pagesPerBatch = 3`) con un retardo de 150 ms entre peticiones para no bloquear el *Event Loop* local.
