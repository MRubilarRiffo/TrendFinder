# TrendFinder - Documentación de API de Ventas

## Obtener Estadísticas de Ventas (Top Tendencias)

End-point que retorna las estadísticas de ventas pre-calculadas desde snapshots generados por cron. Los datos se calculan una vez al día para periodos de 1, 7 y 30 días.

- **Método:** `GET`
- **Ruta:** `/api/sales`

### Query Parameters
| Parámetro | Tipo     | Descripción                                                                  | Default    | Opcional |
| :-------- | :------- | :--------------------------------------------------------------------------- | :--------- | :------- |
| `days`    | `number` | Periodo del snapshot: `1`, `7` o `30` días.                                  | `7`        | Sí       |
| `country` | `string` | Nombre exacto del país a filtrar. (ej: `'Chile'`, `'Colombia'`).             | `null`     | Sí       |
| `sortBy`  | `string` | Criterio de orden: `'profit'` (por ganancia) o `'sales'` (por cantidad).     | `'profit'` | Sí       |
| `limit`   | `number` | Cantidad de resultados por página (mín: 1, máx: 50).                         | `10`       | Sí       |
| `cursor`  | `string` | Cursor de paginación obtenido de una respuesta anterior.                     | `null`     | Sí       |

---

### Paginación (Cursor Pagination)

Este endpoint usa **Cursor Pagination** bidireccional. Cada respuesta incluye `prevCursor` y `nextCursor` para navegar entre páginas.

**Primera página:**
```
GET /api/sales?days=7&limit=10
```

**Siguiente página:** usar el `nextCursor` de la respuesta anterior.
```
GET /api/sales?days=7&limit=10&cursor={nextCursor}
```

**Página anterior:** usar el `prevCursor` de la respuesta anterior.
```
GET /api/sales?days=7&limit=10&cursor={prevCursor}
```

- Si `prevCursor` es `null` → estás en la primera página.
- Si `nextCursor` es `null` → estás en la última página.

---

### Estructura de Respuesta (JSON)

Devuelve status `200 OK` con un JSON estructurado así:

```json
{
  "success": true,
  "periodDays": 7,
  "pagination": {
    "prevCursor": null,
    "nextCursor": "eyJ2YWx1ZSI6..."
  },
  "data": [
    {
      "productId": 341,
      "dropiId": 12345,
      "name": "Almohada Cervical Terapéutica",
      "country": "Chile",
      "image": "https://url-imagen...",
      "url": "https://dropi.co/...",
      "price": 9000,
      "suggestedPrice": 11000,
      "unitProfit": 2000,
      "totalQuantitySold": 150,
      "totalRevenue": 1350000,
      "totalProfit": 300000,
      "performanceRate": 22.22,
      "trendGrowth": 15.50,
      "calculatedAt": "2026-03-04T04:00:00.000Z"
    }
  ]
}
```

### Campos de Respuesta

| Campo              | Tipo       | Descripción                                                                                   |
| :----------------- | :--------- | :-------------------------------------------------------------------------------------------- |
| `productId`        | `number`   | ID interno del producto.                                                                      |
| `dropiId`          | `number`   | ID del producto en la plataforma Dropi.                                                       |
| `name`             | `string`   | Nombre del producto.                                                                          |
| `country`          | `string`   | País del producto.                                                                            |
| `image`            | `string`   | URL de la imagen del producto.                                                                |
| `url`              | `string`   | URL del producto en Dropi.                                                                    |
| `price`            | `number`   | Precio de venta (`sale_price`).                                                               |
| `suggestedPrice`   | `number`   | Precio sugerido al público.                                                                   |
| `unitProfit`       | `number`   | Ganancia por unidad: `suggestedPrice - price` (si es positivo).                               |
| `totalQuantitySold`| `number`   | Total de unidades vendidas en el periodo. Pre-calculado por cron.                             |
| `totalRevenue`     | `number`   | Ingreso total: `SUM(qty × sale_price)`. Pre-calculado por cron.                               |
| `totalProfit`      | `number`   | Ganancia total: `SUM(qty × GREATEST(suggested - sale, 0))`. Pre-calculado por cron.           |
| `performanceRate`  | `number`   | Rendimiento (%): `(totalProfit / totalRevenue) × 100`. Indica el % de ganancia por venta.     |
| `trendGrowth`      | `number`   | Crecimiento de tendencia (%): compara ventas de la mitad reciente vs la mitad antigua del periodo. Puede ser negativo. |
| `calculatedAt`     | `string`   | Fecha ISO de la última ejecución del cron que generó el snapshot.                             |

---

## Origen de los Datos

Los datos son pre-calculados por el script cron `cron/salesSnapshot.js` y almacenados en la tabla `SalesSnapshots`. El endpoint solo lee de esta tabla, lo que garantiza respuestas rápidas sin importar el volumen de ventas.

### Métricas Pre-calculadas por el Cron

| Métrica            | Fórmula SQL                                                      |
| :----------------- | :--------------------------------------------------------------- |
| `totalQuantitySold`| `SUM(quantitySold)`                                              |
| `totalProfit`      | `SUM(quantitySold × GREATEST(suggested_price - sale_price, 0))`  |
| `totalRevenue`     | `SUM(quantitySold × sale_price)`                                 |
| `performanceRate`  | `(totalProfit / totalRevenue) × 100`                             |
| `trendGrowth`      | `((recentSales - oldSales) / oldSales) × 100`                   |

> `trendGrowth` divide el periodo en dos mitades iguales. Si no hay ventas en la mitad antigua pero sí en la reciente, retorna `100`. Si no hay ventas en ninguna mitad, retorna `0`.

### Ejecución del Cron

```bash
node cron/salesSnapshot.js
```

Se recomienda ejecutar una vez al día en horario de baja actividad (ej: 4:00 AM).
