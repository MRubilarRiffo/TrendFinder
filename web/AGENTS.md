# Guía del Agente — Frontend SPA (TrendFinder Web)

Este archivo define las directrices arquitectónicas, de diseño de componentes, consumo de servicios y calidad de código para la interfaz SPA ubicada en `web/`.

---

## 📌 Visión General del Frontend

El frontend de **TrendFinder** es una Single Page Application (SPA) moderna desarrollada con:
- **React 19** y **Vite**.
- **React Router v7** para enrutamiento del lado del cliente.
- **Axios** centralizado como cliente HTTP.
- **React Icons** para iconografía.
- **CSS Modules** (`*.module.css`) para encapsulamiento y modularidad de estilos.
- **ESLint** configurado para React 19 y Fast Refresh.

---

## 🏛️ Estructura y Arquitectura del Frontend (`src/`)

```
web/src/
├── components/            # Componentes reutilizables con CSS Modules
│   ├── DualLineChart/     # Gráfica comparativa de ventas temporales
│   ├── FinancialInputsPanel/ # Calculadora interactiva de márgenes COD y prepago
│   ├── ProductSearch/     # Buscador responsivo con filtros y desglose financiero
│   ├── SimpleLineChart/   # Gráfica lineal de evolución temporal (sparklines)
│   └── SmartBadges/       # Insignias visuales de DropScore y estados de tendencia
├── pages/                 # Vistas principales de la aplicación
│   ├── home/              # Dashboard, catálogo con filtros, sorting y paginación
│   └── product/           # Ficha técnica, simulación financiera y métricas históricas
├── services/              # Cliente HTTP Axios centralizado
│   └── trendFinder.js     # Funciones de consulta a la API REST (/api/*)
├── App.jsx                # Router y layout general de la aplicación
├── main.jsx               # Punto de entrada de React 19
└── index.css              # Variables de tema, reset y tipografía global
```

---

## ⚙️ Reglas de Desarrollo en Frontend

### 1. Desacoplamiento de Servicios y API
- **Cliente Centralizado (`src/services/trendFinder.js`)**:
  - **PROHIBIDO** realizar llamadas directas `axios.get()` o `fetch()` dentro de componentes JSX o vistas.
  - Todas las peticiones HTTP a la API deben añadirse como funciones exportadas en `trendFinder.js`.
  - Los componentes y páginas invocan los métodos del servicio y manejan estados de carga (`loading`), error y datos (`data`).

### 2. Componentes de Visualización y CSS Modules
- Cada componente reusable en `src/components/` debe tener su propia carpeta con su archivo JSX y su hoja de estilos encapsulada `[NombreComponente].module.css`.
- Los componentes de visualización (`SmartBadges`, `DualLineChart`) deben centrarse en renderizar la UI a partir de props; no deben acoplarse a la lógica de red ni a transformaciones de base de datos.
- **Insignias y Estados Visuales de DropScore**:
  - `85 - 100`: **GANADOR** (Verde `#10b981`, pulso animado).
  - `80 - 84`: **Alto** (Verde `#10b981`).
  - `50 - 79`: **Medio** (Ámbar/Naranja `#f59e0b`).
  - `0 - 49`: **Bajo** (Rojo `#ef4444`).

### 3. Buenas Prácticas React 19 y Calidad de Código
- **Sin Imports Innecesarios**:
  - En React 19 no se requiere `import React from 'react'`. Solo importar hooks específicos (`useState`, `useEffect`, `useMemo`, etc.).
- **Compatibilidad con Fast Refresh**:
  - Respetar la regla `react-refresh/only-export-components`: constantes de configuración o funciones auxiliares no deben exportarse desde el mismo archivo que define el componente React si interfieren con el hot-reloading.
- **ESLint Estricto**:
  - No dejar variables o parámetros declarados sin usar para mantener `npm run lint` con 0 errores y 0 advertencias.

### 4. Experiencia de Usuario y Diseño Responsivo
- Mantener navegación fluida, estados de carga accesibles (`skeletons` o spinners no invasivos) y manejo amigable de errores de conexión.
- Respetar el formateo de monedas por país (`COP`, `CLP`, `MXN`, `USD`) en precios sugeridos y costos.

---

## 🛠️ Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo con Vite
npm run dev

# Compilar para producción en dist/
npm run build

# Validar calidad y reglas de linter
npm run lint
```
