# TrendFinder

TrendFinder es una aplicación Node.js enfocada en la recolección, orquestación y almacenamiento de datos provenientes de la API de **Dropi** (Dropi Chile). Utiliza algoritmos avanzados de rotación de proxies y tokens para evadir medidas de mitigación y Web Application Firewalls (WAF) garantizando una ingesta constante y confiable de catálogos de productos a gran escala.

## Características Principales

- **Scraper Concurrente V3:** Orquestación mediante ráfagas concurrentes para maximizar la velocidad de recolección de múltiples páginas simultáneamente.
- **Evasión de WAF Avanzada:** Mediante integraciones como `https-proxy-agent` evita bloqueos 405 (mutación de POST en túneles) y distribuye inteligentemente el tráfico utilizando proxy lists (Webshare).
- **Rotación Estratégica:** Implementación de algoritmos iterativos (Round Robin) para tokens y selección inteligente de proxies para evadir bloqueos por rate-limit (Http 429).
- **Procesamiento Asíncrono en DB:** Integración con Sequelize/MySQL capaz de evaluar, discriminar e insertar (BulkCreate) macro-bloques de productos nuevos y actualizados de manera veloz.
- **Robustez y Resiliencia:** Tolerancia a fallos con reintentos programados (`maxRetries`), tiempos de *cooldown* y *failovers* para HTTP 502/503.

## Tecnologías Utilizadas

