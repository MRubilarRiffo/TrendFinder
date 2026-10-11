# Instrucciones del Proyecto — TrendFinder

Este archivo sirve como la guía maestra operativa, arquitectónica y de desarrollo para cualquier agente o desarrollador que trabaje en el repositorio **TrendFinder**.

---

## 📌 Descripción del Proyecto

**TrendFinder** es una plataforma de inteligencia de mercado y análisis de e-commerce diseñada para identificar productos ganadores, monitorear inventarios y analizar tendencias de ventas sobre el catálogo de **Dropi** en múltiples países (Colombia, Chile, México, Panamá, entre otros).

El repositorio está estructurado como un monorepo compuesto por:
- **`api/`**: Backend REST en Node.js (>= 18.x) con Express 5, Sequelize ORM (MySQL en producción y SQLite en memoria para tests), Jest para pruebas automatizadas y workers independientes para scraping y cálculo de snapshots.
- **`web/`**: Single Page Application (SPA) moderna desarrollada con React 19, Vite, React Router v7, React Icons, Axios y CSS Modules.
- **`docs/`**: Documentación técnica detallada sobre endpoints de la API y la especificación matemática del algoritmo **DropScore**.

---

## 🏛️ Estructura del Repositorio y Arquitectura

```
TrendFinder/
├── .agents/
│   └── rules/                                 # Reglas modulares del proyecto
│       ├── 01-clean-architecture.md           # Separación de capas y responsabilidades
│       ├── 02-dropscore-and-financial-domain.md # DropScore, finanzas COD y tendencias
│       ├── 03-dropi-adapter-and-workers.md    # Scraping, proxies, tokens y cron jobs
│       ├── 04-testing-and-database.md         # Jest, SQLite in-memory, Sequelize y TDD
│       ├── 05-security-and-environment.md     # Secretos, locks, rate limiting y sanitización
│       └── 06-git-workflow.md                 # SemVer, validaciones previas y commits
├── AGENTS.md                                  # Guía maestra para agentes (este archivo)
├── docs/                                      # Documentación funcional y técnica
│   ├── dropscore.md                           # Especificación matemática del DropScore
│   └── api/                                   # Documentación detallada de endpoints
│       ├── latest_products_endpoint.md
│       ├── product_stats_endpoint.md
│       └── sales_stats_endpoint.md
├── api/                                       # BACKEND EXPRESS + SEQUELIZE
│   ├── index.js                               # Entrada servidor HTTP, sync DB y graceful shutdown
│   ├── package.json
│   ├── jest.config.js
│   ├── src/
│   │   ├── adapters/                          # Integraciones con servicios externos
│   │   │   └── dropiApi/                      # Cliente Dropi, HttpsProxyAgent y rotationManager
│   │   ├── config/                            # Server, variables de entorno y base de datos
│   │   ├── controllers/                       # Controladores HTTP (products, sales)
│   │   ├── domain/                            # LÓGICA DE NEGOCIO PURA
│   │   │   ├── InventorySync/                 # Sincronización masiva de inventario y stocks
│   │   │   ├── ProductCatalogue/              # Catálogo y últimos productos agregados
│   │   │   ├── ProductPerformance/            # Rendimiento individual y analítica de producto
│   │   │   └── SalesPerformance/              # Ventas agregadas y paginación por cursor
│   │   ├── functions/                         # Fórmulas puras y utilidades de cálculo
│   │   │   ├── financialCalculations.js       # Precios sugeridos (COD y prepago) y márgenes
│   │   │   ├── salesCalculations.js           # DropScore, aceleración de tendencia, promedios y winsorizeDailySales
│   │   │   └── formatPrice.js                 # Formato de moneda por país (soporta DECIMAL)
│   │   ├── helpers/                           # LockManager (cPanel), cursorPagination, botState, logging y validaciones
│   │   │   ├── botState.js                    # Rastreo de timestamps y estado de corrida del scraper
│   │   │   ├── cursorPagination.js            # Serialización y deserialización Base64 de cursores HTTP
│   │   │   ├── lockManager.js                 # Control de concurrencia y candados huérfanos
│   │   │   ├── logMessage.js                  # Logging persistente y formateado
│   │   │   └── validations.js                 # Validadores transversales de país, ID y fechas
│   │   ├── middleware/                        # Rate limiting y error handling global sanitizado
│   │   ├── models/                            # Modelos Sequelize (Product, Stock, Category, etc.)
│   │   ├── repositories/                      # Acceso a base de datos y transacciones (SQL puro)
│   │   ├── routes/                            # Definición de rutas Express (/api/products, /api/sales)
│   │   ├── scripts/                           # Scripts de mantenimiento y saneamiento
│   │   │   └── sanitizeHistoricalSales.js     # Depuración transaccional de ventas anómalas
│   │   └── workers/                           # Workers independientes / cron tasks
│   │       ├── scraper/scraperRunner.js       # Ingesta concurrente de catálogo Dropi
│   │       └── snapshots/salesSnapshotRunner.js # Cálculo de snapshots (1, 7, 30 días)
│   └── tests/                                 # SUITE AUTOMATIZADA (Jest)
│       ├── helpers/setupTestDb.js             # Configuración de SQLite en memoria
│       ├── unit/                              # Tests unitarios de fórmulas, helpers y validadores
│       ├── integration/                       # Tests de rutas, sync de inventario, snapshots y 404
│       └── e2e/                               # Flujos completos end-to-end (Tracer Bullet)
└── web/                                       # FRONTEND REACT 19 + VITE
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                            # Router y layout general
        ├── main.jsx                           # Entrada React 19
        ├── index.css                          # Estilos globales y tema
        ├── components/                        # Componentes reutilizables con CSS Modules
        │   ├── DualLineChart/                 # Gráfica comparativa de ventas
        │   ├── FinancialInputsPanel/          # Calculadora interactiva de márgenes COD y constantes
        │   ├── SimpleLineChart/               # Gráfica lineal de evolución temporal
        │   └── SmartBadges/                   # Insignias visuales de DropScore y estados
        ├── pages/                             # Vistas de la aplicación
        │   ├── home/                          # Dashboard, catálogo, filtros y paginación
        │   └── product/                       # Ficha técnica, simulación financiera y métricas
        └── services/                          # Cliente HTTP Axios centralizado
            └── trendFinder.js
```

