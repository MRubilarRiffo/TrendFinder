# TrendFinder - Documentación de API de Ventas

## Obtener Estadísticas de Ventas (Top Tendencias)

End-point encargado de retornar las analíticas globales y por producto en base a los descuentos de stock (inferencia de venta) recogidos por el scraper de Dropi.

- **Método:** `GET`
- **Ruta sugerida:** `/api/sales/stats` (Ajustar según router real)

### Query Parameters
| Parámetro | Tipo     | Descripción                                                                                           | Default | Opcional |
| :-------- | :------- | :---------------------------------------------------------------------------------------------------- | :------ | :------- |
| `days`    | `number` | Segmento medido de tiempo en días hacia atrás que deseas analizar para reportar datos historicos. | `7`     | Sí       |
| `country` | `string` | Nombre exacto del país a filtrar. (ej: `'Chile'`, `'Colombia'`).                          | `null`  | Sí       |

---

### Estructura de Respuesta (JSON)

Devuelve status `200 OK` con un JSON estructurado así:

```json
{
  "success": true,
  "totalSalesRecords": 1054, // Total de "bajones" de stock que ocurrieron en la BD en el lapso.
  "daysIncluded": 7,         // Corrobora el periodo pedido por query param.
  
  // Array de productos ordenado por Mayor Rentabilidad (totalProfit)
  "data": [
    {
      "productId": 341,
      "name": "Almohada Cervical Terapéutica",
      "country": "Chile",
      "image": "https://url-imagen...",
      "price": 9000,           // El sale_price (costo por Dropi)
      "suggestedPrice": 11000, 
      "unitProfit": 2000,      // suggestedPrice - price
      "totalQuantitySold": 150, // Unidades estimadas vendidas en el lapso.
      "totalRevenue": 1350000,  // Plata movida a nivel proveedor.
      "totalProfit": 300000,    // (Tu oro) Ganancia estimada = unitProfit * totalQuantitySold.
      
      "trendGrowthInfo": {
        "growthPercentage": 50, // 50%. Aumentó ventas en tiempo reciente comparado con etapa antigua del lapso.
        "isTrendingUp": true,   // Mostrar flecha hacia arriba o "🔥"
        "isDying": false
      },

      // Ideal para chart.js / Recharts. El historial de este producto.
      "salesHistory": [
        {
          "date": "2026-02-20", 
          "quantity": 10,       
          "revenue": 90000,
          "profit": 20000
        },
        // ... (fechas sucesivas)
      ]
    }
    // ... otros productos
  ]
}
```

---

## Casos de Uso del Frontend sugeridos con esta data:
- Construye Ranking de **Récord de Ganancias (Profit)** usando `data[i].totalProfit`.
- Muestra el ícono de **Trend Warning / On Fire 🔥** analizando `data[i].trendGrowthInfo.isTrendingUp`
- Añade a la tarjeta del producto el grafico (Sparkline) pasandole al componente `Chart` el Array contenido en `data[i].salesHistory`.
