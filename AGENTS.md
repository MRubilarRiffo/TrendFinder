# Instrucciones Maestras del Proyecto — TrendFinder

Este archivo sirve como la **guía maestra operativa y arquitectónica** para cualquier agente o desarrollador que trabaje en el repositorio **TrendFinder**.

---

## 📌 Descripción del Proyecto

**TrendFinder** es una plataforma de inteligencia de mercado y análisis de e-commerce diseñada para identificar productos ganadores, monitorear inventarios y analizar tendencias de ventas sobre el catálogo de **Dropi** en múltiples países (Colombia, Chile, México, Panamá, entre otros).

El repositorio está estructurado como un **monorepo modular**:

```
TrendFinder/
├── .agents/
│   └── rules/                                 # Reglas transversales compartidas
│       ├── 01-dropscore-and-financial-domain.md # Especificación matemática de DropScore y finanzas
│       ├── 02-security-and-environment.md     # Protección de secretos y exclusión en Git
│       └── 03-git-workflow.md                 # Protocolo SemVer, verificación previa y commits
├── AGENTS.md                                  # Guía maestra monorepo (este archivo)
├── docs/                                      # Documentación funcional y endpoints
│   ├── dropscore.md                           # Especificación matemática del algoritmo
│   └── api/                                   # Especificación técnica de endpoints REST
├── api/                                       # BACKEND EXPRESS + SEQUELIZE + WORKERS
│   ├── AGENTS.md                              # 📖 Guía específica del agente para el Backend
│   ├── index.js                               # Entrada servidor HTTP
│   ├── src/                                   # Clean Architecture (domain, functions, repositories)
│   └── tests/                                 # Suite de pruebas automatizadas (Jest)
└── web/                                       # FRONTEND REACT 19 + VITE SPA
    ├── AGENTS.md                              # 📖 Guía específica del agente para el Frontend
    ├── e2e/                                   # Pruebas End-to-End herméticas (Playwright + POM)
    ├── src/                                   # Componentes, vistas, servicios y tests (Vitest + MSW)
    ├── playwright.config.js                   # Configuración Playwright (Chromium)
    ├── vite.config.js                         # Configuración Vite y Vitest en jsdom
    └── package.json
```

---

## 🏛️ Jerarquía de Agentes y Reglas

TrendFinder adopta una **arquitectura de reglas jerárquica** para evitar la sobrecarga de contexto y garantizar máxima especialización:

1. **Nivel Raíz (Global)**:
   - Este archivo (`AGENTS.md`) define el dominio general, la visión de negocio y los estándares del monorepo.
   - `.agents/rules/` contiene las reglas compartidas entre frontend y backend (fórmulas del negocio, seguridad de secretos y workflow de Git).
2. **Nivel Backend (`api/AGENTS.md`)**:
   - Cuando trabajes en el backend (`api/`), consulta prioritariamente [`api/AGENTS.md`](api/AGENTS.md).
   - Contiene: Clean Architecture en Node.js, Sequelize ORM, Workers de scraping, proxies, candados cPanel, seguridad HTTP y pruebas TDD con Jest.
3. **Nivel Frontend (`web/AGENTS.md`)**:
   - Cuando trabajes en el frontend (`web/`), consulta prioritariamente [`web/AGENTS.md`](web/AGENTS.md).
   - Contiene: Arquitectura React 19 SPA, Vite, CSS Modules, cliente Axios centralizado, diseño responsivo, reglas de testing (Vitest, MSW, Playwright) y ESLint / Fast Refresh.

---

## 🎯 Dominio Central: Algoritmo DropScore

El **DropScore** evalúa la viabilidad comercial de un producto en un valor entero entre `0` y `100`:
$$DropScore = (P_{\text{perf}} \times 0.35) + (P_{\text{vol}} \times 0.35) + (P_{\text{growth}} \times 0.30) + \text{Bono}_{\text{breakout}}$$

- **Margen COD ($P_{\text{perf}}$, 35%)**: Evalúa el margen bruto contra entrega. Margen $\ge 80\% \to 100$ pts; $\le 20\% \to 0$ pts.
- **Volumen diario ($P_{\text{vol}}$, 35%)**: Normalizado sobre meta de 15 unidades diarias.
- **Crecimiento de tendencia ($P_{\text{growth}}$, 30%)**: Aceleración entre la segunda y la primera mitad del periodo evaluado.
- **Bono de Despegue ($\text{Bono}_{\text{breakout}}$)**: +15 puntos para productos que arrancan desde 0 ventas anteriores con tracción reciente.

**Rangos e Insignias Visuales**:
- `85 - 100`: Excelente / **GANADOR** (Verde `#10b981`, con pulso animado).
- `80 - 84`: Alto (Verde `#10b981`).
- `50 - 79`: Medio (Ámbar/Naranja `#f59e0b`).
- `0 - 49`: Bajo (Rojo `#ef4444`).

Para detalles matemáticos completos, consultar `.agents/rules/01-dropscore-and-financial-domain.md` y `docs/dropscore.md`.

---

## 🔐 Seguridad y Archivos Estrictamente Excluidos

Los siguientes archivos y carpetas **NUNCA** deben incluirse en commits ni exponerse al exterior:
- Archivos de entorno: `.env`, `.env.*`.
- Credenciales y proxies: `tokens.txt`, `proxies.txt`.
- Archivos de bloqueo y estado: `*.lock`, `bot_state.json`.
- Registros y reportes temporales: carpetas `logs/`, `test-results/`, `playwright-report/`, archivos `*.log`.
- Bloqueos de dependencias: `package-lock.json` (ignorado en este repositorio).

---

## 🚀 Flujo de Verificación y Git (Protocolo del Repositorio)

Antes de cualquier commit o push, ejecutar la verificación completa:

1. **Backend**:
   ```bash
   cd api && npm test
   ```
   (El 100% de las suites de Jest debe pasar limpiamente).
2. **Frontend**:
   ```bash
   cd web && npm test
   cd web && npm run test:e2e
   cd web && npm run lint
   ```
   (100% de tests unitarios/MSW y E2E Playwright aprobados, 0 errores y 0 advertencias de ESLint).
3. **Versionado Semántico (SemVer)**:
   - Incrementar versión en `api/package.json` o `web/package.json` según el alcance (MINOR para `feat:`, PATCH para `fix:`/`refactor:`).
4. **Mensaje de Commit Estructurado**:
   ```
   <tipo>(<ámbito>): <descripción corta en imperativo>

   Por qué:
   - Explicación del problema o motivación.

   Qué se hizo:
   - Lista de cambios técnicos puntuales.

   Verificación:
   - Tests y linter ejecutados con éxito.
   ```
