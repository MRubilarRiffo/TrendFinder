# Matriz de Troubleshooting y Resolución de Incidentes en Workers

Esta guía contiene los procedimientos de diagnóstico rápido, identificación de causa raíz y comandos de emergencia para resolver incidencias operativas en los bots de TrendFinder.

---

## 📌 1. Matriz de Síntomas y Acciones Rápidas

| Síntoma Observado | Causa Raíz Probable | Solución Operativa |
| :--- | :--- | :--- |
| **El cron se ejecuta pero finaliza en 0 segundos** sin procesar productos. | Existe un candado (`bot.lock` o `sales_snapshot.lock`) que detecta ejecución solapada. | Comprobar procesos activos con `ps aux \| grep node`. Si no hay proceso real en ejecución, eliminar el candado con `rm -f bot.lock`. |
| **`HTTP 429 ThrottleRequests`** en el log de errores. | Dropi bloqueó temporalmente la API key o la IP por superar la cuota permitida. | 1. Añadir más claves válidas en `tokens.txt` para activar el balanceo Round-Robin.<br>2. Verificar que `proxies.txt` tenga proxies activos para rotar la IP de salida. |
| **`HTTP 401 Unauthorized`** o `isSuccess: false`. | Token de integración vencido, revocado o mal configurado para el país. | Generar un nuevo token en el panel de Dropi y actualizar `tokens.txt` o `config.js`. Para Colombia, confirmar que `userVerified: true` esté activo. |
| **`ETIMEDOUT` o `ECONNREFUSED`** constantes en reintentos. | Proxies de `proxies.txt` caídos o con latencia $> 30$ segundos. | Probar los proxies con `curl`. Purgar los caídos. Como contingencia rápida, vaciar `proxies.txt` para activar la salida directa por la IP del servidor. |
| **`SequelizeConnectionError: Too many connections`**. | Conexiones MySQL retenidas por procesos colgados en cPanel. | Matar procesos zombis de Node con `kill -9 <PID>`. Verificar que `max: 5, min: 0` se mantenga en el pool de `database.js`. |

---

## 💻 2. Cheat Sheet de Comandos de Diagnóstico por SSH

### 2.1 Monitoreo de Logs en cPanel
```bash
# Inspeccionar las últimas 50 líneas del log de errores del scraper
tail -n 50 /home/<cpanel_user>/<api_domain>/scraperRunner-error.log

# Inspeccionar el log de errores de snapshots
tail -n 50 /home/<cpanel_user>/<api_domain>/salesSnapshotRunner-error.log

# Monitorear errores en tiempo real
tail -f /home/<cpanel_user>/<api_domain>/scraperRunner-error.log
```

### 2.2 Auditoría y Liberación de Candados
```bash
# Ver información del archivo candado (fecha y tamaño)
ls -la /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock

# Leer el contenido del candado (PID del proceso responsable)
cat /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock

# Verificar si el proceso sigue vivo en el sistema
ps -p <PID_DEL_LOCK> -o pid,vsz,time,cmd

# Liberar el candado forzosamente si el proceso ya no existe:
kill -9 <PID_DEL_LOCK> 2>/dev/null
rm -f /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock
```

### 2.3 Prueba de Salud de Proxies
```bash
# Probar conexión HTTP a través de un proxy específico hacia la API de Dropi
curl -x http://usuario:password@host:port -I https://api.dropi.co
```
Si responde con cabeceras HTTP en menos de 3 segundos, el proxy está operativo. Si arroja `Connection timed out`, debe eliminarse de `proxies.txt`.

### 2.4 Modo de Emergencia sin Proxies
Si tu proveedor de proxies sufre una caída total y requieres que el catálogo se sincronice de inmediato:
```bash
# 1. Renombrar temporalmente el archivo de proxies
mv /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt \
   /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt.bak

# 2. Ejecutar manualmente el scraper saliendo por la IP local
node /home/<cpanel_user>/<api_domain>/src/workers/scraper/scraperRunner.js

# 3. Restaurar cuando el proveedor se normalice
mv /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt.bak \
   /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt
```
