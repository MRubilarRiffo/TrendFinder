# Análisis del Cron de Ventas (TrendFinder/cron)

He analizado el código del proceso cronjob enfocado en calcular el snapshot de ventas (`/cron/salesSnapshot.js`).

## 1. ¿Apaga los procesos una vez que se ejecuta? ¿Deja procesos "fantasma"?
**No deja procesos "fantasma" y se apaga perfectamente.**
Al igual que tu bot de sincronización, el cronjob de ventas cuenta con un excelente manejo del ciclo de vida del proceso en la función `runCron()`:
- Ante un éxito rotundo: llama a `process.exit(0)`.
- Ante un error no manejado (`catch`): llama a `process.exit(1)`.

Estas instrucciones obligan al entorno de Node.js a **destruir** el hilo de ejecución por completo apenas termina de ejecutarse la iteración, liberando el 100% de la memoria, conexiones de red (event loop) y puertos a la base de datos mysql. No generará acumulaciones (leaks) en el servidor cPanel.

## 2. Nivel de Optimización y Rendimiento
El script `salesSnapshot.js` está **muy bien optimizado** comparado con el bot de scraping. A nivel técnico, destaco:

> **Excelente uso de Memoria RAM (`raw: true`)**
> A diferencia de consultas típicas que devuelven todo un "Mega-Objeto" Sequelize por cada intento de venta, tu query principal (línea 61) utiliza `raw: true` y `nest: true`. Esto hace que Sequelize devuelva los datos puros en formato JSON en lugar de instanciar la clase completa por cada fila. Esto ahorra un inmenso espacio de RAM si tu tabla `ProductSale` llega a crecer.

> **Uso Correcto de Inserciones Masivas (`bulkCreate`)**
> A diferencia del bot de scraping donde hallamos el problema N+1, en este cronjob **sí** utilizas `SalesSnapshot.bulkCreate(snapshots)` (línea 97). Esto significa que no importa si tienes 5 o 5,000 snapshots calculados: se guardarán todos en un solo *viaje* (query) a la base de datos, lo cual es increíblemente rápido.

> **Consultas Delegadas a la Base de Datos (SQL SUM / CASE)**
> Todo el cómputo matemático pesado (sumar ventas, calcular márgenes con campos relacionales de otras tablas y hacer sumatorias condicionales de fechas) ocurre del lado del motor SQL a través de `sequelize.fn` y `sequelize.literal` (líneas 44-48). El servidor Node.js solo se encarga de recibir los totales e insertarlos en la tabla Snapshot.

### Únicos puntos a considerar (Advertencias menores):
1. **Índice en `saleDate`:** Las 3 iteraciones del script (1, 7 y 30 días) hacen consultas filtrando por grandes bloques de la columna `saleDate` en la tabla `ProductSale` (`where: { saleDate: ... }`). Si la tabla de ventas crece demasiado (ej. superando las 100,000/500,000 filas), estas consultas empezarán a volverse lentas *solo si* la columna `saleDate` no tiene un **Índice (INDEX)** en tu base de datos MariaDB/MySQL. 
2. **Eliminación Total por Período:** En la línea 66, eliminas todos los snapshots del período antes de volver a insertarlos. Si por algún motivo el script falla o la conexión a la bd se cae *justo después* del `.destroy()` pero *antes* del `bulkCreate()`, la plataforma se quedará sin las métricas de ese día hasta que el cron vuelva a correr.

**Conclusión:**
Este cronjob en particular es muy sólido, rápido y eficiente. Su consumo en cPanel debería ser casi imperceptible y no comprometerá la estabilidad del servidor.
