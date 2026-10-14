# Arquitectura del Frontend y Servicios HTTP

Esta guía detalla el diseño de la Single Page Application (SPA) de TrendFinder, el flujo de datos unidireccional y las reglas para el consumo de la API REST.

---

## 📌 1. Stack Tecnológico Central

- **React 19**: Utiliza hooks modernos (`useState`, `useEffect`, `useMemo`, `useCallback`) prescindiendo de boilerplate heredado (no se requiere `import React from 'react'`).
- **Vite 8**: Servidor de desarrollo con compilación casi instantánea (Hot Module Replacement) y empaquetado optimizado mediante Rollup en `dist/`.
- **React Router v7**: Enrutamiento declarativo del lado del cliente (`BrowserRouter`, `Routes`, `Route`, `useNavigate`, `useParams`).
- **Axios**: Cliente HTTP centralizado.

---

## 🔌 2. Capa de Servicios: Desacoplamiento de Red (`src/services/trendFinder.js`)

> [!IMPORTANT]
> **Regla Arquitectónica Obligatoria**:
> Ningún componente JSX ni página puede importar `axios` ni ejecutar `fetch()` directamente. Toda la comunicación con el backend reside exclusivamente en [`trendFinder.js`](../../web/src/services/trendFinder.js).

### Estructura del Cliente:
```javascript
import axios from 'axios';

const host = import.meta.env.VITE_API_URL || 'http://localhost:3005/api/';

const api = axios.create({
    baseURL: host,
    headers: { 'Content-Type': 'application/json' }
});
```

### Funciones Exportadas:
1. `getTrendingProducts(days, country, sortBy, cursor, financialParams)`:
   - Consulta el endpoint `/api/sales` con paginación por cursores.
2. `getLatestProducts(financialParams)`:
   - Consulta `/api/products/latest` para obtener las incorporaciones recientes.
3. `getProductStats(productId, startDate, endDate, country, financialParams)`:
   - Consulta `/api/products/stats/:id` para la vista de detalle.
4. `searchProducts(query, { country, page, limit, sortBy, financialParams } = {})`:
   - Consulta `/api/products/search` con paginación tradicional.

---

## 🔄 3. Ciclo de Vida y Manejo de Estados en Componentes

Los componentes siguen un patrón reactivo con prevención de fugas de memoria (*memory leaks*):

```javascript
export default function CatalogoView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        getTrendingProducts(7, 'Chile', 'profit')
            .then(res => {
                if (isMounted) {
                    if (res.success) setData(res.data);
                    else setError('Error al cargar datos');
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    return <ProductGrid products={data} />;
}
```

---

## 🎨 4. Convención de Estilos: CSS Modules

Para garantizar que los estilos no se filtren globalmente ni colisionen:
- Cada componente reside en su propia carpeta junto a su archivo `.module.css` (ej. `ProductSearch.jsx` y `ProductSearch.module.css`).
- Los nombres de clases se acceden como propiedades del objeto importado:
  ```jsx
  import styles from './ProductSearch.module.css';
  <div className={styles.searchContainer}>
  ```
- Los colores, radios de borde y sombras utilizan variables semánticas definidas en `src/index.css` (`var(--bg-primary)`, `var(--color-success)`, `var(--border-radius)`).
