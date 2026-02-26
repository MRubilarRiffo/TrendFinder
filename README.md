# TrendFinder

TrendFinder es una aplicación Node.js enfocada en la recolección, orquestación y almacenamiento de datos provenientes de la API de **Dropi** (Dropi Chile). Utiliza algoritmos avanzados de rotación de proxies y tokens para evadir medidas de mitigación y Web Application Firewalls (WAF) garantizando una ingesta constante y confiable de catálogos de productos a gran escala.

## Características Principales

- **Scraper Concurrente V3:** Orquestación mediante ráfagas concurrentes para maximizar la velocidad de recolección de múltiples páginas simultáneamente.
- **Evasión de WAF Avanzada:** Mediante integraciones como `https-proxy-agent` evita bloqueos 405 (mutación de POST en túneles) y distribuye inteligentemente el tráfico utilizando proxy lists (Webshare).
- **Rotación Estratégica:** Implementación de algoritmos iterativos (Round Robin) para tokens y selección inteligente de proxies para evadir bloqueos por rate-limit (Http 429).
- **Procesamiento Asíncrono en DB:** Integración con Sequelize/MySQL capaz de evaluar, discriminar e insertar (BulkCreate) macro-bloques de productos nuevos y actualizados de manera veloz.
- **Robustez y Resiliencia:** Tolerancia a fallos con reintentos programados (`maxRetries`), tiempos de *cooldown* y *failovers* para HTTP 502/503.

## Tecnologías Utilizadas

- **Runtime:** [Node.js](https://nodejs.org/)
- **Servidor:** [Express.js](https://expressjs.com/) (con `helmet`, `cors`, `morgan` y limita tráfico con `express-rate-limit`)
- **Base de Datos:** [MySQL](https://www.mysql.com/) modelada a través de [Sequelize ORM](https://sequelize.org/)
- **Cliente HTTP:** [Axios](https://axios-http.com/) complementado con `https-proxy-agent` para túneles limpios CONNECT.

## Requisitos Previos

Antes de ejecutar este proyecto, asegúrate de tener instalado:
- **Node.js**: v16.x o superior
- **NPM**: v8.x o superior
- **MySQL**: Motor de bases de datos corriendo local o remotamente.

## Instalación y Despliegue

1. **Clonar el Repositorio:**
   ```bash
   git clone https://github.com/MRubilarRiffo/TrendFinder.git
   cd TrendFinder
   ```

2. **Instalar Dependencias:**
   ```bash
   npm install
   ```

3. **Configuración de Entorno:**
   Copia el archivo de ejemplo para crear tus variables en un nuevo archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   *Rellena el `.env` con las credenciales de tu base de datos y la llave maestra (master token) si aplica.*

4. **Configurar Componentes Evasivos (OPCIONAL/RECOMENDADO):**
   Para hacer uso completo del Rotator, crea los siguientes archivos en la carpeta `src/config/`:
   - `src/config/proxies.txt` -> Agrega un proxy por línea en formato HTTP.
   - `src/config/tokens.txt` -> Agrega lista complementaria de *Bearer tokens* o *integration-keys* para hacer split de límites 429.

## Uso

Para arrancar el orquestador en ambiente de pruebas (desarrollo):

```bash
npm run dev
```

*(Correrá el servidor Express puerto local y el observador `nodemon` detectará cambios automáticamente).*

Para correr la versión final en producción:

```bash
npm start
```

## Arquitectura y Organización (Extracto)
- `/src/services/scraper/` -> Servicios directos para el consumo API.
- `/src/controllers/` -> Controladores lógicos del backend.
- `/src/utils/` -> Helpers como el gestor de rotación de conectividad.
- `/logs/` -> Registros crudos para debug local.

---

*Desarrollado para prospección e indexación masiva de eCommerce trends.*