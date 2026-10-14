# Guía Operativa de Bots y Workers (TrendFinder Workers)

> [!NOTE]
> **Puerta de Entrada de Workers**: Este archivo resume la arquitectura y comandos esenciales de los bots. Para guías detalladas paso a paso sobre despliegue en cPanel, resiliencia de red y algoritmos de inventario, consulta [`docs/workers/`](../../../docs/workers/README.md).

Esta guía documenta la arquitectura, despliegue en cPanel, configuración de cron jobs, mecanismos de resiliencia y resolución de problemas para los workers independientes de TrendFinder.

---

## 📌 1. Visión General y Arquitectura de Workers

Los **Workers** de TrendFinder son procesos autónomos ejecutados en segundo plano diseñados para operar de forma totalmente desacoplada del servidor HTTP principal (`index.js`). Esta separación garantiza que las operaciones intensivas de I/O de red (scraping masivo de Dropi) y procesamiento analítico de base de datos nunca bloqueen el *Event Loop* de Node.js ni degraden la latencia de la API REST que atiende al frontend.

### 1.1 Diagrama de Flujo del Pipeline de Datos

```mermaid
flowchart TD
    subgraph DropiExt["Ecosistema Externo"]
        DropiAPI["Dropi REST API\n(CO, CL, MX, PA, EC, PE, ES)"]
    end

    subgraph Workers["Workers Autónomos (cPanel Crons)"]
        Scraper["scraperRunner.js\n(Frecuencia: Cada 1 hora)"]
        Snapshots["salesSnapshotRunner.js\n(Frecuencia: Diario a medianoche)"]
    end

    subgraph Storage["Persistencia Relacional (MySQL)"]
        DB_Raw[("Tablas Transaccionales:\n- Products\n- Stocks\n- ProductSales")]
        DB_Agg[("Tabla Analítica Agregada:\n- SalesSnapshots\n(1, 7 y 30 días + Sparklines)")]
    end

    subgraph HTTP["Consumo Frontend"]
        API["TrendFinder REST API\n(/api/sales, /api/products)"]
        Web["Frontend SPA React 19\n(Dashboard & Catálogo)"]
    end

    DropiAPI -->|Scraping por lotes + Proxies| Scraper
    Scraper -->|Detecta deltas de inventario| DB_Raw
    DB_Raw -->|Lee ventas históricas cerradas| Snapshots
    Snapshots -->|Guarda snapshots pre-calculados| DB_Agg
    DB_Agg -->|Lectura indexada ultra-rápida| API
    API -->|Payloads formateados con DropScore| Web
```

---

### 1.2 Responsabilidades de los Workers

| Worker | Script Principal | Frecuencia | Responsabilidad Principal |
| :--- | :--- | :--- | :--- |
| **Scraper de Catálogo** | `scraperRunner.js` | Cada 1 hora | Descarga concurrentemente el catálogo de Dropi por país, mapea productos existentes y nuevos, compara variaciones de inventario (`stock`) para registrar unidades vendidas en `ProductSales` y actualiza precios de costo y sugeridos. |
| **Snapshots de Ventas** | `salesSnapshotRunner.js` | Diario (00:05) | Procesa días calendario cerrados (medianoche a medianoche). Genera agregados para periodos de 1, 7 y 30 días, calculando métricas analíticas (`trendGrowth`, `breakoutScore`, `dropScore`) y suavizando la serie temporal (*sparklines*) con Winsorización de Tukey. |

---

### 1.3 Ciclo de Vida y Desconexión Limpia de Base de Datos

A diferencia del servidor web Express que mantiene un pool de conexiones abierto indefinidamente, los workers siguen un ciclo de vida efímero estricto (*run-and-exit*):

