# Guía de Despliegue en cPanel, CloudLinux y Cron Jobs

Esta guía técnica detalla cómo configurar y mantener las tareas programadas (*Cron Jobs*) para los workers de TrendFinder en servidores administrados con **cPanel** y **CloudLinux**.

---

## 📌 1. Entorno de Ejecución: CloudLinux y Node.js Selector

En servidores cPanel con CloudLinux, cada aplicación Node.js se ejecuta dentro de un entorno virtual independiente denominado `nodevenv`. Por esta razón, el ejecutor de cron no puede simplemente invocar `node`, sino que debe referenciar el binario absoluto dentro del entorno virtual de la versión seleccionada (por ejemplo, Node 20.x).

### Anatomía de la Ruta del Binario:
```
/home/<cpanel_user>/nodevenv/<app_domain>/<node_version>/bin/node
```
Donde:
- `<cpanel_user>`: Es el nombre de usuario de la cuenta de cPanel (ej. `usuario`).
- `<app_domain>`: Es la carpeta o subdominio asignado en cPanel (ej. `api.tudominio.com`).
- `<node_version>`: Es el número de versión principal de Node (ej. `20`).

---

## ⏰ 2. Configuración en la Interfaz de cPanel

Accede a **cPanel** $\to$ Sección **Avanzada** $\to$ **Tareas de Cron** (*Cron Jobs*).

### 2.1 Tarea 1: Scraper de Catálogo (`scraperRunner.js`)
- **Frecuencia**: Cada 1 hora (al minuto 0).
- **Expresión Cron**: `0 * * * *`
- **Comando a programar**:
  ```bash
  /home/<cpanel_user>/nodevenv/<api_domain>/20/bin/node /home/<cpanel_user>/<api_domain>/src/workers/scraper/scraperRunner.js > /dev/null 2>> /home/<cpanel_user>/<api_domain>/scraperRunner-error.log
  ```

### 2.2 Tarea 2: Snapshots Analíticos de Medianoche (`salesSnapshotRunner.js`)
- **Frecuencia**: Diario a medianoche (00:05 AM, para procesar el día calendario anterior cerrado).
- **Expresión Cron**: `5 0 * * *`
- **Comando a programar**:
  ```bash
  /home/<cpanel_user>/nodevenv/<api_domain>/20/bin/node /home/<cpanel_user>/<api_domain>/src/workers/snapshots/salesSnapshotRunner.js > /dev/null 2>> /home/<cpanel_user>/<api_domain>/salesSnapshotRunner-error.log
  ```

---

## 🔇 3. Técnica de Redirección Silenciosa

La sintaxis `> /dev/null 2>> <archivo.log>` resuelve dos problemas operativos críticos en cPanel:

1. **`> /dev/null` (Silenciamiento de stdout)**:
   Por defecto, el servicio `crond` de Linux envía un correo electrónico al administrador por cada línea emitida en `stdout`. Dado que el scraper emite cientos de mensajes de depuración en una corrida normal, silenciar `stdout` previene el colapso del buzón de correo.
2. **`2>> <archivo.log>` (Registro exclusivo de errores)**:
   Redirige únicamente el descriptor de archivo 2 (`stderr`) en modo *append* (`>>`). Si ocurre una excepción no controlada (`unhandledRejection`, `uncaughtException` o error de conexión), la traza queda almacenada para su auditoría inmediata.

---

## 🔒 4. Concurrencia y Candados con `lockManager.js`

Debido a que CloudLinux puede terminar procesos bruscamente al sobrepasar cuotas de memoria o CPU (**LVE limits** con señal `SIGKILL`), los callbacks habituales de finalización de Node.js no se ejecutan.

### Algoritmo de Adquisición y Liberación:
1. Al iniciar, el worker invoca `acquireLock(lockFilePath, maxAgeHours = 2)`:
   - Si no existe el candado, crea `bot.lock` o `sales_snapshot.lock` con el PID actual y continúa.
   - Si existe y tiene $\le 2$ horas, detecta una corrida previa aún activa y aborta de inmediato con código `0` para no duplicar peticiones ni conexiones a MySQL.
   - Si existe pero tiene $> 2$ horas, asume que el proceso murió inesperadamente por LVE, elimina el archivo huérfano (`fs.unlinkSync`) y re-adquiere el control automáticamente.
2. Al finalizar:
   - En éxito o en bloque `catch`, llama a `releaseLock(lockFilePath)` y `conn.close()`.

---

## 💻 5. Verificación Manual por SSH

Para validar los workers antes de dejarlos activos en cron:

```bash
# 1. Ingresar por SSH al servidor
ssh usuario@servidor.com

# 2. Navegar a la carpeta de la API
cd /home/<cpanel_user>/<api_domain>

# 3. Probar ejecución interactiva del scraper
/home/<cpanel_user>/nodevenv/<api_domain>/20/bin/node src/workers/scraper/scraperRunner.js

# 4. Probar ejecución interactiva de snapshots
/home/<cpanel_user>/nodevenv/<api_domain>/20/bin/node src/workers/snapshots/salesSnapshotRunner.js
```
Ambos scripts deben mostrar en consola `Proceso finalizado correctamente. Saliendo... (0)`.
