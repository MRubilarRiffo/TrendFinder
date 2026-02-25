const { config } = require('../../config/config');
const { getProductsFindAll } = require('../../handlers/product/getProductsFindAll');
const { logMessage } = require('../../helpers/logMessage');

// Services & Handlers
const { fetchDropiProductsPage } = require('./dropiApiService');
const { processExistingProductsBatch } = require('../../handlers/scraper/processExistingProductsBatch');
const { processNonexistentProductsBatch } = require('../../handlers/scraper/processNonexistentProductsBatch');

// Utils Locals
const { updateImages, updateStores, convertirString } = require('../../helpers/scraper/dropiUtils');

const LIMIT_PER_PAGE = 40;

/**
 * Loop principal del Scraper para el país en turno (Optimizacion V3 - Concurrente)
 */
const runScraperByCountry = async (countryConfig, headers, body, pagesPerBatch = 6) => {
    const API = countryConfig.dropi_api_products;
    const DROPI_IMG_URL = countryConfig.dropi_img_url;
    const DROPI_DETAILS_PRODUCTS = countryConfig.dropi_details_products;
    const country = countryConfig.country;

    let currentPage = 1;
    let hasMoreResults = true;

    while (hasMoreResults) {
        logMessage(`[ORQUESTADOR V3] Disparando ráfaga concurrente de ${pagesPerBatch} páginas para ${country} (Páginas ${currentPage} a ${currentPage + pagesPerBatch - 1})`);

        // Array de Promesas HTTP disparadas todas al mismo tiempo
        const pagePromises = Array.from({ length: pagesPerBatch }).map(async (_, i) => {
            const page = currentPage + i;
            const offset = (page - 1) * LIMIT_PER_PAGE;
            const requestBody = { ...body, startData: offset };

            // Pequeño escalonamiento de milisegundos para no aturar el thread local de JS
            await new Promise(resolve => setTimeout(resolve, i * 150));

            const apiResponse = await fetchDropiProductsPage(API, headers, requestBody, country);
            return { page, apiResponse };
        });

        // Resolvemos el Bloque HTTP completo (Tarda el tiempo de la red más lenta, no la suma de todas)
        const batchResults = await Promise.all(pagePromises);

        let processDbPromises = [];

        // Ahora iteramos sobre los resultados y armamos un gran "bulto" para la base de datos
        let dbTotalObjects = [];

        for (const result of batchResults) {
            const { page, apiResponse } = result;

            if (!apiResponse.success || apiResponse.data.length === 0) {
                hasMoreResults = false;
                continue; // Si una pág falla o está vacía (final doc), la ignoramos
            }

            if (page === 1 && apiResponse.count) {
                const totalEstimatedPages = Math.ceil(apiResponse.count / LIMIT_PER_PAGE);
                logMessage(`[CATÁLOGO DROPI] La API declara un total de ${apiResponse.count} productos a nivel tienda. Se iterarán aproximadamente ${totalEstimatedPages} páginas en bloques de ${LIMIT_PER_PAGE}.`);
            }

            let objects = apiResponse.data;

            // Inspect Dropi Payload fields solo en pág 1
            if (page === 1 && objects[0]) {
                logMessage(`[PAYLOAD INSPECTOR] Valores relevantes de Dropi V2: price=${objects[0].sale_price} / suggested=${objects[0].suggested_price} / stock=${objects[0].stock}`);
            }

            // Filtrado base super permisivo
            const originalLength = objects.length;
            objects = objects.filter((product) =>
                product.id !== null && product.id !== undefined && product.name
            );

            logMessage(`Página ${page}: ${originalLength} productos recibidos por la API (${country}).`);

            // Agrupamos este bloque limpiado de "Dropi" en un solo super saco
            if (objects.length > 0) {
                dbTotalObjects.push(...objects);
            }
        }

        // --- MANEJO BATCH DATABASE ---
        if (dbTotalObjects.length > 0) {
            logMessage(`[DB INSERCIÓN ASÍNCRONA] Evaluando macro-bloque de ${dbTotalObjects.length} productos en BD para el país ${country}...`);
            const idsArray = dbTotalObjects.map(({ id }) => id);

            // Requerimos desde BD TODOS los Ids de la ráfaga de un tiro
            const queryOptionsProducts = { attributes: ['id', 'dropiId', 'productUpdateDate'], where: { dropiId: idsArray, country: country } };
            const productArray = await getProductsFindAll(queryOptionsProducts);
            const productIds = productArray.map(product => product.dropiId);

            // Separación Bifurcada en macro 
            const nonexistentProducts = dbTotalObjects.filter(obj => !productIds.includes(obj.id));
            const existingProducts = productArray.filter(obj => idsArray.includes(obj.dropiId));

            // Mapeo super-batch
            const existingProductsWithStock = existingProducts.map(obj => {
                const objectWithStock = dbTotalObjects.find(({ id }) => id === obj.dropiId);

                let previousNow = objectWithStock.updated_at;
                const previousUpdate = obj.productUpdateDate;

                // Extraemos Stock Real de Warehouses y Variaciones (Dropi V2 API Fix)
                let updatedStock = 0;

                // 1. Stock Base (si existe)
                if (objectWithStock.stock !== null && objectWithStock.stock !== undefined && !isNaN(parseInt(objectWithStock.stock))) {
                    updatedStock += parseInt(objectWithStock.stock);
                }

                // 2. Stock de Bodegas (warehouse_product general)
                if (Array.isArray(objectWithStock.warehouse_product) && objectWithStock.warehouse_product.length > 0) {
                    updatedStock = objectWithStock.warehouse_product.reduce((acc, curr) => {
                        const whStock = curr.stock;
                        return acc + (whStock !== null && whStock !== undefined && !isNaN(parseInt(whStock)) ? parseInt(whStock) : 0);
                    }, updatedStock); // Sumamos sobre el stock base
                }

                // 3. Stock de Variaciones (Si es producto variable)
                if (Array.isArray(objectWithStock.variations) && objectWithStock.variations.length > 0) {
                    let totalVariationsStock = 0;
                    objectWithStock.variations.forEach(variation => {
                        // Stock directo de la variación
                        if (variation.stock !== null && variation.stock !== undefined && !isNaN(parseInt(variation.stock))) {
                            totalVariationsStock += parseInt(variation.stock);
                        } else if (Array.isArray(variation.warehouse_product_variation) && variation.warehouse_product_variation.length > 0) {
                            // Si no hay stock directo, sumamos el de las bodegas de la variación
                            variation.warehouse_product_variation.forEach(ware => {
                                if (ware.stock !== null && ware.stock !== undefined && !isNaN(parseInt(ware.stock))) {
                                    totalVariationsStock += parseInt(ware.stock);
                                }
                            });
                        }
                    });

                    // Solo sumamos el stock de variaciones si existe, para no duplicar si Dropi ya lo reporta en el stock general
                    // En Dropi V2 a veces el stock general ya incluye las variaciones, y a veces está en cero.
                    // Si el stock general es menor al de las variaciones o cero, prevalece el de variaciones (Lógica del Plugin de WP)
                    if (updatedStock < totalVariationsStock || updatedStock === 0) {
                        updatedStock = totalVariationsStock;
                    }
                }

                let updateProduct = {};
                let hasImportantChanges = false;

                // Si en Dropi se editó más recientemente que mi guardado en BD, actualizo
                if (!previousUpdate || (previousNow && previousNow > previousUpdate)) {
                    hasImportantChanges = true;
                    const image = updateImages(objectWithStock.gallery, DROPI_IMG_URL, config.dropi_img_urls3);
                    const stores = updateStores(objectWithStock.warehouse_product);

                    updateProduct = {
                        name: objectWithStock.name,
                        description: objectWithStock.description,
                        sale_price: objectWithStock.sale_price !== null && objectWithStock.sale_price !== undefined ? parseFloat(objectWithStock.sale_price) : 0,
                        suggested_price: objectWithStock.suggested_price !== null && objectWithStock.suggested_price !== undefined ? parseFloat(objectWithStock.suggested_price) : 0,
                        url: `${DROPI_DETAILS_PRODUCTS}${objectWithStock.id}/${convertirString(objectWithStock.name)}`,
                        productUpdateDate: previousNow || objectWithStock.created_at,
                        image,
                        stores
                    };
                }

                return {
                    id: obj.id,
                    stock: updatedStock,
                    updateProduct,
                    obj,
                    metadataChanged: hasImportantChanges
                };
            }).filter(item => item !== null);

            logMessage(`[MACRO-ROUTING DB] Listos: ${nonexistentProducts?.length} MÁS NUEVOS y ${existingProductsWithStock?.length} EXISTENTES a insertar/actualizar.`);

            if (existingProducts && existingProducts.length > 0) {
                processDbPromises.push(processExistingProductsBatch(existingProductsWithStock));
            }
            if (nonexistentProducts && nonexistentProducts.length > 0) {
                processDbPromises.push(processNonexistentProductsBatch(nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country));
            }

            try {
                await Promise.all(processDbPromises);
            } catch (bdError) {
                logMessage(`[CRÍTICO BD] Fallo al insertar macro-lote en BD para ${country}: ${bdError.message || bdError}`);
                console.error("Detalle Error BD:", bdError);
            }
        }

        // Si la ráfaga anterior trajo resultados vacíos, el if (!apiResponse.success)
        // arriba cambiará hasMoreResults = false, matando este loop global y pasando de país
        currentPage += pagesPerBatch;
    }
};