1. **Adquisición de Candado**: Comprueban la ausencia de ejecuciones previas colgadas mediante `lockManager.js`. Si hay un candado activo y vigente, el proceso finaliza inmediatamente con código `0` sin duplicar trabajo.
2. **Conexión e Ingesta**: Inicializan Sequelize, consumen los servicios externos o ejecutan consultas agregadas por lotes bajo transacciones controladas.
3. **Liberación y Cierre Forzoso**:
   - En caso de **éxito**: registran la finalización en `botState.js`, eliminan el archivo de bloqueo con `releaseLock()`, cierran explícitamente el pool con `await conn.close()` y salen con `process.exit(0)`.
   - En caso de **error no controlado**: capturan la excepción en el bloque `catch`, liberan el candado para no dejar el bot atascado, cierran `conn.close()` en un bloque seguro y terminan con `process.exit(1)`.

> [!IMPORTANT]
> Nunca retires las llamadas `await conn.close()` ni los bloques `try/finally` que liberan candados. En entornos de hosting compartido con cPanel, las conexiones MySQL huérfanas pueden agotar rápidamente el límite de `max_user_connections`.

---

### 1.4 Mapeo de Archivos del Módulo Workers

```
api/src/workers/
├── scraper/
│   └── scraperRunner.js         # Script CLI para scraping por país y sincronización
├── snapshots/
│   └── salesSnapshotRunner.js   # Script CLI para cálculo analítico de snapshots
├── README.md                    # Esta guía operativa
└── (Dependencias clave):
    ├── ../adapters/dropiApi/    # Conexión HTTP a Dropi, proxyManager y rotationManager
    ├── ../domain/InventorySync.js # Lógica de detección de ventas vs ajustes de stock
    ├── ../helpers/lockManager.js # Gestión de candados *.lock en disco con recuperación
    └── ../helpers/botState.js   # Persistencia del timestamp del último escaneo
```

---

### 1.5 Tratamiento Especial por País

El scraper itera sobre las configuraciones de cada país soportado (`Colombia`, `Chile`, `México`, `Panamá`, entre otros). Algunas APIs regionales de Dropi presentan reglas particulares:
- **Colombia (`Colombia`)**: Dropi exige obligatoriamente la bandera `userVerified: true` en el cuerpo de la petición POST del catálogo; de omitirse, Dropi responde con error de autenticación o devuelve un catálogo vacío.
- **Monedas e IDs**: Cada país opera con su respectivo token de integración (`dropi_token`) y su endpoint regional configurado en `configByCountries`.

---

## ⏰ 2. Configuración y Despliegue en cPanel (Cron Jobs)

En servidores con **cPanel** y **CloudLinux (Node.js Selector / nodevenv)**, las tareas programadas no se ejecutan como demonios persistentes sino a través del módulo nativo **Tareas de Cron** (*Cron Jobs*).

### 2.1 Patrón de Ejecución en CloudLinux Node.js Selector

CloudLinux aisla cada aplicación Node.js dentro de un entorno virtual (`nodevenv`). Por lo tanto, el cron debe invocar directamente el binario de Node correspondiente a la versión configurada (ej. Node 20.x) y pasar la ruta absoluta al script.

> [!NOTE]
> Se utiliza la redirección `> /dev/null 2>> <archivo-error.log>` para:
> 1. Silenciar la salida estándar (`stdout`), evitando que cPanel intente enviar un correo electrónico por cada ejecución normal.
> 2. Capturar únicamente los errores no controlados y trazas de excepción (`stderr`) en un archivo de log dedicado para auditoría rápida.

---

### 2.2 Configuración de los Cron Jobs

Accede a **cPanel** $\to$ Sección **Avanzada** $\to$ **Tareas de Cron** y programa las siguientes dos tareas:

#### Tarea 1: Scraper de Catálogo (`scraperRunner.js`)
- **Frecuencia**: Cada 1 hora (al minuto 0).
- **Expresión Cron**: `0 * * * *`
- **Comando de Ejecución**:
  ```bash
  /home/<cpanel_user>/nodevenv/<api_domain>/20/bin/node /home/<cpanel_user>/<api_domain>/src/workers/scraper/scraperRunner.js > /dev/null 2>> /home/<cpanel_user>/<api_domain>/scraperRunner-error.log
  ```

