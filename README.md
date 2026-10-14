# 🚀 TrendFinder — Market Intelligence & E-commerce Analytics

**TrendFinder** es una plataforma integral de inteligencia de mercado y análisis predictivo de e-commerce diseñada para descubrir productos ganadores (*winning products*), auditar inventarios mayoristas y rastrear tendencias de ventas en tiempo real sobre el catálogo de **Dropi** en múltiples países de Latinoamérica (Colombia, Chile, México, Panamá, Ecuador, Perú y España).

---

## 🏛️ Arquitectura del Monorepo

El repositorio está organizado como un **monorepo modular desacoplado** compuesto por tres subsistemas principales:

```
TrendFinder/
├── api/                           # BACKEND REST API (Node.js, Express 5, Sequelize)
│   ├── README.md                  # 📖 Documentación para mantenedores de la API
│   ├── src/                       # Clean Architecture (Routes, Controllers, Domain, Repositories)
│   │   └── workers/               # WORKERS AUTÓNOMOS Y BOTS DE SCRAPING
│   │       ├── README.md          # 📖 Guía operativa de Bots, cPanel Crons y Resiliencia
│   │       ├── scraper/           # Scraper concurrente de catálogo Dropi
│   │       └── snapshots/         # Generador de agregados analíticos a medianoche
│   └── tests/                     # Suite de pruebas automatizadas (Jest + SQLite en memoria)
│
├── web/                           # FRONTEND SINGLE PAGE APPLICATION (React 19, Vite 8)
│   ├── README.md                  # 📖 Documentación para mantenedores del Frontend
│   ├── src/                       # Vistas, componentes modulares con CSS Modules y Axios
│   ├── e2e/                       # Pruebas End-to-End herméticas (Playwright + POM)
│   └── playwright.config.js
│
├── docs/                          # DOCUMENTACIÓN TÉCNICA MODULAR Y PROFUNDA
│   ├── README.md                  # Índice general de documentación técnica
│   ├── dropscore.md               # Especificación matemática del algoritmo
│   ├── api/                       # Especificaciones detalladas de endpoints REST
│   ├── workers/                   # Guías de despliegue en cPanel, resiliencia y troubleshooting
│   └── web/                       # Arquitectura SPA, catálogo de componentes y testing
│
├── .agents/                       # Reglas de desarrollo compartidas e instrucciones de IA
│   └── rules/                     # Reglas de DropScore, seguridad y protocolo Git
├── AGENTS.md                      # Directrices maestras del repositorio
└── README.md                      # Este archivo maestro
```

---

## 📚 Arquitectura Documental en Dos Niveles

La documentación del proyecto sigue una arquitectura de **dos niveles**:
1. **Nivel 1 (Puertas de Entrada)**: Archivos `README.md` situados en la raíz de cada módulo para arranque rápido, comandos esenciales y recetas.
2. **Nivel 2 (Documentación Profunda en `docs/`)**: Especificaciones técnicas exhaustivas, fórmulas, contratos de endpoints y guías operativas.

| Subsistema | Puerta de Entrada (README) | Documentación Técnica Profunda (`docs/`) |
| :--- | :--- | :--- |
| 🌐 **Backend REST API** | [`api/README.md`](api/README.md) | [`docs/api/README.md`](docs/api/README.md) · [Endpoints REST](docs/api/) |
| 🤖 **Bots & Workers** | [`api/src/workers/README.md`](api/src/workers/README.md) | [`docs/workers/README.md`](docs/workers/README.md) · [Crons & cPanel](docs/workers/cpanel-crons.md) · [Troubleshooting](docs/workers/troubleshooting.md) |
| 💻 **Frontend SPA** | [`web/README.md`](web/README.md) | [`docs/web/README.md`](docs/web/README.md) · [Componentes UI](docs/web/components.md) · [Testing](docs/web/testing.md) |
| 🎯 **Dominio Matemático** | [Algoritmo DropScore](#-el-motor-analítico-algoritmo-dropscore) | [`docs/dropscore.md`](docs/dropscore.md) |

---

## ⚡ Inicio Rápido: Levantando el Entorno Completo en 5 Minutos

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/TrendFinder.git
cd TrendFinder
```

### 2. Configurar y Levantar el Backend (API)
```bash
cd api
npm install

# Crear archivo .env a partir de las instrucciones en api/README.md
# Configurar credenciales de MySQL local

# Iniciar servidor en modo desarrollo (puerto 3005)
npm run dev
```

### 3. Configurar y Levantar el Frontend (Web)
En una nueva pestaña de la terminal:
```bash
cd web
npm install

# Iniciar Vite Dev Server (puerto 5173 con Hot Module Replacement)
npm run dev
```

Abre tu navegador en [http://localhost:5173](http://localhost:5173) para explorar la aplicación conectada a la API local.

---

## 🎯 El Motor Analítico: Algoritmo DropScore

El corazón de TrendFinder es el **DropScore**, un algoritmo matemático determinista que evalúa la viabilidad comercial de cada producto en una escala de `0` a `100` puntos:

$$DropScore = (P_{\text{perf}} \times 0.35) + (P_{\text{vol}} \times 0.35) + (P_{\text{growth}} \times 0.30) + \text{Bono}_{\text{breakout}}$$

- **1. Margen Bruto COD ($P_{\text{perf}}$, 35%)**: Evalúa el margen de ganancia bajo el modelo de Pago Contra Entrega ponderando costo, fletes y devoluciones. Margen $\ge 80\% \to 100$ pts; margen $\le 20\% \to 0$ pts.
- **2. Volumen de Ventas Diario ($P_{\text{vol}}$, 35%)**: Normalizado sobre una meta estándar de 15 unidades vendidas por día.
- **3. Crecimiento de Tendencia ($P_{\text{growth}}$, 30%)**: Compara la aceleración de ventas entre la segunda mitad y la primera mitad del periodo evaluado.
- **4. Bono de Despegue ($\text{Bono}_{\text{breakout}}$, +15 pts)**: Recompensa a productos emergentes que arrancan desde 0 ventas anteriores y logran tracción rápida reciente.

### Insignias Visuales de DropScore:
- 🟢 **85 – 100**: **GANADOR** (Insignia verde con pulso animado).
- 🟢 **80 – 84**: **Alto** (Viabilidad sólida).
- 🟡 **50 – 79**: **Medio** (Producto estándar / rotación moderada).
- 🔴 **0 – 49**: **Bajo** (Riesgo alto / bajo margen o ventas estancadas).

---

## 🧪 Verificación Automatizada y Calidad de Código

Antes de integrar cambios o desplegar a producción, ejecuta las suites de pruebas automatizadas:

```bash
# 1. Pruebas Unitarias y de Integración del Backend (Jest + SQLite en memoria)
cd api && npm test

# 2. Pruebas de Componentes y Red del Frontend (Vitest + MSW)
cd web && npm test

# 3. Pruebas End-to-End de Flujos Críticos de Usuario (Playwright)
cd web && npm run test:e2e

# 4. Auditoría de Estilo y Linter
cd web && npm run lint
```

El 100% de las pruebas debe pasar limpiamente (0 fallos, 0 errores de linter).

---

## 📄 Licencia y Mantenimiento

Proyecto desarrollado para análisis y monitoreo comercial de e-commerce. Mantenido por el equipo de ingeniería de TrendFinder. Consulte las guías individuales de cada módulo para conocer las pautas de contribución.
