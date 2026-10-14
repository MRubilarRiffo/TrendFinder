# Guía del Agente — Backend REST API & Workers (TrendFinder API)

Este archivo define las directrices arquitectónicas, de persistencia, scraping, seguridad y pruebas para el backend ubicado en `api/`.

---

## 📌 Visión General del Backend

El backend de **TrendFinder** es una API REST construida sobre:
- **Node.js (>= 18.x)** con **Express 5**.
- **Sequelize ORM** con base de datos dual: **MySQL** en producción/desarrollo y **SQLite en memoria** (`:memory:`) para pruebas automatizadas.
- **Jest** para testing automatizado estricto (`npm test`).
- **Workers independientes** para scraping concurrente del catálogo de Dropi y pre-cálculo de snapshots analíticos de ventas (1, 7 y 30 días).

---

## 🏛️ Clean Architecture y Separación de Capas (`src/`)

```
api/src/
├── adapters/          # Integraciones con servicios externos (Dropi API, proxies, rotación)
├── config/            # Servidor HTTP, variables de entorno y conexión Sequelize
├── controllers/       # Controladores HTTP (validación y formato de respuesta)
├── domain/            # Lógica de negocio pura (orquestación sin transporte HTTP)
├── functions/         # Fórmulas puras y deterministas (DropScore, finanzas, formato)
├── helpers/           # Utilidades (lockManager, cursorPagination, botState, logMessage)
├── middleware/        # Rate limiting, helmet y error handling sanitizado
├── models/            # Definición de modelos Sequelize
├── repositories/      # Acceso exclusivo a BD y transacciones SQL puras
├── routes/            # Definición de rutas Express (/api/products, /api/sales)
├── scripts/           # Tareas de mantenimiento y saneamiento de datos
└── workers/           # Cron tasks independientes (scraperRunner, salesSnapshotRunner)
```

### Reglas de Capas:
1. **Funciones Matemáticas Puras (`src/functions/`)**:
   - `salesCalculations.js`, `financialCalculations.js`, `formatPrice.js`.
   - **PROHIBIDO** importar modelos de Sequelize, conexiones a BD o llamadas de red.
   - **PROHIBIDO** manipular objetos `req` o `res` de Express.
   - 100% deterministas y testeadas sincrónicamente sin mocks.
2. **Capa de Dominio (`src/domain/`)**:
   - Orquesta la lógica del negocio sin depender de frameworks HTTP.
   - No debe manipular códigos de estado HTTP ni emitir respuestas (`res.json()`). Retorna estructuras limpias de datos o lanza errores de dominio con código opcional (`error.statusCode = 404`).
3. **Capa de Repositorios y Persistencia (`src/repositories/`)**:
   - Encapsula consultas a la base de datos a través de Sequelize.
   - Los repositorios son Driven Adapters de SQL puro. **PROHIBIDO** codificar o decodificar Base64 o parsear cursores HTTP aquí; la serialización de cursores pertenece exclusivamente a la capa HTTP (`cursorPagination.js`).
   - Soporte transaccional gestionado con `transactionHelper.js`.
4. **Adaptadores Externos (`src/adapters/dropiApi/`)**:
   - Encapsula la conexión a la API externa de Dropi, agentes proxy (`HttpsProxyAgent`) y rotación de tokens.
5. **Controladores y Rutas (`src/controllers/` y `src/routes/`)**:
   - Parsean y validan exhaustivamente los parámetros de entrada (`query`, `params`, `body`) antes de tocar el dominio.
   - Retornan `400 Bad Request` ante entradas inválidas.
   - Formatean respuestas uniformes `{ success: true, data: [...] }` con status apropiados (`200`, `400`, `404`, `500`).

---

## 🗄️ Base de Datos y Modelado con Sequelize

1. **Estrategia Dual**:
   - `NODE_ENV === 'test'`: SQLite en memoria (`sqlite3`, `:memory:`), sin dependencias externas.
   - Producción / Desarrollo: MySQL con pooling controlado (`max: 5, min: 0, acquire: 30000, idle: 10000`) para no agotar conexiones en hosting compartido (cPanel).
2. **Relaciones Oficiales**:
   - `Product.hasOne(Stock)` / `Stock.belongsTo(Product)`.
   - `Product.hasMany(ProductSale)` / `ProductSale.belongsTo(Product)`.
   - `Product.belongsToMany(Category, { through: 'ProductCategory' })`.
   - `Product.hasMany(SalesSnapshot)` / `SalesSnapshot.belongsTo(Product)`.
