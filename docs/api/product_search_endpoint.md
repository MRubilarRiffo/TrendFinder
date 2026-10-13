# TrendFinder - Documentación de API de Productos

## Buscar Productos (Search Engine)

Endpoint profesional y optimizado para la búsqueda de productos en el catálogo de Dropi. Implementa búsqueda multi-token (todas las palabras deben coincidir de forma flexible), búsqueda directa por Dropi ID o ID numérico, sanitización contra inyección de comodines SQL, filtros por país, ordenamiento multi-criterio y paginación estructurada.

- **Método:** `GET`
- **Ruta:** `/api/products/search`

### Query Parameters

| Parámetro | Tipo     | Descripción                                                                                       | Default   | Requerido |
| :-------- | :------- | :------------------------------------------------------------------------------------------------ | :-------- | :-------- |
| `q`       | `string` | Término o palabras clave de búsqueda (mínimo 2 caracteres, máximo 100 caracteres).                | -         | **Sí**    |
| `country` | `string` | Nombre del país a filtrar (`Colombia`, `México`, `Panamá`, `Chile`, `Ecuador`, `Perú`, `España`).  | `null`    | No        |
| `page`    | `number` | Número de página (1-indexed). Debe ser un entero positivo mayor o igual a 1.                     | `1`       | No        |
| `limit`   | `number` | Cantidad de productos por página (acotado estrictamente entre 1 y 50).                           | `10`      | No        |
| `sortBy`  | `string` | Criterio de orden: `recent`, `oldest`, `name_asc`, `name_desc`, `price_asc`, `price_desc`.         | `recent`  | No        |

---

### Flujo Interno (Clean Architecture)

```
Request GET /api/products/search?q=cepillo&country=Chile&page=1&limit=10&sortBy=recent
  │
  ├─ Middleware: limiterMiddleware (rate limit: 50 req / 15 min por IP)
  │
  ├─ Controller: searchProducts (src/controllers/products/searchProducts.js)
  │   ├─ Valida 'q' (no vacío, 2-100 caracteres) -> 400 Bad Request si falla
  │   ├─ Normaliza 'country' con normalizeCountry -> 400 Bad Request si país inválido
  │   ├─ Valida 'page' (entero positivo >= 1) -> 400 Bad Request si inválido
  │   ├─ Valida 'limit' (entero positivo clamped 1-50)
  │   ├─ Valida 'sortBy' contra lista blanca permitida
  │   ├─ Invoca caso de uso de Dominio: searchProductCatalogue
  │   └─ Formatea respuesta mediante Presenter (formatSearchProductsResponse)
  │
  ├─ Domain Service: searchProductCatalogue (src/domain/ProductCatalogue/ProductCatalogueService.js)
  │   ├─ Invoca searchProductsData del Repositorio
  │   └─ Calcula métricas financieras por producto (calculateSuggestedPrices)
  │
  └─ Repository: searchProductsData (src/repositories/ProductSearchRepository.js)
      ├─ Sanitiza comodines SQL (% y _) para prevenir wildcard injection
      ├─ Tokeniza palabras con operador AND (Op.like por palabra)
      ├─ Si q es numérico, incluye Op.or con dropiId e id
      └─ Ejecuta Product.findAndCountAll con distinct: true, include Stock, limit y offset
```

---

### Estructura de Respuesta (JSON)

Devuelve status `200 OK` con un JSON estructurado así:

```json
{
  "success": true,
  "query": "cepillo",
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalMatches": 24,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": [
    {
      "productId": 580,
      "dropiId": 72341,
      "name": "Cepillo Alisador Eléctrico 3 en 1",
      "country": "Chile",
      "image": "https://url-imagen...",
      "price": "$ 15.000",
      "rawPrice": 15000,
      "suggestedPriceCod": "$ 38.000",
      "unitProfitCod": "$ 12.000",
      "suggestedPricePrepaid": "$ 32.000",
      "unitProfitPrepaid": "$ 10.000",
      "suggestedPrice": "$ 38.000",
      "unitProfit": "$ 12.000",
      "stock": 120,
      "url": "https://dropi.cl/producto/72341",
      "addedAt": "2026-03-03T15:30:00.000Z"
    }
  ]
}
```

---

### Códigos de Respuesta y Errores

| Código | Condición                                                                                     | Formato de Error |
| :----- | :-------------------------------------------------------------------------------------------- | :--------------- |
| `200`  | Búsqueda ejecutada exitosamente (incluso con 0 resultados coincidentes).                       | `{ success: true, query: "...", pagination: {...}, data: [] }` |
| `400`  | Parámetro `q` ausente, menor a 2 caracteres o superior a 100 caracteres.                      | `{ success: false, error: "El parámetro de búsqueda \"q\" debe tener al menos 2 caracteres." }` |
| `400`  | Parámetro `country` no pertenece a la lista de países soportados.                             | `{ success: false, error: "País no válido. Países soportados: ..." }` |
| `400`  | Parámetro `page` no es un número entero positivo.                                             | `{ success: false, error: "El parámetro \"page\" debe ser un número entero positivo." }` |
| `400`  | Parámetro `sortBy` inválido.                                                                  | `{ success: false, error: "Criterio de ordenamiento inválido. ..." }` |
| `429`  | Rate limit excedido (más de 50 solicitudes en 15 minutos por IP).                             | `{ message: "Too many requests, please try again later." }` |
| `500`  | Error interno del servidor (sanitizado en producción según reglas de seguridad).             | `{ success: false, error: "Error interno del servidor" }` |
