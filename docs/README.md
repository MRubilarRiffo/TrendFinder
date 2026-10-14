# Índice Técnico de Documentación — TrendFinder

Bienvenido a la base de conocimiento técnico y arquitectura detallada de **TrendFinder**. Este directorio reúne las especificaciones funcionales, contratos de endpoints, diseño de componentes y guías operativas de la plataforma.

---

## 🗂️ Módulos de Documentación

### 1. 🌐 API REST y Backend ([`docs/api/`](api/README.md))
- [`api/sales_stats_endpoint.md`](api/sales_stats_endpoint.md): Especificación de `/api/sales` con paginación por cursores.
- [`api/product_stats_endpoint.md`](api/product_stats_endpoint.md): Especificación de `/api/products/stats/:id` con simulador financiero.
- [`api/product_search_endpoint.md`](api/product_search_endpoint.md): Especificación de `/api/products/search`.
- [`api/latest_products_endpoint.md`](api/latest_products_endpoint.md): Especificación de `/api/products/latest`.
- [Puerta de entrada del backend](../api/README.md): Cómo levantar la API en desarrollo y receta para nuevos endpoints.

### 2. 🤖 Bots & Workers ([`docs/workers/`](workers/README.md))
- [`workers/cpanel-crons.md`](workers/cpanel-crons.md): Configuración de cron jobs en cPanel, CloudLinux `nodevenv` y candados huérfanos.
- [`workers/resilience-proxies.md`](workers/resilience-proxies.md): Rotación de proxies, tokens Dropi, túneles TCP y bypass de WAF.
- [`workers/inventory-guardrails.md`](workers/inventory-guardrails.md): Guardrails contra *Stock Zeroing*, retiros masivos y Winsorización.
- [`workers/troubleshooting.md`](workers/troubleshooting.md): Matriz de fallos y comandos de emergencia SSH.
- [Puerta de entrada de los workers](../api/src/workers/README.md): Comandos rápidos y ciclo de vida de los bots.

### 3. 💻 Frontend SPA ([`docs/web/`](web/README.md))
- [`web/architecture.md`](web/architecture.md): Arquitectura React 19 SPA, Vite 8 y cliente Axios centralizado (`trendFinder.js`).
- [`web/components.md`](web/components.md): Catálogo de componentes (`SmartBadges`, `FinancialInputsPanel`, gráficos).
- [`web/testing.md`](web/testing.md): Testing hermético con Vitest + MSW y Playwright E2E.
- [Puerta de entrada del frontend](../web/README.md): Cómo levantar la SPA en desarrollo local.

### 4. 🎯 Algoritmo Matemático DropScore ([`docs/dropscore.md`](dropscore.md))
- Especificación matemática oficial, pesos ponderados ($35\%$ margen COD, $35\%$ volumen diario, $30\%$ crecimiento de tendencia) y bono de despegue (*breakout*).
