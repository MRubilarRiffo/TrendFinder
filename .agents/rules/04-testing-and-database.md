---
trigger: always_on
description: Reglas de pruebas automatizadas (Jest, SQLite en memoria, TDD) y directrices de persistencia con Sequelize ORM.
---

# Regla: Pruebas Automatizadas (TDD) y Persistencia con Sequelize

Esta regla define los estándares de calidad de código, cobertura de pruebas y modelado de datos para el ecosistema backend y frontend de TrendFinder.

---

## 1. Configuración y Ejecución de Pruebas (Jest)

- **Comando de Ejecución**: En la carpeta `api/`:
  ```bash
  npm test
  ```
- **Flag Obligatorio `--runInBand`**:
  - En `package.json`, el script `"test"` está configurado como `jest --runInBand`.
  - Esta configuración es **estrictamente necesaria** porque las pruebas de integración comparten la instancia de SQLite en memoria. La ejecución en hilos paralelos generaría condiciones de carrera y colisiones de estado entre suites.
- **Tolerancia Cero a Fallos**:
  - Toda la suite (actualmente con 84 tests distribuidos en 14 suites: unit, integration y e2e) debe mantenerse al **100% de aprobación**.
  - Si una modificación rompe una prueba existente, se debe solucionar antes de proceder con nuevos desarrollos.

---

## 2. Base de Datos Dual y Aislamiento en Pruebas

- **Entorno de Producción y Desarrollo**:
  - `NODE_ENV !== 'test'`: Conexión MySQL con pooling (`max: 5, min: 0, acquire: 30000, idle: 10000`) y credenciales de `.env`.
- **Entorno de Pruebas**:
  - `NODE_ENV === 'test'`: Inicializa SQLite en memoria (`sqlite3`) con almacenamiento `:memory:`.
  - El helper `tests/helpers/setupTestDb.js` orquesta la sincronización limpia (`conn.sync({ force: true })`) antes o después de cada suite de pruebas para asegurar aislamiento completo.

---

## 3. Principios de TDD (Test-Driven Development)

1. **Ciclo Red-Green-Refactor**:
    - Para nuevas métricas o cálculos financieros: escribir primero la prueba con los valores esperados de acuerdo con la fórmula teórica (ej. en `tests/unit/financialCalculations.test.js`).
    - Implementar el código mínimo necesario para hacer pasar la prueba.
    - Refactorizar manteniendo la prueba en verde.
2. **Prohibido el Acoplamiento a Detalles Internos**:
    - Las pruebas deben evaluar el comportamiento observable a través de las interfaces públicas (funciones o endpoints), no la implementación interna privada.
3. **Mocks de Red**:
    - En pruebas de integración del scraper y sincronización (`tests/integration/inventorySync.test.js`), simular siempre las respuestas de la API de Dropi con Jest mocks (`jest.mock(...)`), evitando peticiones HTTP reales a servidores de producción.

---

## 4. Modelado y Relaciones en Sequelize ORM

Los modelos residen en `api/src/models/` y sus asociaciones están centralizadas en `api/src/config/database.js`:

- **Relaciones Oficiales**:
  - `Product.hasOne(Stock)` / `Stock.belongsTo(Product)`: Cada registro de stock pertenece a un único producto.
  - `Product.hasMany(ProductSale)` / `ProductSale.belongsTo(Product)`: Historial de transacciones de venta asociadas por `ProductId`.
  - `Product.belongsToMany(Category, { through: 'ProductCategory' })`: Asociación muchos a muchos con categorías.
  - `Product.hasMany(SalesSnapshot)` / `SalesSnapshot.belongsTo(Product)`: Snapshots diarios precalculados por `ProductId`.
- **Transacciones Seguras**:
  - Toda mutación que afecte más de una tabla (por ejemplo, crear un producto y registrar su stock o registrar ventas en bloque) debe envolverse en una transacción de Sequelize (`conn.transaction()`) utilizando `transactionHelper.js`.
- **Estrategia de Índices**: Tablas con alto volumen de consultas temporales deben definir índices explícitos sobre columnas de filtrado (`saleDate`, `ProductId`, `dropiId`, `country`, `createdAt`) para evitar *Full Table Scans* en producción.
- **Pool de Conexiones**: En producción MySQL (cPanel / CloudLinux), Sequelize debe limitar su pool a valores seguros (`max: 5, min: 0, acquire: 30000, idle: 10000`) para evitar agotar las conexiones del hosting compartido.

---

## 5. Control de Calidad en Frontend (`web/`)

- Ejecutar `npm run lint` en la carpeta `web/` para verificar reglas de ESLint.
- No dejar variables declaradas sin usar (como imports obsoletos de React en React 19).
- Separar funciones y constantes de cálculo fuera de archivos de componentes cuando puedan interferir con Fast Refresh (`react-refresh/only-export-components`).
