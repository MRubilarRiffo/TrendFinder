const { config } = require('../../config/config');
const { getProductsFindAll } = require('../../handlers/product/getProductsFindAll');
const { logMessage } = require('../../helpers/logMessage');

// Services & Handlers
const { fetchDropiProductsPage } = require('./dropiApiService');
const { processExistingProductsBatch } = require('../../handlers/scraper/processExistingProductsBatch');
const { processNonexistentProductsBatch } = require('../../handlers/scraper/processNonexistentProductsBatch');

// Utils Locals
const { updateImages, updateStores, convertirString } = require('../../helpers/scraper/dropiUtils');

const LIMIT_PER_PAGE = 100;

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

            // Proceso Batching Sincronizado
            const apiResponse = await fetchDropiProductsPage(API, headers, requestBody, country);

            if (!apiResponse.success || apiResponse.data.length === 0) {
                hasMoreResults = false;
                break; // Rompemos el ciclo for
            }

            let objects = apiResponse.data;

            // Filtrado base de productos indeseables o rotos
            objects = objects.filter(({ stock, name, sale_price, suggested_price }) =>
                stock && stock >= 0 && name && sale_price > 0 && suggested_price > 0
            );

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

                let updateProduct = {};

                // Si en Dropi se editó más recientemente que mi guardado en BD, actualizo data
                if (!previousUpdate || (previousNow && previousNow > previousUpdate)) {
                    const image = updateImages(objectWithStock.gallery, DROPI_IMG_URL, config.dropi_img_urls3);
                    const stores = updateStores(objectWithStock.warehouses);

                    updateProduct = {
                        name: objectWithStock.name,
                        description: objectWithStock.description,
                        sale_price: objectWithStock.sale_price,
                        suggested_price: objectWithStock.suggested_price,
                        url: `${DROPI_DETAILS_PRODUCTS}${objectWithStock.id}/${convertirString(objectWithStock.name)}`,
                        productUpdateDate: previousNow || objectWithStock.created_at,
                        image,
                        stores
                    };
                }

                return {
                    id: obj.id, // ID interno BD (Autoincremental de Postgres)
                    stock: objectWithStock.stock, // Stock en BD Distante
                    updateProduct, // Data a meter
                    obj // Model Instance para que el Handler llame `.update()`
                };
            });

            let promisesArray = [];
            if (existingProducts && existingProducts.length > 0) {
                promisesArray.push(processExistingProductsBatch(existingProductsWithStock));
            }
            if (nonexistentProducts && nonexistentProducts.length > 0) {
                promisesArray.push(processNonexistentProductsBatch(nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country));
            }

            if (promisesArray.length > 0) {
                await Promise.all(promisesArray);
            }

            logMessage(`Página ${page}: ${LIMIT_PER_PAGE * page} productos en total analizados (${country})`);
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
        'order_by': 'id',
        'keywords': '',
        'active': true,
        'no_count': true,
        'integration': true
    };

    let baseHeaders = {
        'dropi-integration-key': 'token',
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': 'PostmanRuntime/7.36.0',
        'Accept': '*/*',
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
