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

---

### Estructura de Respuesta (JSON)

Devuelve status `200 OK` con un JSON estructurado así:

```json
{
  "success": true,
  "periodDays": 7,

  "data": [
    {
      "productId": 341,
      "name": "Almohada Cervical Terapéutica",
      "country": "Chile",
      "image": "https://url-imagen...",
      "price": 9000,
      "suggestedPrice": 11000,
      "unitProfit": 2000,
      "totalQuantitySold": 150,
      "totalRevenue": 1350000,
      "totalProfit": 300000
    }
  ]
}
```

---

## Origen de los Datos

Los datos son pre-calculados por el script cron `cron/salesSnapshot.js` y almacenados en la tabla `SalesSnapshots`. El endpoint solo lee de esta tabla, lo que garantiza respuestas rápidas sin importar el volumen de ventas.

### Ejecución del Cron

```bash
node cron/salesSnapshot.js
```

Se recomienda ejecutar una vez al día en horario de baja actividad.
