# Estrategia de Testing en Frontend (Vitest, MSW y Playwright)

Esta guía describe los estándares de calidad, configuración de suites y prácticas de testing para la aplicación web de TrendFinder.

---

## 📌 1. Niveles de Testing Implementados

El frontend cuenta con una pirámide de pruebas automatizadas:
1. **Pruebas Unitarias y de Componentes**: Pruebas rápidas sobre renderizado, interactividad y lógica de presentación con **Vitest** y **React Testing Library**.
2. **Pruebas de Integración con MSW**: Intercepción de peticiones HTTP en memoria con **Mock Service Worker** para emular respuestas exitosas y errores del backend sin levantar servidores reales.
3. **Pruebas End-to-End (E2E)**: Validación de flujos de usuario reales en el navegador con **Playwright**.

---

## 🧪 2. Pruebas Unitarias y de Integración (Vitest + MSW)

### Comandos:
```bash
# Ejecutar todas las pruebas unitarias y de integración
npm test

# Modo interactivo para desarrollo TDD
npm run test:watch

# Reporte de cobertura de código
npm run test:coverage
```

### 2.1 Configuración de MSW (`src/test/`)
- **`handlers.js`**: Define las respuestas simuladas para las rutas `/api/*` (`/api/sales`, `/api/products/latest`, `/api/products/stats/:id`).
- **`server.js`**: Instancia el servidor MSW para Node.js usando `setupServer(...handlers)`.
- **`setup.js`**: Conecta el ciclo de vida de MSW con Vitest (`beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`).
- **Adaptador Fetch de Axios**: `setup.js` configura explícitamente `axios.defaults.adapter = 'fetch';`. Esto es indispensable para que MSW v3 (basado en estándares Fetch) intercepte transparentemente las peticiones de Axios dentro del entorno virtual `jsdom`.

### 2.2 Buenas Prácticas en Vitest:
- Diseñar las aserciones sobre elementos visibles mediante selectores accesibles (`getByRole`, `getByLabelText`, `getByText`). Nunca acoplar tests a nombres de clases de CSS Modules.
- Espiar la consola con `vi.spyOn(console, 'error')` en pruebas que deliberadamente induzcan errores 404 o 500 para mantener limpia la salida de la terminal.

---

## 🎭 3. Pruebas End-to-End Herméticas (Playwright)

### Comando:
```bash
npm run test:e2e
```

### 3.1 Arquitectura Page Object Model (POM)
Los selectores y acciones de usuario se encapsulan en clases ubicadas en `web/e2e/pages/`:
- **`HomePage.js`**: Encapsula métodos para cambiar de país, filtrar por periodo, buscar productos y paginar.
- **`ProductPage.js`**: Encapsula métodos para inspeccionar el DropScore, ajustar costos en el simulador financiero y verificar cálculos de margen.

### 3.2 Mocking Hermético de Red (`e2e/fixtures/mockApi.js`)
Para que las pruebas E2E sean 100% deterministas y no fallen por caídas de base de datos o latencia externa:
- Playwright intercepta las llamadas `/api/*` con `page.route()`, sirviendo fixtures JSON estáticos controlados.
- Se prohíben las esperas fijas (`page.waitForTimeout()`); se utilizan las aserciones reactivas de Playwright (`await expect(locator).toBeVisible()`).
