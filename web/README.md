# Guía del Desarrollador — Frontend SPA (TrendFinder Web)

> [!NOTE]
> **Puerta de Entrada del Frontend**: Este archivo proporciona una guía rápida para levantar la SPA en desarrollo local y crear nuevos componentes. Para especificaciones detalladas de arquitectura, catálogo de componentes y testing hermético con MSW y Playwright, consulta [`docs/web/`](../docs/web/README.md).

Esta guía documenta la arquitectura técnica, configuración local, consumo de la API REST, componentes reutilizables y suites de testing automatizado para la aplicación web de **TrendFinder**.

---

## 📌 1. Visión General y Stack Tecnológico

El frontend de **TrendFinder** es una Single Page Application (SPA) moderna, responsiva y de alto rendimiento construida con:

- **Librería UI**: [React 19](https://react.dev/) (aprovechando mejoras de renderizado y hooks modernos sin boilerplate).
- **Herramienta de Compilación**: [Vite 8](https://vitejs.dev/) para inicio instantáneo en desarrollo y empaquetado optimizado para producción.
- **Enrutamiento**: [React Router v7](https://reactrouter.com/) con navegación del lado del cliente.
- **Cliente HTTP**: [Axios](https://axios-http.com/) centralizado con soporte de parámetros dinámicos y métricas financieras.
- **Estilos y Diseño**: **CSS Modules** (`[Componente].module.css`) para evitar colisiones de selectores y garantizar encapsulamiento total, con soporte de CSS Custom Properties (variables de tema oscuro/moderno).
- **Iconografía**: [React Icons](https://react-icons.github.io/react-icons/) (iconos SVG optimizados).
- **Testing**:
  - **Pruebas de Componentes e Integración**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [MSW (Mock Service Worker v3)](https://mswjs.io/) en entorno `jsdom`.
  - **Pruebas End-to-End**: [Playwright](https://playwright.dev/) bajo arquitectura **Page Object Model (POM)**.

---

## 🚀 2. Inicio Rápido en Desarrollo Local

### 2.1 Requisitos Previos
- Node.js `>= 18.0.0` y npm `>= 9.0.0`.
- API REST de TrendFinder corriendo localmente en el puerto `3005` (o acceso a la API remota).

### 2.2 Instalación
```bash
# Navegar al directorio del frontend
cd web

# Instalar dependencias
npm install
```

### 2.3 Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz de `web/`:

```ini
# URL base de la API REST (apunta a la instancia Express local o de producción)
VITE_API_URL=http://localhost:3005/api/
```

### 2.4 Comandos de Ejecución
```bash
# Iniciar servidor de desarrollo con Vite (HMR ultra-rápido)
npm run dev

# Compilar para producción en la carpeta dist/
npm run build

# Previsualizar el build de producción localmente
npm run preview

# Ejecutar el linter (debe reportar 0 errores y 0 advertencias)
npm run lint
```
La aplicación estará accesible por defecto en `http://localhost:5173`.

---

## 🏛️ 3. Estructura y Arquitectura del Código (`src/`)

```
web/
├── e2e/                           # Pruebas End-to-End con Playwright
│   ├── fixtures/mockApi.js        # Mocking hermético a nivel de red con page.route()
│   ├── pages/                     # Page Object Models (HomePage.js, ProductPage.js)
│   └── specs/                     # Casos de prueba E2E de flujos críticos
├── src/
│   ├── components/                # Componentes reusables con CSS Modules y tests
│   │   ├── DualLineChart/         # Gráfica comparativa de series de ventas
│   │   ├── FinancialInputsPanel/  # Calculadora interactiva de márgenes COD y prepago
│   │   ├── ProductSearch/         # Buscador reactivo con filtros y ordenamiento
│   │   ├── SimpleLineChart/       # Sparklines SVG de tendencia diaria
│   │   └── SmartBadges/           # Insignias visuales de DropScore y estados
│   ├── pages/                     # Vistas principales de la SPA
│   │   ├── home/                  # Dashboard, catálogo con filtros y paginación por cursor
│   │   └── product/               # Ficha de detalle del producto y simulación financiera
│   ├── services/                  # Cliente HTTP Axios centralizado
│   │   └── trendFinder.js         # Métodos de consulta a la API REST (/api/*)
│   ├── test/                      # Configuración global de Vitest y MSW
│   │   ├── handlers.js            # Interceptores MSW para emular la API
│   │   ├── server.js              # Servidor MSW para entorno Node.js
│   │   └── setup.js               # Setup global con Jest-DOM
│   ├── App.jsx                    # Definición de rutas y layout general
│   ├── index.css                  # Variables de tema global y reset CSS
│   └── main.jsx                   # Punto de entrada de React 19
├── playwright.config.js           # Configuración de Playwright (Chromium headless)
└── vite.config.js                 # Configuración de Vite y Vitest (jsdom)
```

---

## 🔌 4. Consumo Centralizado de la API REST (`src/services/trendFinder.js`)

> [!IMPORTANT]
> **Regla de Oro**: Está estrictamente prohibido invocar `fetch()` o `axios.get()` directamente dentro de los componentes JSX o vistas. Todas las llamadas de red deben encapsularse como funciones exportadas en [`src/services/trendFinder.js`](src/services/trendFinder.js).

Los métodos exportados gestionan la serialización de parámetros y el envío de personalizaciones financieras:

```javascript
// Métodos disponibles en trendFinder.js:

// 1. Obtener productos ganadores ordenados por métricas con paginación por cursor
getTrendingProducts(days, country, sortBy, cursor, financialParams)

// 2. Obtener los últimos productos ingresados al catálogo
getLatestProducts(financialParams)

// 3. Obtener el historial completo y métricas de un producto por ID
getProductStats(productId, startDate, endDate, country, financialParams)

// 4. Buscar productos por texto en el catálogo
searchProducts(query, { country, page, limit, sortBy, financialParams } = {})
```

### Patrón de Consumo en Componentes:
Los componentes manejan tres estados reactivos estándar (`data`, `loading`, `error`):
```javascript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getTrendingProducts(days, country, sortBy, cursor)
        .then(response => {
            if (isMounted) {
                if (response.success) {
                    setProducts(response.data);
                } else {
                    setError('Error al cargar productos');
                }
            }
        })
        .finally(() => {
            if (isMounted) setLoading(false);
        });

    return () => { isMounted = false; };
}, [days, country, sortBy, cursor]);
```

---

## 🧩 5. Componentes Clave del Dominio

### 5.1 `SmartBadges` (Insignias de Estado de Producto)
El componente `SmartBadges` recibe las banderas booleanas de análisis y renderiza las etiquetas dinámicas correspondientes:

- 🔥 **Despegue (`isBreakout: true`)**: Producto emergente con tracción rápida reciente sin ventas previas.
- 💎 **High Ticket (`isHighTicket: true`)**: Producto con precio de costo relevante que deja mayor margen nominal.
- 🧊 **En Declive (`isDeclining: true`)**: Alerta de pérdida de aceleración en la segunda mitad del periodo.
- ⚠️ **Poco Stock (`hasLowStock: true`)**: Inventario crítico ($\le 10$ unidades en bodega).

> [!NOTE]
> **Insignia Numérica de DropScore**: El círculo con el puntaje numérico (0 a 100) y la insignia animada con pulso `🔥 GANADOR` (para scores $\ge 85$) se renderizan directamente en las tarjetas de producto de `Home.jsx` y en la cabecera de `ProductDetails.jsx`.

---

### 5.2 `FinancialInputsPanel` (Calculadora Interactiva de Márgenes)
Permite al usuario personalizar los costos logísticos y publicitarios en dos modelos independientes:

1. **Pago Anticipado (Prepago)**:
   - Costo de flete (`shippingCostPrepaid`, defecto: $5.000).
   - Inversión publicitaria estimada (`cpaPrepaid`, defecto: $8.000).
   - Ganancia neta deseada (`desiredProfitPrepaid`, defecto: $8.000).
   - Comisión de plataforma (`commissionPctPrepaid`, defecto: 6%).
2. **Pago Contra Entrega (COD)**:
   - Costo de flete (`shippingCostCod`, defecto: $8.000).
   - Inversión publicitaria estimada (`cpaCod`, defecto: $4.000).
   - Ganancia neta deseada (`desiredProfitCod`, defecto: $8.000).
   - Tasa de entrega efectiva (`deliveryRatePctCod`, defecto: 70%).
   - Costo de flete por devolución (`failedShippingCostCod`, defecto: $8.000).

Al pulsar el botón **"Recalcular Precios"**, el panel emite los parámetros normalizados a la vista padre para solicitar una nueva cotización a la API REST.

---

### 5.3 Gráficas de Tendencias: `SimpleLineChart` y `DualLineChart`
- **`SimpleLineChart`**: Componente SVG responsivo utilizado en las tarjetas del catálogo y en la ficha de detalle (`ProductDetails`) para dibujar la evolución de ventas diarias (1, 7 o 30 días) con suavizado de curvas.
- **`DualLineChart`**: Componente con gráfica comparativa de doble eje disponible en el catálogo de componentes para superponer volumen de unidades e ingresos simultáneamente.

---

## 🧭 6. Flujo de Navegación y Vistas

La aplicación cuenta con dos rutas principales gestionadas por `React Router`:

1. **Dashboard y Catálogo Principal (`/`)**:
   - Selector de periodo temporal: **1 día**, **7 días** o **30 días**.
   - Selector de país con formateo dinámico de monedas (`COP`, `CLP`, `MXN`, `USD`).
   - Selector de criterio de orden: *Mayor Rentabilidad*, *Mayor Volumen*, *Mayor DropScore*, *Tendencia de Crecimiento*, *Despegue*.
   - Buscador predictivo por nombre de producto con paginación tradicional.
   - Paginación basada en cursores (*Cargar más*) para exploración infinita sin pérdida de posición.
2. **Ficha Técnica del Producto (`/product/:id`)**:
   - Vista de detalle con galería de imágenes, enlace directo a la plataforma Dropi y stock disponible.
   - Diagnóstico completo de DropScore con desglose de sus 3 componentes (Margen, Volumen, Crecimiento).
   - Historial gráfico de ventas diarias.
   - Simulador de rentabilidad interactivo personalizable por el usuario.

---

## 🧪 7. Guía y Protocolo de Testing

### 7.1 Pruebas Unitarias y de Integración (Vitest + RTL + MSW)
```bash
# Ejecutar todas las pruebas unitarias y de componentes
npm test

# Modo interactivo (Watch mode)
npm run test:watch

# Reporte de cobertura de código
npm run test:coverage
```
- **Aislamiento de Red con MSW**: Las llamadas Axios son interceptadas en memoria por **Mock Service Worker** (`src/test/handlers.js`). No se realizan peticiones de red reales durante los tests unitarios.
- **Selectores Accesibles**: Se priorizan consultas semánticas (`getByRole`, `getByLabelText`, `getByText`) simulando la experiencia de un usuario real.

---

### 7.2 Pruebas End-to-End Herméticas (Playwright)
```bash
# Ejecutar pruebas E2E en modo headless
npm run test:e2e
```
- **Arquitectura Page Object Model (POM)**: Las interacciones de la interfaz están centralizadas en `e2e/pages/HomePage.js` y `e2e/pages/ProductPage.js`. Si un selector JSX cambia, solo se actualiza el método en la clase POM correspondiente.
- **Mocking Hermético a Nivel de Red**: En `e2e/fixtures/mockApi.js`, Playwright intercepta las rutas `/api/*` mediante `page.route()`, asegurando que las pruebas corran de forma 100% determinista sin depender de que el backend o la base de datos estén levantados.
- **Cero Esperas Fijas**: Está prohibido el uso de `page.waitForTimeout()`; se aprovechan los auto-waits y aserciones reactivas de Playwright (`await expect(locator).toBeVisible()`).

---

## 🎨 8. Receta: Cómo Crear un Nuevo Componente

Para mantener la consistencia estética y arquitectónica:

1. Crea una carpeta en `src/components/` con el nombre en PascalCase:
   ```
   src/components/StockIndicator/
   ├── StockIndicator.jsx
   ├── StockIndicator.module.css
   └── __tests__/
       └── StockIndicator.test.jsx
   ```
2. Define los estilos encapsulados en `StockIndicator.module.css`:
   ```css
   .container {
     display: flex;
     align-items: center;
     gap: 0.5rem;
     font-size: 0.875rem;
   }
   
   .lowStock {
     color: var(--color-danger, #ef4444);
     font-weight: 600;
   }
   ```
3. Implementa el componente React sin importar `React` global (React 19):
   ```jsx
   import styles from './StockIndicator.module.css';
   
   export function StockIndicator({ stock }) {
     const isLow = stock <= 10;
     return (
       <div className={styles.container}>
         <span className={isLow ? styles.lowStock : ''}>
           Stock disponible: {stock} unidades
         </span>
       </div>
     );
   }
   ```
4. Añade su prueba unitaria en `__tests__/StockIndicator.test.jsx` con Vitest y Testing Library:
   ```jsx
   import { render, screen } from '@testing-library/react';
   import { StockIndicator } from '../StockIndicator';
   
   describe('StockIndicator', () => {
     it('renderiza la cantidad de stock correctamente', () => {
       render(<StockIndicator stock={25} />);
       expect(screen.getByText(/Stock disponible: 25 unidades/i)).toBeInTheDocument();
     });
   });
   ```
5. Valida con `npm test` y `npm run lint`.
