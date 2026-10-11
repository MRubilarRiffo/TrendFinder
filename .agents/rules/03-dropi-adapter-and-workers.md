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
- **Generación de Sparklines**: Construir un array temporal estructurado con las ventas por día del producto dentro del periodo evaluado para permitir visualizaciones gráficas rápidas en el frontend (aplicando winsorización de picos mediante `winsorizeDailySales`).

---

## 5. Guardrails de Ingesta y Rastreo de Estado del Scraper (`processExistingProductsBatch` & `botState`)

Para evitar inferir falsas ventas derivadas de manipulaciones de stock por parte de proveedores (retiro masivo de stock, cambios de almacén, pausas de catálogo) o de paradas del scraper:

1. **Detección de Vaciado/Agotamiento Masivo (Stock Zeroing)**:
   - Si el stock anterior del producto era significativo ($\text{stockAnterior} \ge 30$) y el nuevo stock cae drásticamente a casi cero ($\text{stockNuevo} \le 2$) en una sola verificación, se clasifica como vaciado manual o pausa del proveedor.
   - El stock en base de datos se actualiza a 0, pero **NO se generan registros de venta** (`quantitySold = 0`).
2. **Límite de Velocidad Máxima por Verificación (Single-Check Velocity Cap)**:
   - En una verificación individual de rutina (intervalo de ~1 hora), ningún producto en la plataforma vende físicamente cientos de unidades.
   - Si la caída de stock excede la velocidad creíble:
     $$\text{maxCredibleUnits} = \max(75, \text{hoursOffline} \times 30)$$
     se clasifica como un ajuste de lote del proveedor. El stock se actualiza al nuevo valor real sin emitir transacciones fraudulentas de venta.
3. **Tope de Redistribución Retroactiva**:
   - Cuando el scraper estuvo apagado varias horas o días, las ventas legítimas calculadas entre la diferencia de stock se reparten proporcionalmente entre los días de inactividad, con un límite seguro de máximo 250 unidades/día.
4. **Desacoplamiento del Tiempo Offline (`botState.js`)**:
   - `Stock.updatedAt` no refleja el momento del último barrido del scraper si el stock no cambió durante semanas.
   - Por tanto, el scraper persiste `lastRunFinishedAt` en `bot_state.json` al concluir cada ciclo.
   - El cálculo de horas offline evalúa prioritariamente la inactividad real del bot global (`getBotOfflineHours()`), previniendo repartos retroactivos erróneos sobre productos con timestamps locales obsoletos.