#### Tarea 2: Snapshots Analíticos de Ventas (`salesSnapshotRunner.js`)
- **Frecuencia**: Una vez al día a medianoche (00:05 AM).
- **Expresión Cron**: `5 0 * * *`
- **Comando de Ejecución**:
  ```bash
  /home/<cpanel_user>/nodevenv/<api_domain>/20/bin/node /home/<cpanel_user>/<api_domain>/src/workers/snapshots/salesSnapshotRunner.js > /dev/null 2>> /home/<cpanel_user>/<api_domain>/salesSnapshotRunner-error.log
  ```

> [!TIP]
> **Sobre la estructura de rutas en cPanel**:
> - Si configuraste el subdominio de la API (ej. `api.tudominio.com`) apuntando directamente al contenido de la carpeta `api/`, la ruta relativa interna es `src/workers/...` (como en los comandos de arriba).
> - Si el subdominio apunta a la raíz del monorepo, la ruta incluirá la carpeta `api/`: `/home/<cpanel_user>/<app_folder>/api/src/workers/...`.

---

### 2.3 Resolución de Variables de Entorno en Cron

Cuando cPanel ejecuta un cron, el directorio de trabajo (*current working directory*) suele ser `/home/<cpanel_user>/` y no la carpeta del proyecto.

Para evitar que los scripts fallen por falta de variables de base de datos o credenciales de Dropi, ambos workers resuelven el archivo `.env` de forma absoluta mediante:
```javascript
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
```
Esto asegura que la configuración de conexión a MySQL se cargue correctamente sin importar desde qué ruta invoque el cron.

---

### 2.4 Verificación Manual por SSH

Antes de dejar los cron jobs activos, es una buena práctica probar la ejecución manual mediante SSH para validar la conectividad a la base de datos y la rotación inicial:

```bash
# 1. Ingresar por SSH y activar el entorno virtual de Node (opcional si usas ruta absoluta)
source /home/<cpanel_user>/nodevenv/<api_domain>/20/bin/activate

# 2. Navegar al directorio de la API
cd /home/<cpanel_user>/<api_domain>

# 3. Ejecutar el scraper manualmente en modo interactivo (verás los logs en pantalla)
node src/workers/scraper/scraperRunner.js

# 4. Probar el cálculo de snapshots analíticos
node src/workers/snapshots/salesSnapshotRunner.js
```

Si ambos comandos muestran la salida de éxito (`[BOT] Proceso finalizado correctamente. Saliendo... (0)`) y liberan el candado, los crons están listos para operar de forma desatendida.

---

## 🔒 3. Concurrencia y Gestión de Candados (`lockManager`)

En entornos de hosting compartido gobernados por **CloudLinux (LVE Manager)**, los procesos de Node.js están sujetos a límites de CPU, memoria física (PMEM) y operaciones de I/O. Si un proceso supera temporalmente su cuota asignada, el sistema operativo le envía una señal terminante `SIGKILL` (código 9 o 137). En este escenario, Node.js muere al instante sin posibilidad de ejecutar callbacks de salida, bloques `catch` ni cláusulas `finally`.

Para garantizar que un proceso caído no deje el sistema bloqueado eternamente ni permita que múltiples instancias compitan por la base de datos, los workers implementan el módulo [`lockManager.js`](../helpers/lockManager.js).

---

### 3.1 Archivos de Bloqueo del Sistema

Cada worker gestiona su propio archivo de candado físico en disco:

| Worker | Archivo de Candado | Ubicación |
| :--- | :--- | :--- |
| **Scraper de Catálogo** | `bot.lock` | `api/src/workers/scraper/bot.lock` |
| **Snapshots de Ventas** | `sales_snapshot.lock` | `api/src/workers/snapshots/sales_snapshot.lock` |

El contenido de estos archivos es un JSON ligero con trazabilidad del proceso:
```json
{
  "pid": 28419,
  "timestamp": "2026-10-13T23:45:00.123Z"
}
```

---

### 3.2 Algoritmo de Adquisición y Recuperación Automática

Al iniciar cualquier worker, se invoca `acquireLock(lockFilePath, maxAgeHours = 2)`:

