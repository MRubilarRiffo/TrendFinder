---
trigger: always_on
description: Reglas de seguridad, protección de secretos, rate limiting y aislamiento de archivos de entorno y candados.
---

# Regla: Seguridad, Entorno y Protección de Secretos

Esta regla establece las directrices inquebrantables de seguridad informática, gestión de secretos y protección de la infraestructura para el proyecto TrendFinder.

---

## 1. Archivos Estrictamente Sensibles y Exclusión de Git

Los siguientes archivos y carpetas **NUNCA** deben incluirse en commits ni subirse al repositorio remoto bajo ninguna circunstancia:

- **Archivos de Entorno**: `.env`, `.env.example` (salvo que sea un template sin credenciales), `.env.development`, `.env.production`.
- **Credenciales y Configuración de Scraping**:
  - `proxies.txt` / `api/src/adapters/dropiApi/config/proxies.txt`
  - `tokens.txt` / `api/src/adapters/dropiApi/config/tokens.txt`
- **Archivos de Bloqueo y Estado de Procesos (Locks & State)**:
  - `*.lock`, `app.lock`, `bot.lock`, `sales_snapshot.lock`, `bot_state.json`.
- **Registros y Logs**:
  - Carpetas `logs/`, archivos `*.log`, `npm-debug.log*`.
- **Bloqueos de Dependencias**:
  - `package-lock.json` (gestionado en `.gitignore` para este proyecto).

---

## 2. Protección de Endpoints y Middleware de Seguridad

- **Rate Limiting (`limiterMiddleware.js`)**:
  - Todos los endpoints públicos expuestos (`/api/products/*`, `/api/sales/*`) deben estar protegidos por `express-rate-limit`.
  - Configuración base: 50 peticiones por ventana de 15 minutos por dirección IP.
- **Cabeceras HTTP Seguras**:
  - El servidor Express debe inicializar `helmet()` para configurar cabeceras de protección (X-Content-Type-Options, Strict-Transport-Security, etc.).
- **Handler 404 JSON**:
  - Todo endpoint no reconocido por Express debe responder con formato JSON uniforme (`{ success: false, error: 'Ruta no encontrada' }`) y status 404, evitando páginas de error HTML por defecto de Express.
- **CORS Configurado**:
  - Restringir los orígenes permitidos en producción a los dominios del frontend autorizados.

---

## 3. Sanitización y Validación de Parámetros de Entrada

- **IDs de Producto**:
  - Validar que los IDs en la URL (`/api/products/stats/:id`) sean números enteros positivos antes de consultar la base de datos.
- **Fechas**:
  - Validar que `startDate` y `endDate` sigan el formato ISO `YYYY-MM-DD` y que `startDate <= endDate`.
- **Límites y Paginación**:
  - Los parámetros `limit` deben acotarse a rangos seguros (por defecto 10, máximo 50 por página) para evitar ataques de denegación de servicio por consultas masivas.
  - Para `/api/sales`, la paginación por cursor debe descodificar de forma segura el token Base64 y manejar cursores inválidos o corruptos retornando error 400 limpio sin exponer trazas internas.

---

## 4. Ocultamiento de Secretos en Errores y Logs

- Al registrar errores en `logMessage.js` o en la consola:
  - **PROHIBIDO** imprimir contraseñas de base de datos, tokens completos de Dropi o credenciales de proxies.
  - Si se requiere loguear un token en depuración, ofuscarlo mostrando únicamente fragmentos internos (ej. `...${token.substring(86, 130)}...`).
- En las respuestas HTTP de error (`errorMiddleware.js`):
  - Nunca exponer información de la base de datos (queries Sequelize crudas, stack traces) al cliente externo.
  - Cuando `NODE_ENV === 'production'`, todo error interno (`statusCode >= 500`) debe responder obligatoriamente con el mensaje sanitizado `'Error interno del servidor'`, persistiendo la traza real únicamente en logs internos privados.
