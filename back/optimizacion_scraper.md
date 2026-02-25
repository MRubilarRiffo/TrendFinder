# Informe de Optimización del Scraper (Dropi)

## Análisis del Cuello de Botella Actual

Actualmente, el bot de scraping en `src/services/scraper/scraperOrchestrator.js` procesa las páginas por cada país de manera **secuencial** dentro del `while (hasMoreResults)` a través de un bucle `for` tradicional:

```javascript
for (let i = 0; i < pagesPerBatch; i++) {
    // 1. Espera forzada (Delay)
    await new Promise(resolve => setTimeout(resolve, 500));
    // 2. Espera a que la Red responda (I/O HTTP Blocking)
    const apiResponse = await fetchDropiProductsPage(...);
    // 3. Procesa Datos
    // 4. Espera a que la BD responda (I/O DB)
    await Promise.all(promisesArray);
}
```

**Problema:** Aunque procesas por lotes (`pagesPerBatch = 3`), tu bucle bloquea el hilo hasta que termina la Página 1, inserta la Página 1 en la Base de Datos, y recién ahí empieza a solicitar la Página 2 a Dropi. Con miles de páginas, ese "tiempo muerto" esperando respuestas del servidor de Dropi (Red) y de tu base de datos suma muchísimos minutos u horas.

Antes, esto era **obligatorio** porque Dropi tiene Rate Limits (WAF). Si hacías muchas peticiones juntas desde 1 sola IP, te baneaban con Error `429 Too Many Requests` o `401 Unauthorized`. 

**La Solución:** Gracias a la nueva implementación del `rotationManager.js` (HttpsProxyAgent), cada llamado a `fetchDropiProductsPage` ahora asigna un Proxy aleatorio. Esto significa que **Dropi detectará 5 IPs distintas haciendo 1 petición temporal, en lugar de detectar 1 IP haciendo 5 peticiones de golpe**.

---

## Propuesta Arquitectónica: Concurrencia por Lotes (Promise.all)

Con proxies activos, podemos destruir ese bucle secuencial y disparar las peticiones de red simultáneamente en "ráfagas" concurrentes.

### Cómo lo haríamos
Refactorizar la función `runScraperByCountry` para mapear las páginas en Promesas y esperarlas todas juntas (Asincronía total):

```javascript
// En lugar de un for(){} secuencial, construimos un lote de promesas:
const pagePromises = Array.from({ length: pagesPerBatch }).map(async (_, i) => {
    const page = currentPage + i;
    const offset = (page - 1) * LIMIT_PER_PAGE;
    const requestBody = { ...body, startData: offset };

    // Cada Promesa intentará llamar a la API independiente de las otras
    // DropiApiService elegirá internamente un Proxy Aleatorio distinto
    const apiResponse = await fetchDropiProductsPage(API, headers, requestBody, country);
    
    // Si la promesa devuelve datos, armamos los bloques (existing/nonexisting)
    // Devolvemos esos bloques al hilo principal sin insertar en BD todavía.
    return { page, apiResponse }; 
});

// DISPARO CONCURRENTE: Aquí la velocidad aumenta enormemente. 
// Disparamos P1, P2 y P3 al MISMO TIEMPO hacia Dropi.
const batchResults = await Promise.all(pagePromises);

// Después, recolectamos los resultados y los empujamos a BD simultáneamente.
```

## Beneficios e Impacto

1. **Escalabilidad de Velocidad ($\times N$):** Si configuras `pagesPerBatch = 5`, las peticiones a la API tardarán lo mismo que 1 sola petición, cortando el tiempo de Red al `~20%`. 
2. **Eficiencia de Proxies:** Al dispararse al mismo tiempo, el módulo de proxies repartirá dinámicamente la carga de conexiones sin "bombardear" una misma IP secuencialmente a través del tiempo.
3. **Optimización de BD:** El `BulkCreate` de la API asíncrona te permite agrupar todas las páginas resultantes de esa ráfaga y mandárselas a MySQL/Postgres en 1 sola transacción inmensa en lugar de transacciones chiquitas repetidas.

## Medidas de Mitigación Cautelares

- **Límites Seguros de Proxies:** No deberías establecer el `pagesPerBatch` (ráfaga) en un número mayor a la cantidad de proxies que tengas vivos en memoria (actualmente dice 10 en log). Recomendaría `pagesPerBatch = 5` o `10` máximo, para que si un proxy aleatorio se repite en el mismo lote, tenga una probabilidad muy baja.
- **Evitar Race Conditions en DB:** Asegurarnos que `processExistingProductsBatch.js` siga haciendo validaciones de existencia.
- **Timeouts:** Pude ver que ya configurastes los timeouts (`30s`), lo cual es indispensable para que una IP mala de la lista de proxies no atasque `Promise.all`.

¿Quieres que rediseñe la función `runScraperByCountry` en `scraperOrchestrator.js` aplicando exactamente este motor de concurrencia para que el bot empiece a volar bajo este patrón?