```mermaid
flowchart TD
    Start["Inicio de Worker"] --> CheckLock{"¿Existe archivo .lock?"}
    CheckLock -- No --> WriteLock["Crear .lock con PID y timestamp"] --> RunWorker["Ejecutar proceso normalmente"]
    CheckLock -- Sí --> CheckAge{"¿Antigüedad del archivo > 2 horas?"}
    
    CheckAge -- No (Proceso activo) --> LogSkip["Registrar 'Ejecución solapada detectada'"] --> Abort["process.exit(0) (Aborta silenciosamente)"]
    
    CheckAge -- Sí (Proceso huérfano) --> LogOrphan["Registrar 'Candado huérfano detectado'"] --> DeleteLock["fs.unlinkSync(.lock) (Auto-reparación)"] --> WriteLock
    
    RunWorker --> Success{"¿Finalizó con éxito?"}
    Success -- Sí --> Release["releaseLock() (Elimina .lock)"] --> Exit0["process.exit(0)"]
    Success -- No (Error) --> CatchErr["Capturar error"] --> ReleaseErr["releaseLock()"] --> Exit1["process.exit(1)"]
```

#### Reglas de Decisión:
1. **Ejecución Solapada Legítima ($\le 2$ horas)**: Si el cron anterior todavía está corriendo (por ejemplo, sincronizando un catálogo extenso con proxies lentos), el nuevo intento aborta sin error para no duplicar peticiones HTTP ni saturar el pool de conexiones de MySQL.
2. **Auto-Recuperación de Procesos Huérfanos ($> 2$ horas)**: Si transcurrieron más de 2 horas desde la creación del candado, se considera que el proceso original murió por un límite LVE de cPanel. El nuevo proceso elimina el archivo huérfano y reasume el control sin requerir la intervención manual del administrador.

---

### 3.3 Procedimiento de Desbloqueo Manual por SSH

Si como mantenedor necesitas forzar la ejecución inmediata de un worker y sabes que no hay ninguna tarea corriendo de fondo, puedes eliminar el candado manualmente:

```bash
# Para desbloquear el Scraper
rm -f /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock

# Para desbloquear los Snapshots
rm -f /home/<cpanel_user>/<api_domain>/src/workers/snapshots/sales_snapshot.lock
```

> [!CAUTION]
> Antes de borrar un candado manualmente, asegúrate de que no haya un proceso de Node.js corriendo en segundo plano:
> ```bash
> ps aux | grep node
> ```
> Si observas un proceso zombi o colgado, finalízalo con `kill -9 <PID>` antes de eliminar el archivo `.lock`.

---

## 🛡️ 4. Evasión de Bloqueos, Proxies y Tokens de Dropi

La API de Dropi está protegida por políticas de *rate limiting* a nivel de framework (**Laravel ThrottleRequests**) y cortafuegos de red. Cuando un cliente realiza cientos de peticiones seguidas desde la misma dirección IP o con la misma clave de integración, Dropi responde con `429 Too Many Requests` o bloqueos temporales `403 Forbidden`.

Para mitigar este riesgo de forma completamente automatizada, el módulo [`adapters/dropiApi/`](../adapters/dropiApi/) implementa una capa dual de rotación de red e identidades.

---

### 4.1 Configuración de Proxies (`proxies.txt`)

El archivo de configuración debe ubicarse en:
```
api/src/adapters/dropiApi/config/proxies.txt
```
*(Este archivo está incluido en `.gitignore` por seguridad; existe una plantilla de ejemplo en `proxies.example.txt`).*

#### Formatos Aceptados por Línea:
El analizador en [`rotationManager.js`](../adapters/dropiApi/rotationManager.js) admite múltiples formatos estándar de proveedores de proxies (BrightData, Webshare, IPRoyal, etc.):

```text
# 1. Con autenticación (host:port:user:pass)
192.168.1.50:8080:usuario_proxy:password123

# 2. Con autenticación en formato URI
http://usuario_proxy:password123@192.168.1.50:8080

# 3. Sin autenticación (por IP autorizada)
192.168.1.50:8080
```

