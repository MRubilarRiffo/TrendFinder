# TrendFinder - Documentación de API de Productos

## Obtener Estadísticas de un Producto

End-point que retorna las estadísticas detalladas de ventas para un producto específico dentro de un rango de fechas. Incluye historial de ventas diario, cálculo de tendencias, ingresos y stock actual.

- **Método:** `GET`
- **Ruta:** `/api/products/stats/:id`

### Path Parameters
| Parámetro | Tipo     | Descripción                                              | Obligatorio |
| :-------- | :------- | :------------------------------------------------------- | :---------- |
| `id`      | `number` | ID primario del producto en Base de Datos (no dropiId).  | Sí          |

### Query Parameters
| Parámetro   | Tipo     | Descripción                                                                  | Default               | Opcional |
| :---------- | :------- | :--------------------------------------------------------------------------- | :-------------------- | :------- |
| `startDate` | `string` | Fecha de inicio del periodo a evaluar (formato `YYYY-MM-DD`).                | `hace 30 días`        | Sí       |
| `endDate`   | `string` | Fecha de fin del periodo a evaluar (formato `YYYY-MM-DD`).                   | `hoy`                 | Sí       |
| `country`   | `string` | Filtro por país exacto. (ej: `'Chile'`, `'Colombia'`).                       | `null`                | Sí       |

---

### Flujo Interno

```
Request GET /api/products/stats/:id
  │
  ├─ Middleware: limiterMiddleware (rate limit: 50 req / 15 min por IP)
  │
  ├─ Controller: getProductsStats (src/controllers/products/getProductsStats.js)
  │   ├─ Valida que se reciba `id` → 400 si falta
  │   ├─ Llama al Handler con (id, startDate, endDate, country)
  │   ├─ Valida que existan resultados → 404 si no hay datos
  │   └─ Procesa la lógica de negocio:
  │       ├─ Calcula total de ventas, ingresos
  │       ├─ Separa ventas recientes vs antiguas (punto medio del rango)
  │       ├─ Genera historial diario agrupado
  │       ├─ Calcula promedio diario, máximo diario y % de tendencia
  │       └─ Retorna JSON con status 200
  │
  └─ Handler: getProductsStatsFromDb (src/handlers/products/getProductsStatsFromDb.js)
      ├─ Configura fechas (default: últimos 30 días)
      ├─ Calcula días evaluados y punto medio para tendencias
      └─ Consulta DB: Product + Stock + ProductSales (entre fechas)
```

---

### Lógica de Cálculo de Tendencia

El controlador divide el rango de fechas en dos mitades usando el **punto medio** (`midDateLimit`):

- **Ventas recientes:** ventas desde `midDateLimit` hasta `endDate`.
- **Ventas antiguas:** ventas desde `startDate` hasta `midDateLimit`.
- **Fórmula:** `trendGrowth = ((recentSales - oldSales) / oldSales) * 100`
- Si no hay ventas antiguas pero sí recientes → `100%` (crecimiento total).
- Si no hay ventas en ambas mitades → `0%`.

---

### Estructura de Respuesta (JSON)

Devuelve status `200 OK` con un JSON estructurado así:

```json
{
  "success": true,
  "period": {
    "startDate": "2026-02-01",
    "endDate": "2026-03-03",
    "daysEvaluated": 30
  },
  "data": {
    "productId": 341,
    "dropiId": 50234,
    "name": "Almohada Cervical Terapéutica",
    "country": "Chile",
    "stock": 85,
    "price": 9000,
    "suggestedPrice": 11000,
    "salesInfo": {
      "totalQuantitySold": 150,
      "totalRevenue": 1350000,
      "salesAverage": 5.0,
      "maxDailySales": 12,
      "trendGrowthPercentage": 35
    },
    "salesHistory": [
      { "date": "2026-02-01", "quantity": 5 },
      { "date": "2026-02-02", "quantity": 8 },
      { "date": "2026-02-03", "quantity": 12 }
    ]
  }
}
```

### Campos de Respuesta

| Campo                             | Tipo      | Descripción                                                      |
| :-------------------------------- | :-------- | :--------------------------------------------------------------- |
| `success`                         | `boolean` | Siempre `true` en respuesta exitosa.                             |
| `period.startDate`                | `string`  | Fecha de inicio evaluada (formato `YYYY-MM-DD`).                 |
| `period.endDate`                  | `string`  | Fecha de fin evaluada (formato `YYYY-MM-DD`).                    |
| `period.daysEvaluated`            | `number`  | Cantidad total de días evaluados.                                |
| `data.productId`                  | `number`  | ID primario del producto en BD.                                  |
| `data.dropiId`                    | `number`  | ID del producto en la plataforma Dropi.                          |
| `data.name`                       | `string`  | Nombre del producto.                                             |
| `data.country`                    | `string`  | País del producto.                                               |
| `data.stock`                      | `number`  | Stock actual disponible (`0` si no tiene registro de Stock).     |
| `data.price`                      | `number`  | Precio de venta (`sale_price`).                                  |
| `data.suggestedPrice`             | `number`  | Precio sugerido al consumidor.                                   |
| `data.salesInfo.totalQuantitySold`       | `number`  | Total de unidades vendidas en el periodo.                 |
| `data.salesInfo.totalRevenue`            | `number`  | Ingreso total (`quantitySold × price`).                   |
| `data.salesInfo.salesAverage`            | `number`  | Promedio de ventas diarias.                               |
| `data.salesInfo.maxDailySales`           | `number`  | Máximo de ventas en un solo día.                          |
| `data.salesInfo.trendGrowthPercentage`   | `number`  | Porcentaje de crecimiento de tendencia (entero).          |
| `data.salesHistory`               | `array`   | Historial de ventas por día dentro del periodo.                  |

---

### Errores Posibles

| Código | Causa                                                     |
| :----- | :-------------------------------------------------------- |
| `400`  | No se proporcionó el parámetro `id` en la URL.            |
| `404`  | Producto no encontrado o sin datos para el filtro dado.   |
| `429`  | Rate limit excedido (más de 50 solicitudes en 15 minutos).|

---

### Modelos Involucrados

| Modelo        | Tabla           | Relación                                |
| :------------ | :-------------- | :-------------------------------------- |
| `Product`     | `Products`      | Producto principal consultado.          |
| `Stock`       | `Stocks`        | belongsTo Product → campo `quantity`.   |
| `ProductSale` | `ProductSales`  | hasMany desde Product → ventas diarias. |

---

### Archivos del Flujo

| Capa        | Archivo                                                 | Función                  |
| :---------- | :------------------------------------------------------ | :----------------------- |
| Ruta        | `src/routes/productsRoute.js`                           | Define `GET /stats/:id`  |
| Middleware  | `src/middleware/limiterMiddleware.js`                    | Rate limiting            |
| Controller  | `src/controllers/products/getProductsStats.js`          | Lógica de negocio        |
| Handler     | `src/handlers/products/getProductsStatsFromDb.js`       | Consulta a la BD         |
