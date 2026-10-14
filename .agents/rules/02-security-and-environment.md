---
trigger: always_on
description: Reglas de seguridad globales, protección de secretos y exclusión estricta de archivos sensibles en Git.
---

# Regla: Seguridad Global, Entorno y Protección de Secretos

Esta regla establece las directrices inquebrantables de seguridad informática, gestión de secretos y protección de la infraestructura para todo el repositorio TrendFinder.

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

## 2. Ocultamiento y Ofuscación de Secretos en Errores y Logs

- Al registrar información en `logMessage.js`, consolas o trazas de ejecución:
  - **PROHIBIDO** imprimir contraseñas de base de datos, tokens completos de Dropi o credenciales de proxies.
  - Si se requiere loguear un token en depuración, ofuscarlo mostrando únicamente fragmentos internos (ej. `...${token.substring(86, 130)}...`).
- Nunca incluir API keys, tokens JWT o credenciales codificadas en duro (*hardcoded*) en componentes de frontend ni controladores de backend.
