# TrendFinder - Documentación de API de Productos

## Obtener Últimos Productos Agregados

End-point que retorna los productos más recientemente agregados a la base de datos, ordenados por fecha de creación descendente. Incluye información de stock y cálculo de ganancia unitaria.

- **Método:** `GET`
- **Ruta:** `/api/products/latest`

### Query Parameters
| Parámetro | Tipo     | Descripción                                                                  | Default    | Opcional |
| :-------- | :------- | :--------------------------------------------------------------------------- | :--------- | :------- |
| `limit`   | `number` | Cantidad de productos a retornar (mín: 1).                                   | `10`       | Sí       |
| `country` | `string` | Nombre exacto del país a filtrar. (ej: `'Chile'`, `'Colombia'`).             | `null`     | Sí       |

---

### Flujo Interno

```
Request GET /api/products/latest
  │
  ├─ Middleware: limiterMiddleware (rate limit: 50 req / 15 min por IP)
  │
  ├─ Controller: getLatestProducts (src/controllers/products/getLatestProducts.js)
  │   ├─ Extrae y valida query params (limit entre 1 y 50, país en lista blanca)
  │   ├─ Invoca al Domain Service: getLatestProductCatalogue(limit, country)
  │   └─ Formatea respuesta con Presenter (formatPrice, etc.) → 200
  │
  ├─ Domain Service: getLatestProductCatalogue (src/domain/ProductCatalogue/ProductCatalogueService.js)
  │   ├─ Invoca repositorios (LatestProductsRepository)
  │   └─ Ejecuta cálculo de márgenes COD y Prepago con calculateSuggestedPrices
  │
  └─ Repository: LatestProductsRepository (src/repositories/LatestProductsRepository.js)
      └─ Consulta DB: Product + Stock, ordenado por createdAt DESC con cota de limit
```

---

### Estructura de Respuesta (JSON)

Devuelve status `200 OK` con un JSON estructurado así:

```json
{
  "success": true,
  "totalReturned": 3,
  "data": [
    {
      "productId": 580,
      "dropiId": 72341,
      "name": "Cepillo Alisador Eléctrico",
      "country": "Colombia",
      "image": "https://url-imagen...",
      "price": 45000,
      "suggestedPrice": 65000,
      "unitProfit": 20000,
      "stock": 120,
      "url": "https://dropi.co/producto/72341",
      "addedAt": "2026-03-03T15:30:00.000Z"
    }
  ]
}
```

### Campos de Respuesta

| Campo            | Tipo       | Descripción                                                             |
| :--------------- | :--------- | :---------------------------------------------------------------------- |
| `success`        | `boolean`  | Siempre `true` en respuesta exitosa.                                    |
| `totalReturned`  | `number`   | Cantidad de productos retornados en esta respuesta.                     |
| `data[].productId`     | `number`   | ID primario del producto en la BD.                               |
| `data[].dropiId`       | `number`   | ID del producto en la plataforma Dropi.                          |
| `data[].name`          | `string`   | Nombre del producto.                                             |
| `data[].country`       | `string`   | País del producto.                                               |
| `data[].image`         | `string`   | URL de la imagen del producto.                                   |
| `data[].price`         | `number`   | Precio de venta (`sale_price`).                                  |
| `data[].suggestedPrice`| `number`   | Precio sugerido al consumidor.                                   |
| `data[].unitProfit`    | `number`   | Ganancia por unidad (`suggestedPrice - price`, `0` si negativa). |
| `data[].stock`         | `number`   | Stock actual disponible (`0` si no tiene registro).              |
| `data[].url`           | `string`   | URL del producto en la plataforma.                               |
| `data[].addedAt`       | `string`   | Fecha y hora de creación del producto (formato ISO 8601).        |

---

### Errores Posibles

| Código | Causa                                                     |
| :----- | :-------------------------------------------------------- |
| `429`  | Rate limit excedido (más de 50 solicitudes en 15 minutos).|
| `500`  | Error interno del servidor (fallo en consulta a BD).      |

---

### Países Disponibles

Los valores válidos para el filtro `country` son los definidos en el ENUM del modelo `Product`:

| País        |
| :---------- |
| `Colombia`  |
| `México`    |
| `Panamá`    |
| `Chile`     |
| `Ecuador`   |
| `Perú`      |
| `España`    |

---

### Modelos Involucrados

| Modelo    | Tabla      | Relación                                |
| :-------- | :--------- | :-------------------------------------- |
| `Product` | `Products` | Producto principal consultado.          |
| `Stock`   | `Stocks`   | belongsTo Product → campo `quantity`.   |

---

### Archivos del Flujo

| Capa        | Archivo                                                 | Función                   |
| :---------- | :------------------------------------------------------ | :------------------------ |
| Ruta        | `src/routes/productsRoute.js`                           | Define `GET /latest`      |
| Middleware  | `src/middleware/limiterMiddleware.js`                    | Rate limiting             |
| Controller  | `src/controllers/products/getLatestProducts.js`         | Lógica de negocio         |
| Handler     | `src/handlers/products/getLatestProductsFromDb.js`      | Consulta a la BD          |