---

## ⚙️ Reglas de Desarrollo Obligatorias

### 1. Pureza del Dominio y Funciones de Cálculo (`api/src/functions/` & `api/src/domain/`)
- Los archivos en `api/src/functions/` (`salesCalculations.js`, `financialCalculations.js`, `formatPrice.js`) son **funciones puras**:
  - No deben interactuar con la base de datos, modelos Sequelize ni objetos `req`/`res` de Express.
  - Deben ser 100% deterministas, tolerantes a datos incompletos o atípicos y testeables sin mocks.
- La capa de dominio (`api/src/domain/`) orquesta la lógica de negocio y debe permanecer desacoplada de la capa de transporte HTTP (controladores) y de los detalles de red externos.

### 2. Algoritmo DropScore y Métricas Financieras
- El **DropScore** sintetiza la viabilidad comercial de un producto en un valor entero acotado entre `0` y `100`:
  $$DropScore = (P_{\text{perf}} \times 0.35) + (P_{\text{vol}} \times 0.35) + (P_{\text{growth}} \times 0.30) + \text{Bono}_{\text{breakout}}$$
  - **Margen COD ($P_{\text{perf}}$, 35%)**: evalúa el margen bruto contra entrega. Margen $\ge 80\% \to 100$ pts; $\le 20\% \to 0$ pts.
  - **Volumen diario ($P_{\text{vol}}$, 35%)**: normalizado sobre meta de 15 unidades diarias.
  - **Crecimiento de tendencia ($P_{\text{growth}}$, 30%)**: aceleración entre la segunda y la primera mitad del periodo evaluado.
  - **Bono de Despegue ($\text{Bono}_{\text{breakout}}$)**: +15 puntos para productos que arrancan desde 0 ventas con tracción reciente.
- **Visualización en Frontend**:
  - `85 - 100`: Excelente (Verde `#10b981`, insignia **GANADOR** con pulso animado).
  - `80 - 84`: Alto (Verde `#10b981`).
  - `50 - 79`: Medio (Ámbar/Naranja `#f59e0b`).
  - `0 - 49`: Bajo (Rojo `#ef4444`).

### 3. Adaptador Dropi, Evasión de Bloqueos y Resiliencia en Workers
- **Evasión de 405 Method Not Allowed en Proxies**: Se debe usar `HttpsProxyAgent` para crear túneles CONNECT puros. Esto previene que intermediarios proxy muten peticiones `POST` a `GET`.
- **Evasión de 429 ThrottleRequests (Laravel WAF)**: El worker debe utilizar rotación de tokens secuencial (Round-Robin) mediante `rotationManager.js` junto a una rotación aleatoria de proxies residenciales/datacenter.
- **Protección contra Bloqueos Huérfanos en cPanel (`lockManager.js`)**:
  - Todos los scripts de cron (`scraperRunner.js`, `salesSnapshotRunner.js`) **DEBEN** adquirir y liberar candados con `acquireLock()` y `releaseLock()`.
  - Candados con más de 2 horas de antigüedad se consideran huérfanos (por interrupción de procesos debido a límites LVE/CloudLinux en cPanel) y deben auto-limpiarse.
- **Guardrails de Ingesta y Detección de Ajustes de Proveedor (`processExistingProductsBatch.js`)**:
  - **Agotamiento Masivo (Stock Zeroing)**: Si el stock anterior era relevante ($\ge 30$) y cae a $\le 2$ en una sola lectura, se asume vaciado o pausa manual del proveedor. Se actualiza el stock a 0 pero **NO** se generan ventas.
  - **Velocidad Imposible en un Check**: Si la caída en un solo escaneo supera la velocidad máxima creíble ($\ge 75$ unidades en ~1h), se clasifica como retiro de lote del proveedor; se actualiza el stock sin registrar ventas fraudulentas.
  - **Rastreo de Estado del Bot (`botState.js`)**: Persiste `lastRunFinishedAt` para medir inactividad real del scraper sin depender del `updatedAt` de cada stock individual.
  - **Winsorization de Sparklines**: Filtrado estadístico robusto de picos aislados en `salesSnapshotRunner.js` y `ProductPerformanceService.js` mediante `winsorizeDailySales`.