3. **Transacciones Seguras**:
   - Toda mutación múltiple (crear producto + stock o registrar ventas en bloque) debe envolverse en una transacción de Sequelize (`conn.transaction()`) utilizando `transactionHelper.js`.
4. **Estrategia de Índices**:
   - Índices explícitos sobre columnas de alto volumen y filtrado temporal (`saleDate`, `ProductId`, `dropiId`, `country`, `createdAt`).

---

## 🕷️ Adaptador Dropi, Proxies y Resiliencia en Workers

1. **Evasión de 405 Method Not Allowed en Proxies**:
   - Al realizar peticiones `POST` a Dropi a través de proxies, intermediarios pueden mutar la petición a `GET`.
   - **OBLIGATORIO**: Usar siempre `HttpsProxyAgent` de `https-proxy-agent` con `proxy: false` en Axios para crear túneles TCP `CONNECT` puros.
2. **Evasión de 429 ThrottleRequests (Laravel WAF)**:
   - Rotación secuencial de tokens (Round-Robin) mediante `rotationManager.js`.
   - Rotación aleatoria de proxies desde `config/proxies.txt` (con fallback transparente a IP local).
   - Reintentos con backoff progresivo (hasta 5 intentos).
3. **Control de Concurrencia y Candados en cPanel (`lockManager.js`)**:
   - Workers (`scraperRunner.js`, `salesSnapshotRunner.js`) **DEBEN** llamar `acquireLock(LOCK_FILE, maxAgeHours)` y `releaseLock(LOCK_FILE)`.
   - Candados con más de 2 horas de antigüedad se consideran huérfanos (por interrupción de CloudLinux LVE en cPanel) y se auto-limpian automáticamente.
4. **Guardrails de Ingesta y Detección de Ajustes de Proveedor**:
   - **Agotamiento Masivo (Stock Zeroing)**: Si el stock anterior era $\ge 30$ y cae a $\le 2$ en una sola lectura, se asume vaciado manual o pausa del proveedor. Se actualiza el stock a 0 pero **NO** se generan ventas.
   - **Velocidad Máxima por Verificación**: Si la caída en un escaneo supera $\max(75, \text{hoursOffline} \times 30)$, se clasifica como retiro de lote; se actualiza el stock sin ventas ficticias.
   - **Rastreo de Estado del Bot (`botState.js`)**: Persiste `lastRunFinishedAt` para medir inactividad real del scraper sin depender del timestamp individual de cada producto.
   - **Snapshots de Medianoche**: Generación de snapshots de 1, 7 y 30 días cerrados a medianoche con sparklines tratadas mediante `winsorizeDailySales`.

---

## 🔒 Seguridad HTTP y Validación

1. **Validación Exhaustiva (400 Bad Request)**:
   - `:id`: debe ser entero positivo (`validatePositiveIntegerId`).
   - Fechas: ISO `YYYY-MM-DD` con `startDate <= endDate` (`validateDateRange`).
   - Países: validados mediante lista blanca con `normalizeCountry`.
   - Paginación: `limit` acotado estrictamente a `[1, 50]`.
   - Búsqueda (`/api/products/search`): `q` requerido (2 a 100 caracteres), sanitización de comodines SQL (`%` y `_`) vía `extractSearchTokens`.
2. **Handler 404 JSON**:
   - Rutas no existentes deben retornar `{ success: false, error: 'Ruta no encontrada' }` con status 404. Nunca páginas HTML por defecto de Express.
3. **Sanitización de Errores 500**:
   - En producción (`NODE_ENV === 'production'`), `errorMiddleware` debe responder con `'Error interno del servidor'` sin filtrar trazas de MySQL o nombres de tablas.
4. **Rate Limiting y Cabeceras**:
   - `limiterMiddleware`: 50 peticiones / 15 min por IP.
   - `helmet()` activo para cabeceras de protección.

---

## 🧪 Pruebas Automatizadas (TDD)

- **Test Runner**: Jest configurado con `--runInBand` en `package.json` para evitar colisiones en la base de datos SQLite en memoria.
- **Ejecución**:
  ```bash
  npm test
  ```
- **Tolerancia Cero**: El 100% de las suites (unitarias, integración y e2e) debe pasar antes de dar cualquier tarea por concluida.
- **Mocks de Red**: Pruebas de integración del scraper y sincronización deben mockear siempre las respuestas de la API de Dropi con `jest.mock()`.