#### Comportamiento de Fallback:
Si el archivo `proxies.txt` no existe o está vacío, `rotationManager` registra una advertencia en consola y realiza las peticiones directamente utilizando la **dirección IP local** del servidor cPanel sin arrojar excepciones.

---

### 4.2 Arquitectura de Red: Evasión de Errores `405 Method Not Allowed`

Al realizar peticiones `POST` a través de servidores proxy HTTP transparentes convencionales, muchos intermediarios mutan la petición a `GET` o descartan el cuerpo del payload JSON, lo que provoca que los servidores de Dropi respondan con:
```text
HTTP 405 Method Not Allowed
```

#### La Solución Técnica Implementada:
En [`dropiApiService.js`](../adapters/dropiApi/dropiApiService.js), cada petición utiliza `HttpsProxyAgent` de la librería `https-proxy-agent` desactivando el proxy nativo de Axios:

```javascript
const axiosConfig = {
    url: apiUrl,
    method: 'POST',
    headers: headers,
    data: body,
    timeout: 30000 // 30 segundos
};

if (proxyUrl) {
    // Establece un túnel TCP CONNECT puro de extremo a extremo
    axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.proxy = false; // OBLIGATORIO: desactiva el proxy transparente de Axios
}
```

Esta configuración obliga al proxy a negociar un túnel TCP `CONNECT` ciego. Todo el tráfico TLS y los paquetes HTTP `POST` viajan cifrados dentro del túnel sin que el proxy pueda inspeccionar ni alterar el método HTTP o las cabeceras.

---

### 4.3 Rotación Secuencial de Tokens Dropi (`tokens.txt`)

Para evitar agotar la cuota de peticiones por usuario asignada en el backend de Dropi, el scraper distribuye las peticiones en modo **Round-Robin** entre múltiples tokens de integración.

Ubicación del archivo:
```
api/src/adapters/dropiApi/config/tokens.txt
```
*(Al igual que los proxies, se encuentra en `.gitignore`; ver `tokens.example.txt`).*

- **Lógica de Rotación**: Con cada página o bloque consultado, `getSequentialToken()` avanza al siguiente token disponible en memoria.
- **Fallback**: Si no existe `tokens.txt`, se utiliza el token principal configurado en las variables de entorno (`configByCountries`).
- **Ofuscación de Seguridad**: El logger nunca imprime el token completo. Solo muestra un fragmento intermedio truncado (ej. `...${token.substring(86, 130)}...`) para evitar fugas en logs de cPanel.

---

### 4.4 Política de Reintentos y Resiliencia

1. **Reintentos por Página**: Hasta **5 intentos** consecutivos (`maxRetries = 5`) antes de marcar una página como fallida.
2. **Proxy Aleatorio en Reintento**: Si un intento falla por timeout (30s) o desconexión del socket, el reintento inmediato selecciona un proxy aleatorio diferente del pool.
3. **Escalonamiento de Promesas Concurrente**: En `scraperRunner.js`, cuando se disparan ráfagas concurrentes de páginas (`pagesPerBatch = 3`), se aplica un retardo escalonado de 150 ms entre peticiones para evitar saturar el *Event Loop* local.

---

## 📊 5. Guardrails de Ingesta e Integridad de Datos

En plataformas mayoristas como **Dropi**, los cambios en el inventario no siempre corresponden a ventas de clientes finales. Los proveedores habitualmente:
- Retiran lotes completos de inventario para trasladarlos a otros almacenes o canales de venta físicos.
- Modifican manualmente el stock en su panel de administración para corregir descuadres de inventario.
- Pausan o desactivan publicaciones colocando el inventario en `0`.

Si el scraper considerase cualquier reducción de stock como una venta real, el catálogo se contaminaría con métricas falsas, posicionando productos retirados como "superventas". Para proteger la integridad del algoritmo **DropScore**, [`InventorySync`](../domain/InventorySync/) y [`salesSnapshotRunner.js`](snapshots/salesSnapshotRunner.js) aplican cuatro filtros matemáticos automáticos.

---

### 5.1 Guardrail 1: Agotamiento Masivo (*Stock Zeroing*)

