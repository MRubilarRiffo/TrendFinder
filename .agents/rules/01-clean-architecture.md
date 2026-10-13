---
trigger: always_on
description: Reglas de Clean Architecture y separación de responsabilidades entre Dominio, Funciones, Repositorios, Adaptadores, Controladores y Frontend.
---

# Regla: Clean Architecture y Separación de Responsabilidades

Este repositorio aplica una arquitectura limpia desacoplada para garantizar que las reglas de negocio, los algoritmos matemáticos y las operaciones de base de datos se mantengan independientes de los protocolos de transporte y de las APIs externas.

---

## 1. Capa de Funciones Matemáticas Puras (`api/src/functions/`)

- **Archivos**: `salesCalculations.js`, `financialCalculations.js`, `formatPrice.js`.
- **Regla de Oro**: Son funciones puras y deterministas.
  - **PROHIBIDO** importar modelos de Sequelize, conexiones a BD o llamadas de red.
  - **PROHIBIDO** manipular o recibir objetos `req`, `res` de Express.
  - Deben ser completamente independientes y testeables mediante pruebas unitarias rápidas y sincrónicas.
- **Responsabilidad**:
  - `salesCalculations.js`: Fórmulas de DropScore, cálculo de promedios ponderados por días reales activos, aceleración logarítmica de tendencias, detección de despegues (`isBreakout`) y winsorización de picos atípicos (`winsorizeDailySales`).
  - `financialCalculations.js`: Modelos de rentabilidad COD (Cash on Delivery) y prepago, factoring de comisiones, fletes, devoluciones y CPA.
  - `formatPrice.js`: Formateo de monedas según estándar internacional (`COP`, `CLP`, `MXN`, `USD`).

---

## 2. Capa de Dominio (`api/src/domain/`)

- **Módulos principales**:
  - `ProductPerformance/`: Orquesta la evaluación estadística de un producto (`resolveEvaluationPeriod`, cálculo de métricas financieras y tendencias sobre datos del repositorio).
  - `InventorySync/`: Sincronización en lotes de productos existentes y nuevos (`processExistingProductsBatch`, `processNonexistentProductsBatch`).
  - `ProductCatalogue/`: Lógica de ordenamiento y filtrado de catálogo.
  - `SalesPerformance/`: Paginación basada en cursor para grandes volúmenes de ventas y snapshots.
- **Directrices**:
  - La capa de dominio orquesta servicios y repositorios sin depender de frameworks HTTP.
  - No debe manejar códigos de estado HTTP directamente (`res.status(200)`), sino retornar estructuras limpias de datos o lanzar errores de dominio con código de estado opcional (`error.statusCode = 404`).

---

## 3. Capa de Repositorios y Persistencia (`api/src/repositories/`)

- **Archivos**: `ProductPerformanceRepository.js`, `SalesRepository.js`, `LatestProductsRepository.js`, `ProductSearchRepository.js`, `StockRepository.js`, `ProductAdminRepository.js`, etc.
- **Responsabilidad**:
  - Encapsular todas las consultas a la base de datos a través de modelos Sequelize (`Product`, `Stock`, `ProductSale`, `SalesSnapshot`, `Category`).
  - Abstraer las peculiaridades de SQL (compatibilidad entre MySQL en producción y SQLite en tests).
  - Proporcionar soporte transaccional seguro mediante `transactionHelper.js`.
- **Regla**: Ningún controlador debe ejecutar queries directas con Sequelize; siempre debe delegar en la capa de repositorios o servicios de dominio.
- **Pureza de Persistencia**: Los repositorios son Driven Adapters de SQL puro. **PROHIBIDO** codificar o decodificar Base64, parsear tokens de paginación o conocer detalles de transporte HTTP dentro de los repositorios. La serialización de cursores pertenece a los helpers de la capa HTTP (`cursorPagination.js`).

---

## 4. Capa de Adaptadores Externos (`api/src/adapters/dropiApi/`)

- **Archivos**: `dropiApiService.js`, `rotationManager.js`.
- **Responsabilidad**:
  - Conexión con la API externa de Dropi.
  - Encapsular la lógica de agentes proxy (`HttpsProxyAgent`), mitigación de bloqueos y rotación de tokens de integración.
  - Traducir respuestas externas a estructuras internas normalizadas.

---

## 5. Capa de Controladores y Rutas (`api/src/controllers/` & `api/src/routes/`)

- **Archivos**: `controllers/products/*.js`, `controllers/sales/*.js`, `routes/*.js`.
- **Responsabilidad**:
  - Parsear y validar parámetros de entrada (`query`, `params`, `body`) antes de tocar el dominio:
    - Retornar `400 Bad Request` ante entradas inválidas (`:id` no numérico/negativo, `startDate > endDate`, `country` no soportado, etc.).
  - Invocar los servicios correspondientes de la capa de dominio.
  - Formatear la respuesta HTTP en JSON uniforme (`{ success: true, data: [...] }`) y retornar el código de estado adecuado (`200`, `400`, `404`, `500`).
  - Aplicar middlewares de seguridad y limitación de tasa (`limiterMiddleware`).

---

## 6. Frontend Desacoplado (`web/src/`)

- **Servicios (`web/src/services/`)**: Centralizar todas las peticiones a la API en `trendFinder.js`. No hacer llamadas `axios.get()` directamente dentro de los componentes JSX.
- **Componentes (`web/src/components/`)**: Componentes puros de interfaz (`SmartBadges`, `DualLineChart`, `FinancialInputsPanel`, `ProductSearch`) con CSS Modules específicos.
- **Vistas (`web/src/pages/`)**: `Home` y `ProductDetails` gestionan el estado y orquestan los componentes de visualización.