- **Runtime:** [Node.js](https://nodejs.org/)
- **Servidor:** [Express.js](https://expressjs.com/) (con `helmet`, `cors`, `morgan` y limita tráfico con `express-rate-limit`)
- **Base de Datos:** [MySQL](https://www.mysql.com/) modelada a través de [Sequelize ORM](https://sequelize.org/)
- **Cliente HTTP:** [Axios](https://axios-http.com/) complementado con `https-proxy-agent` para túneles limpios CONNECT.

## Requisitos Previos

Antes de ejecutar este proyecto, asegúrate de tener instalado:
- **Node.js**: v16.x o superior
- **NPM**: v8.x o superior
- **MySQL**: Motor de bases de datos corriendo local o remotamente.

## Instalación y Despliegue

1. **Clonar el Repositorio:**
   ```bash
   git clone https://github.com/MRubilarRiffo/TrendFinder.git
   cd TrendFinder
   ```

2. **Instalar Dependencias:**
   ```bash
   npm install
   ```

3. **Configuración de Entorno:**
   Copia el archivo de ejemplo para crear tus variables en un nuevo archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   *Rellena el `.env` con las credenciales de tu base de datos y la llave maestra (master token) si aplica.*

4. **Configurar Componentes Evasivos (OPCIONAL/RECOMENDADO):**
   Para hacer uso completo del Rotator, crea los siguientes archivos en la carpeta `src/config/`:
   - `src/config/proxies.txt` -> Agrega un proxy por línea en formato HTTP.
   - `src/config/tokens.txt` -> Agrega lista complementaria de *Bearer tokens* o *integration-keys* para hacer split de límites 429.

## Uso

Para arrancar el orquestador en ambiente de pruebas (desarrollo):

```bash
npm run dev
```

*(Correrá el servidor Express puerto local y el observador `nodemon` detectará cambios automáticamente).*

Para correr la versión final en producción:

```bash
npm start
```

## API Endpoints (Referencia Rápida)

La aplicación expone principalmente estadísticas computadas que extraen valor de nuestra ingesta de Dropi. A continuación las rutas principales:

### 1. Estadísticas Globales de Ventas

Endpoint paginado de alto rendimiento que evalúa e hidrata con historiales al LeaderBoard de productos con mayor rentabilidad o ventas de la Base de Datos.

**Ruta:** `GET /api/sales/`

**Parámetros Query:**
- `startDate` (opcional): Fecha inicial formato `YYYY-MM-DD`.
- `endDate` (opcional): Fecha final formato `YYYY-MM-DD`.
- `days` (opcional): Retroceso histórico dinámico en días si no se proveen fechas. Default: 7.
- `sortBy` (opcional): Método de ordenamiento prioritario: `'profit'` (Rentabilidad bruta) o `'sales'` (Total unidades). Default: `'profit'`.
- `page` (opcional): Índice de paginación. Default: 1.
- `country` (opcional): Filtro estricto por país de métrica.

**Ejemplo de Petición:**
`/api/sales/?sortBy=sales&page=2&startDate=2026-02-01&endDate=2026-02-28`

**Estructura de Respuesta:**
El motor asiste la paginación con metadatos:
```json
{
  "success": true,
  "totalSalesRecords": 5834,
  "daysIncluded": 28,
  "pagination": {
      "totalProducts": 5834,
      "totalPages": 584,
      "currentPage": 2,
      "limit": 10
  },
  "data": [
      {
          "productId": 2811,
          "name": "Lampara Led de Emergencia",
          "country": "Chile",
          "image": "https://url.com/img.webp",
          "price": 21000,
          "suggestedPrice": 36990,
          "unitProfit": 15990,
          "totalQuantitySold": 491,
          "totalRevenue": 10311000,
          "totalProfit": 7851090,
          "trendGrowthInfo": {
              "growthPercentage": 45,
              "isTrendingUp": true,
              "isDying": false
          },
          "salesHistory": [
              {
                  "date": "2026-02-01",
                  "quantity": 30,
                  "revenue": 630000,
                  "profit": 479700
              }
          ]
      }
  ]
}
```

### 2. Estadísticas Individuales de Producto

Analítica profunda (Deep-Dive) para un producto específico, calculando variables de Crecimiento Diarios (`trendGrowthPercentage`) y sus picos máximos.

**Ruta:** `GET /api/products/stats/:id`

**Parámetros de Ruta (Path):**
- `:id` (Requerido): ID numérico primario del producto en BD.

**Parámetros Query:**
- `startDate` (opcional): Fecha inicial formato `YYYY-MM-DD`.
- `endDate` (opcional): Fecha final formato `YYYY-MM-DD`.
- `country` (opcional): Filtro estricto por país.

**Ejemplo de Petición:**
`/api/products/stats/2811?startDate=2026-02-01`

**Estructura de Respuesta:**
```json
{
    "success": true,
    "period": {
        "startDate": "2026-02-01",
        "endDate": "2026-02-27",
        "daysEvaluated": 27
    },
    "data": {
        "productId": 2811,
        "name": "Lampara Led",
        "stock": 1500,
        "salesInfo": {
            "totalQuantitySold": 491,
            "totalRevenue": 250000,
            "salesAverage": 18.18,
            "maxDailySales": 35,
            "trendGrowthPercentage": 45
        },
        "salesHistory": [
            {
                "date": "2026-02-01",
                "quantity": 30
            }
        ]
    }
}
```

### 3. Últimos Productos Agregados

Devuelve un listado rápido de los productos más recientes introducidos a la Base de Datos. Paginación asíncrona apoyada en la fecha de creación.

**Ruta:** `GET /api/products/latest`

**Parámetros Query:**
- `limit` (opcional): Cantidad máxima de productos a devolver. Default: 10.
- `country` (opcional): Filtro estricto por país (ej. `Chile`, `Colombia`).

**Ejemplo de Petición:**
`/api/products/latest?limit=2&country=Chile`

**Estructura de Respuesta:**
```json
{
    "success": true,
    "totalReturned": 2,
    "data": [
        {
            "productId": 2811,
            "dropiId": 64888,
            "name": "Lampara Led",
            "country": "Chile",
            "image": "https://url.com/img.webp",
            "price": 21000,
            "suggestedPrice": 36990,
            "unitProfit": 15990,
            "stock": 1500,
            "url": "https://chile.dropi.co/products/64888",
            "addedAt": "2026-02-27T20:00:05.000Z"
        }
    ]
}
```

## Arquitectura y Organización (Extracto)
- `/src/services/scraper/` -> Servicios directos para el consumo API.
- `/src/controllers/` -> Controladores lógicos del backend.
- `/src/utils/` -> Helpers como el gestor de rotación de conectividad.
- `/logs/` -> Registros crudos para debug local.

---

*Desarrollado para prospección e indexación masiva de eCommerce trends.*