- **Condición**: Un producto pasa de un inventario significativo ($\text{stock}_{\text{anterior}} \ge 30$) a casi cero ($\text{stock}_{\text{nuevo}} \le 2$) en una sola lectura.
- **Interpretación**: El proveedor pausó el producto o vació manualmente el inventario.
- **Acción del Sistema**:
  - Se actualiza la tabla `Stocks` al nuevo valor (`0` o `safeStock`).
  - **NO se registra ningún registro** en `ProductSales`.
  - Se emite una alerta en log: `[INVENTORY SYNC] Agotamiento masivo detectado... Nivelando stock sin registrar venta ficticia.`

---

### 5.2 Guardrail 2: Velocidad Máxima en Escaneos Regulares (*Batch Withdrawal*)

En una ejecución horaria normal, ningún producto orgánico vende cientos de unidades de golpe en Dropi sin una campaña publicitaria masiva previa.

- **Fórmula de Umbral**:
  $$\text{maxAllowedSales} = \max\left(75, \, \lceil \max(1, \text{hoursOffline}) \rceil \times 30\right)$$
- **Regla**: Si la cantidad reducida supera $\text{maxAllowedSales}$ (por ejemplo, una caída súbita de 600 unidades en 1 hora cuando el límite es 75):
  - Se clasifica como **retiro o ajuste de lote de proveedor**.
  - Se nivela el stock en la base de datos sin generar ventas espurias.

---

### 5.3 Guardrail 3: Redistribución Retroactiva tras Inactividad (`botState.js`)

Si el servidor experimentó un mantenimiento o el bot de scraping estuvo inactivo durante más de 25 horas:
- Si el stock de un producto bajó 120 unidades tras 3 días de corte, imputar las 120 ventas en el minuto que arrancó el bot distorsionaría por completo la serie temporal de ventas diarias.
- **Solución con `botState.js`**:
  1. El scraper lee `getLastRunFinishedAt()` del archivo de estado persistente `bot_state.json`.
  2. Calcula los días reales transcurridos: $\text{daysOffline} = \lfloor \text{hoursOffline} / 24 \rfloor$.
  3. Divide las ventas de forma uniforme entre los días transcurridos (`dailyQty = soldAmount / daysOffline`), aplicando un techo de seguridad de `MAX_DAILY_OFFLINE_SALES = 250` unidades por día.
  4. Inserta las ventas en `ProductSales` con la fecha retroactiva correspondiente a cada día.

---

### 5.4 Guardrail 4: Suavizado Estadístico en Snapshots (Winsorización de Tukey)

En la generación diaria de snapshots (`salesSnapshotRunner.js`), se procesan las ventas acumuladas de 1, 7 y 30 días para generar los *sparklines* que visualiza el frontend.

Para evitar que un día atípico o un pico aislado comprima visualmente la gráfica convirtiendo los demás días en una línea plana en el fondo, se aplica la función pura [`winsorizeDailySales()`](../functions/salesCalculations.js):

1. **Cálculo de Cuartiles**: Se obtienen el percentil 25 ($Q1$) y el percentil 75 ($Q3$) de la serie de ventas diarias.
2. **Rango Intercuartílico**: $IQR = Q3 - Q1$.
3. **Valla Superior de Tukey para Valores Extremos**:
   $$\text{upperFence} = \max\left(15, \, Q3 + (3 \times \max(1, IQR))\right)$$
4. **Condición de Activación y Topado**:
   - Para no truncar productos de bajo volumen o variaciones orgánicas pequeñas, el acotamiento solo se activa si el valor diario excede `minOutlierThreshold = 30` **y** supera $\text{upperFence}$.
   - Los días que cumplen esta condición son acotados a $\text{upperFence}$ exclusivamente para la serie gráfica (`dailySales`), preservando la suma total de ingresos y profit intacta.

---

## 🚨 6. Guía de Troubleshooting y Resolución de Incidentes

Cuando un worker se detenga o el catálogo no refleje ventas recientes, consulta esta matriz de diagnóstico rápido:

---

### 6.1 Matriz de Incidentes Frecuentes

