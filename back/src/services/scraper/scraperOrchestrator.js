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
 * Loop principal del Scraper para el país en turno.
 */
const runScraperByCountry = async (countryConfig, headers, body, pagesPerBatch = 3) => {
    const API = countryConfig.dropi_api_products;
    const DROPI_IMG_URL = countryConfig.dropi_img_url;
    const DROPI_DETAILS_PRODUCTS = countryConfig.dropi_details_products;
    const country = countryConfig.country;

    let currentPage = 1;
    let hasMoreResults = true;

    while (hasMoreResults) {
        const batchRequests = [];

        for (let i = 0; i < pagesPerBatch; i++) {
            const page = currentPage + i;
            const offset = (page - 1) * LIMIT_PER_PAGE;
            // Clonamos el body para no alterar el original en el ciclo asíncrono cruzado
            const requestBody = { ...body, startData: offset };

            // Delay Anti-RateLimit (Dropi WAF - 429 Too Many Attempts)
            // Esperamos 3.5 segundos entre cada lote para respetar el límite de 20 pet/min
            await new Promise(resolve => setTimeout(resolve, 500));

            // Proceso Batching Sincronizado
            const apiResponse = await fetchDropiProductsPage(API, headers, requestBody, country);

            if (!apiResponse.success || apiResponse.data.length === 0) {
                hasMoreResults = false;
                break; // Rompemos el ciclo for
            }

            if (page === 1 && apiResponse.count) {
                const totalEstimatedPages = Math.ceil(apiResponse.count / LIMIT_PER_PAGE);
                logMessage(`[CATÁLOGO DROPI] La API declara un total de ${apiResponse.count} productos a nivel tienda. Se iterarán aproximadamente ${totalEstimatedPages} páginas en bloques de ${LIMIT_PER_PAGE}.`);
            }

            let objects = apiResponse.data;

            // Inspect Dropi Payload fields
            if (page === 1) {
                logMessage(`[PAYLOAD INSPECTOR] Las llaves son: ${Object.keys(objects[0]).join(', ')}`);
                logMessage(`[PAYLOAD INSPECTOR] Valores relevantes de Dropi V2: price=${objects[0].sale_price} / suggested=${objects[0].suggested_price} / stock=${objects[0].stock}`);
            }

            // Filtrado base super permisivo (Solo descarta productos completamente vacíos o borrados)
            const originalLength = objects.length;
            objects = objects.filter((product) =>
                product.id !== null && product.id !== undefined && product.name
            );

            if (originalLength !== objects.length) {
                logMessage(`[ORCHESTRATOR] Filtro descartó ${originalLength - objects.length} productos con data corrupta (ej. sin nombre, sin precio).`);
            }

            if (objects.length === 0) {
                logMessage(`[ORCHESTRATOR ALERT] Absolutamente todos los ${originalLength} productos en esta página fueron rechazados por el Filtro!`);
            }

            const idsArray = objects.map(({ id }) => id);

            // Requerimos desde BD solo los Ids de Dropi mapeados para ver si existen localmente
            const queryOptionsProducts = { attributes: ['id', 'dropiId', 'productUpdateDate'], where: { dropiId: idsArray, country: country } };
            const productArray = await getProductsFindAll(queryOptionsProducts);

            const productIds = productArray.map(product => product.dropiId);

            // Separación Bifurcada
            const nonexistentProducts = objects.filter(obj => !productIds.includes(obj.id));
            const existingProducts = productArray.filter(obj => idsArray.includes(obj.dropiId));

            // Mapeo detallado de los productos Existentes que podrían requerir Update local 
            const existingProductsWithStock = existingProducts.map(obj => {
                const objectWithStock = objects.find(({ id }) => id === obj.dropiId);

                let previousNow = objectWithStock.updated_at;
                const previousUpdate = obj.productUpdateDate;

                // Extraemos Stock Real de Warehouses sumados
                let updatedStock = 0;
                if (Array.isArray(objectWithStock.warehouse_product) && objectWithStock.warehouse_product.length > 0) {
                    updatedStock = objectWithStock.warehouse_product.reduce((acc, curr) => {
                        const whStock = curr.stock;
                        return acc + (whStock !== null && whStock !== undefined && !isNaN(parseInt(whStock)) ? parseInt(whStock) : 0);
                    }, 0);
                } else if (objectWithStock.stock !== null && objectWithStock.stock !== undefined && !isNaN(parseInt(objectWithStock.stock))) {
                    updatedStock = parseInt(objectWithStock.stock);
                }

                let updateProduct = {};
                let hasImportantChanges = false;

                // Si en Dropi se editó más recientemente que mi guardado en BD, actualizo metadata pesada
                if (!previousUpdate || (previousNow && previousNow > previousUpdate)) {
                    hasImportantChanges = true; // Forzamos actualización por timestamp
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

                // Return estructurado para el Handler. Notar que updateProduct va vacío si la metadata no cambió
                return {
                    id: obj.id, // ID interno BD
                    stock: updatedStock, // Enviamos el nuevo stock calculado al Handler para el Historial/Inventario
                    updateProduct, // Data si hasImportantChanges es true
                    obj, // Model Instance BD
                    metadataChanged: hasImportantChanges
                };
            }).filter(item => item !== null);

            let promisesArray = [];

            logMessage(`[ROUTING] Página ${page}: Separados ${nonexistentProducts?.length} como MÁS NUEVOS y ${existingProductsWithStock?.length} como EXISTENTES.`);

            if (existingProducts && existingProducts.length > 0) {
                promisesArray.push(processExistingProductsBatch(existingProductsWithStock));
            }
            if (nonexistentProducts && nonexistentProducts.length > 0) {
                promisesArray.push(processNonexistentProductsBatch(nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country));
            }

            if (promisesArray.length > 0) {
                try {
                    await Promise.all(promisesArray);
                } catch (bdError) {
                    logMessage(`[CRÍTICO BD] Fallo al insertar lotes en BD para ${country}: ${bdError.message || bdError}`);
                    console.error("Detalle Error BD:", bdError);
                }
            }

            logMessage(`Página ${page}: ${originalLength} productos en total devueltos por la API (${country})`);
        }

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
        'integration': true
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