### 4. Base de Datos y Sequelize ORM
- La configuración de base de datos es **dual**:
  - `NODE_ENV === 'test'`: SQLite en memoria (`:memory:`), sin dependencias externas.
  - Producción / Desarrollo: MySQL utilizando las credenciales configuradas en `.env`.
- Operaciones en lote (`bulkCreate`, sincronización masiva) deben ejecutarse preferentemente dentro de transacciones gestionadas mediante `transactionHelper.js`.
- Los snapshots de ventas (`SalesSnapshot`) deben precalcularse a medianoche en días calendario cerrados para garantizar consistencia en rangos de 1, 7 y 30 días.

### 5. Frontend React 19 y Calidad de Código
- La interfaz de usuario utiliza React 19 y CSS Modules para encapsular estilos.
- Mantener la separación de responsabilidades: los componentes de visualización (`SmartBadges`, `DualLineChart`) deben recibir datos ya formateados y no acoplarse a detalles de llamadas Axios.
- Código limpio: no dejar imports no utilizados (por ejemplo `import React from 'react'`) para mantener `npm run lint` en 0 errores.
- Separar constantes fuera de archivos de componentes para respetar Fast Refresh (`react-refresh/only-export-components`).

### 6. Seguridad HTTP, Validación y Desacoplamiento de Transporte
- **Validación Estricta (400 Bad Request)**: Los controladores HTTP deben validar exhaustivamente parámetros de entrada (`query`, `params`) antes de tocar los servicios de dominio o persistencia:
  - `:id`: debe ser un entero positivo (`validatePositiveIntegerId`).
  - Fechas: formato ISO `YYYY-MM-DD` con `startDate <= endDate` (`validateDateRange`).
  - Países: deben validarse contra la lista oficial mediante `normalizeCountry`.
  - Paginación y ordenamiento: `days` en `[1, 7, 30]`, `sortBy` indexado, `limit` acotado estrictamente a `[1, 50]`.
- **Handler 404 en JSON**: Rutas inexistentes deben retornar siempre `{ success: false, error: 'Ruta no encontrada' }` con status 404 (nunca HTML por defecto de Express).
- **Sanitización de Errores 500**: En producción (`NODE_ENV === 'production'`), `errorMiddleware` debe retornar `'Error interno del servidor'` para evitar fugar nombres de tablas o stack traces de MySQL.
- **Desacoplamiento de Cursores**: La capa de persistencia (`SalesRepository.js`) solo recibe y retorna datos SQL planos. La codificación y decodificación de cursores Base64 es responsabilidad exclusiva de la capa HTTP (`cursorPagination.js`).

---

## 🧪 Pruebas Automatizadas (TDD)

- **Backend (`api/`)**:
  - Test runner: **Jest** configurado con `--runInBand` para evitar colisiones en la base de datos en memoria.
  - Ejecución: `npm test` en el directorio `api/`.
  - La suite actual cuenta con **98 pruebas** distribuidas en **15 suites** cubriendo tests unitarios, de integración y flujos end-to-end.
  - **REGLA OBLIGATORIA**: Nunca enviar cambios al repositorio sin ejecutar `npm test` y confirmar que el 100% de las pruebas aprueben.
- **Frontend (`web/`)**:
  - Ejecutar `npm run lint` para verificar cumplimiento de reglas de ESLint y Fast Refresh de React.

---

## 🚀 Flujo de Git Commit & Push (Estándar del Repositorio)

Siempre que se realicen commits o se suban cambios al repositorio remoto, se debe cumplir estrictamente el procedimiento del skill global `git-commit-push`:

1. **Verificación de Tests y Linter**:
   - `npm test` en `api/` debe terminar con 0 fallos.
   - `npm run lint` en `web/` debe terminar sin errores bloqueantes.
2. **Bump de Versión en `package.json`**:
   - `feat:` (nueva funcionalidad) → **MINOR**
   - `fix:`, `refactor:`, `docs:` → **PATCH**
   - Breaking changes → **MAJOR**
3. **Validación de Archivos Sensibles**:
   - **NUNCA** incluir en el commit: `.env`, `.env.*`, `tokens.txt`, `proxies.txt`, `*.lock`, `logs/`, ni `package-lock.json`.
4. **Mensaje de Commit Estructurado**:
   ```
   <tipo>(<ámbito>): <descripción corta en imperativo>

   - Contexto del cambio y justificación.
   - Detalles técnicos clave.
   - Verificación realizada (tests aprobados, linter, etc.).
   ```
