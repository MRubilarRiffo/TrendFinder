---
trigger: always_on
description: Reglas operativas para scraping de Dropi, rotación de proxies/tokens, evasión de WAF (429/405) y ejecución de Workers/Crons en cPanel.
---

# Regla: Adaptador Dropi, Evasión de Bloqueos y Workers

Esta regla establece las directrices críticas para la comunicación con la API de Dropi, la gestión de proxies y tokens, y la ejecución confiable de tareas en segundo plano en entornos con límites estrictos de recursos (como cPanel / CloudLinux LVE).

---

## 1. Conexión HTTP con Dropi y Evasión de Errores

### Prevención de Error HTTP 405 (Method Not Allowed) en Proxies
- Al realizar peticiones `POST` a través de servidores proxy HTTP convencionales, muchos intermediarios mutan la petición a `GET` o descartan el cuerpo de datos, provocando respuestas `405 Method Not Allowed` desde los servidores de Dropi.
- **REGLA OBLIGATORIA**: Todas las peticiones con proxy **DEBEN** utilizar `HttpsProxyAgent` de la librería `https-proxy-agent`.
- Desactivar siempre el proxy nativo de Axios (`proxy: false`) al asignar `httpsAgent: new HttpsProxyAgent(proxyUrl)`. Esto garantiza un túnel TCP `CONNECT` transparente que preserva el método `POST` y el payload intactos.

### Mitigación de Error HTTP 429 (ThrottleRequests de Laravel WAF)
- La API de Dropi implementa limitación de tasa por IP y por token (`dropi-integration-key`).
- **Rotación Secuencial de Tokens**: Utilizar siempre `rotationManager.js` para rotar de forma circular (Round-Robin) entre los tokens disponibles cargados desde `config/tokens.txt`.
- **Rotación de Proxies**: Seleccionar un proxy aleatorio en cada intento mediante `getRandomProxy()`. Si no hay proxies configurados en `config/proxies.txt`, registrar advertencia y proceder por la IP local.
- **Estrategia de Reintentos**: Configurar hasta 5 reintentos por página con backoff progresivo y log detallado antes de descartar un lote.

---

## 2. Ingesta Concurrente y Escalonamiento (`scraperRunner.js`)

- Para procesar grandes volúmenes de catálogo sin saturar el Event Loop de Node.js:
  - Disparar peticiones concurrentes en bloques pequeños (`pagesPerBatch = 3` por defecto).
  - Aplicar un micro-escalonamiento de 150 ms (`setTimeout(..., i * 150)`) entre las llamadas del mismo bloque.
  - Resolver el bloque con `Promise.all()` antes de proceder a la inserción/actualización en base de datos.
- **Procesamiento de Lotes en Base de Datos**:
  - Dividir los productos recibidos en dos conjuntos: productos ya existentes con stock vs productos no existentes.
  - Ejecutar `processExistingProductsBatch` y `processNonexistentProductsBatch` utilizando transacciones para evitar inconsistencias en caso de fallo parcial.

---

## 3. Control de Concurrencia y Candados en cPanel (`lockManager.js`)

En entornos cPanel, los procesos cron pueden ser terminados abruptamente por el administrador de recursos (CloudLinux LVE) si sobrepasan la memoria o CPU asignada, dejando archivos `.lock` huérfanos que impiden ejecuciones futuras.

### Normas de Uso de `acquireLock` y `releaseLock`:
1. **Adquisición obligatoria**: Todo worker (`scraperRunner.js`, `salesSnapshotRunner.js`) debe invocar `acquireLock(LOCK_FILE, maxAgeHours)` al inicio.
2. **Detección de solapamiento**: Si el archivo `.lock` existe y su antigüedad es menor al umbral (`maxAgeHours`, por defecto 2 horas), abortar inmediatamente la ejecución con mensaje informativo para evitar procesos duplicados.
3. **Liberación de candados huérfanos**: Si el candado supera las 2 horas, `lockManager` debe eliminarlo automáticamente, registrar el evento y adquirir uno nuevo.
4. **Liberación limpia**: Al concluir con éxito o en bloques `finally`, invocar siempre `releaseLock(LOCK_FILE)`.

---

## 4. Snapshots Periódicos de Ventas (`salesSnapshotRunner.js`)

- Los snapshots precalculan métricas para periodos de **1**, **7** y **30** días para alimentar el endpoint `/api/sales` con latencia submilisegundo.
- **Cierre a medianoche**: Las fechas deben truncarse a `00:00:00.000` de días calendario completos para que las comparaciones temporales no varíen minuto a minuto durante el día.
- **Idempotencia**: Cada ejecución debe reemplazar limpiamente los snapshots anteriores para el periodo en turno, evitando registros duplicados.
- **Generación de Sparklines**: Construir un array temporal estructurado con las ventas por día del producto dentro del periodo evaluado para permitir visualizaciones gráficas rápidas en el frontend.