/**
 * Función Principal de Configuración disparada desde el Controller.
 */
const scraperConfig = async () => {
    logMessage('------ Scraper V2 Iniciado (Arquitectura Orquestador) ------');

    const configByCountries = config.dropi_country;

    let baseBody = {
        'startData': 0,
        'pageSize': LIMIT_PER_PAGE,
        'order_type': 'DESC',
        'order_by': 'created_at',
        'keywords': '',
        'active': true,
        'no_count': false,
        'integration': true,
        'stockmayor': 1
    };

    let baseHeaders = {
        'dropi-integration-key': 'token',
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': 'PostmanRuntime/7.36.0',
        'Accept': '*/*, application/json',
        'Host': 'api.dropi.cl',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    };

    const productPromises = configByCountries.map(async countryConfig => {
        const clonedHeaders = { ...baseHeaders, 'dropi-integration-key': countryConfig.dropi_token };
        const clonedBody = { ...baseBody };

        // Excepción documentada: Colombia exige 'userVerified' (Se sacaba de scraper.js V1)
        if (countryConfig.country === 'Colombia') {
            clonedBody['userVerified'] = true;
        }

        await runScraperByCountry(countryConfig, clonedHeaders, clonedBody);
    });

    await Promise.all(productPromises);
    logMessage('------ Scraper V2 Terminado con Éxito ------');
};

module.exports = { scraperConfig };