| Síntoma Observado | Causa Raíz Probable | Solución Operativa |
| :--- | :--- | :--- |
| **El cron corre pero termina en 0 segundos** sin hacer nada. | Existe un candado (`bot.lock` o `sales_snapshot.lock`) que detecta ejecución solapada. | Verificar con `ps aux \| grep node` si hay un proceso real. Si no hay proceso corriendo, eliminar el candado manualmente con `rm -f bot.lock`. |
| **`HTTP 429 ThrottleRequests`** en bucle en el log de errores. | Dropi bloqueó temporalmente la API key o la IP de salida por exceder el rate limit. | 1. Añadir más tokens válidos en `tokens.txt` para activar el Round-Robin.<br>2. Comprobar que `proxies.txt` tenga proxies funcionales para rotar IPs. |
| **`HTTP 401 Unauthorized`** o payload con `isSuccess: false`. | Token de integración de Dropi revocado, expirado o mal configurado para el país en turno. | Generar un nuevo token en el panel de Dropi y actualizar `configByCountries` en `.env` o la lista en `tokens.txt`. Para Colombia, verificar que `userVerified: true` esté activo. |
| **Errores continuos `ETIMEDOUT` o `ECONNREFUSED`** en los reintentos. | Proxies de `proxies.txt` caídos, bloqueados por Cloudflare o con latencia superior a 30s. | Probar los proxies con `curl`. Purgar los caídos. Como contingencia rápida, vaciar `proxies.txt` para forzar la salida directa por la IP local del servidor. |
| **`SequelizeConnectionError: Too many connections`**. | Conexiones MySQL retenidas por procesos colgados o pool saturado en cPanel. | Matar procesos Node zombis con `kill -9 <PID>`. Verificar en `config/database.js` que el pool mantenga `max: 5, min: 0`. |

---

### 6.2 Comandos de Emergencia y Diagnóstico por SSH

#### 1. Inspeccionar Errores en Tiempo Real (cPanel)
```bash
# Ver las últimas 50 líneas del log de errores del scraper
tail -n 50 /home/<cpanel_user>/<api_domain>/scraperRunner-error.log

# Ver el log de errores de snapshots de medianoche
tail -n 50 /home/<cpanel_user>/<api_domain>/salesSnapshotRunner-error.log

# Monitorear la salida en vivo durante una ejecución manual
tail -f /home/<cpanel_user>/<api_domain>/scraperRunner-error.log
```

#### 2. Comprobar y Liberar Candados Bloqueados
```bash
# Ver si existe candado y cuándo fue creado
ls -la /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock

# Ver el contenido del candado (PID del proceso responsable)
cat /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock

# Comprobar si el proceso del PID sigue vivo en Linux
ps -p <PID_DEL_LOCK> -o pid,vsz,time,cmd

# Si no hay proceso real o está colgado, forzar liberación:
kill -9 <PID_DEL_LOCK> 2>/dev/null
rm -f /home/<cpanel_user>/<api_domain>/src/workers/scraper/bot.lock
```

#### 3. Probar la Salud de un Proxy
```bash
# Probar conexión HTTP a través de un proxy específico hacia la API de Dropi
curl -x http://usuario:password@host:port -I https://api.dropi.co
```
Si el comando arroja un código HTTP (ej. 200, 404 o 405) en menos de 3 segundos, el túnel proxy está activo. Si arroja `Connection timed out`, el proxy debe ser retirado de `proxies.txt`.

#### 4. Ejecución de Contingencia Forzada sin Proxies
Si tu proveedor de proxies tiene una caída masiva y necesitas que el bot sincronice el catálogo de inmediato:
```bash
# Renombrar temporalmente el archivo de proxies
mv /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt \
   /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt.bak

# Ejecutar el scraper usando la IP local
node /home/<cpanel_user>/<api_domain>/src/workers/scraper/scraperRunner.js

# Restaurar el archivo cuando el proveedor se recupere
mv /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt.bak \
   /home/<cpanel_user>/<api_domain>/src/adapters/dropiApi/config/proxies.txt
```
