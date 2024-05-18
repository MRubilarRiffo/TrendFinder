const { post } = require("axios");
const { config } = require("../config/config");
const { getCategoryFindAll } = require("../../handlers/category/getCategoryFindAll");
const { createSale } = require("../../handlers/Sale/createSale");
const { getStockFindAll } = require("../../handlers/stock/getStockFindAll");
const { logMessage } = require("../../helpers/logMessage");
const { validations } = require("../../helpers/validations");
const { getProductsFindAll } = require("../../handlers/product/getProductsFindAll");
const { createBulkProduct } = require("../../handlers/product/createBulkProduct");
const { createStock } = require("../../handlers/stock/createStock");

const DROPI_IMG_URLS3 = config.dropi_img_urls3;

const limit = 500; // MODIFICAR A 500

const body = {
    "privated_product": false,
    "bod": null,
    "stockmayor": null,
    "no_count": true,
    "order_by": "id",
    "order_type": "asc",
    "pageSize": limit,
    "startData": 0,
    "notNulldescription": false,
    "userVerified": false,
    "category": null,
    "warehouse_id": null,
    "keywords": null
};

const compareCategories = (cat1, cat2) => {
    const normalizarCadena = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    cat1 = normalizarCadena(cat1);
    cat2 = normalizarCadena(cat2);

    const palabrasClave = {
        "moda": ["bolsos", "ropa", "accesorios moda", "moda", "ropa deportiva", "bisuteria"],
        "salud y belleza": ["tobilleras", "salud y belleza", "corporal", "capilar", "belleza y cuidado personal", "cuidado personal", "belleza", "bienestar", "salud", "salud y bienestar", "cuidado personal y salud"],
        "hogar": ["hogar y accesorios", "aseo", "hogar", "cocina", "natural home", "electrodomestico", "electrodomesticos", "limpieza y aseo"],
        "deportes y fitness": ["deportes", "deporte", "fitness", "deportes y fitness"],
        "juguetes": ["jugueteria", "juguetes", "pinateria"],
        "automoviles": ["vehiculo", "vehiculos", "accesorios para vehiculos (carro, moto, bicicleta)"],
        "defensa personal": ["defensa personal"],
        "mascotas": ["mascotas"],
        "tecnologia": ["tecnologia", "vaporizadores", "gadgets", "electronica"],
        "otros": ["casual", "otro", "combo", "otra", "mad", "novedades"],
        "entretenimiento adulto": ["sex shop", "lubricantes", "cosmetologia erotica", "dildos", "vibradores", "aceites para masajes", "bienestar sexual"],
        "audio y video": ["audio y video"],
        "smartphones y celulares": ["smartphone y celulares"],
        "calzado": ["sandalias", "tenis", "calzado"],
        "ferreteria y cacharro": ["ferreteria y cacharro", "herramientas", "herramienta"],
        "ninos y bebes": ["bebe", "bebes y materno"],
        "camping y pesca": ["camping", "pesca"],
        "accesorios y joyeria": ["manillas", "cadenas", "accesorios"]
    };

    const palabras = palabrasClave[cat1];
    if (palabras) {
        for (const palabra of palabras) {
            if (cat2.includes(palabra)) {
                return true;
            };
        };
    };

    return false;
};

const convertirString = (inputString) => {
    const outputString = inputString.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return outputString;
};

const validator = (id, name, stock) => {
    const validationRules = {
        id: { required: true },
        name: { required: true },
        stock: { type: 'number', required: true, greaterThan: -1 }
    };
    
    const errors = validations({ id, name, stock }, validationRules );

    if (Object.keys(errors).length > 0) {
        const error = new Error(`Se encontraron errores de validación: id ${id ? id : 'null'}, name ${name ? name : 'null'}, stock ${stock ? stock : 'null'}.`);
        error.validationErrors = errors;
        throw error;
    };
};

const existingProductsFunctions = async (existingProducts) => {
    try {
        const existingProductIds = existingProducts.map(product => product.id);

        const queryOptionsStock = { attributes: ['id', 'ProductId', 'quantity'], where: { ProductId: existingProductIds } };
        const existingStock = await getStockFindAll(queryOptionsStock);
        
        const existingProductsPromises = existingProducts.map(async ({ id, stock }) => {
            stock = parseInt(stock)

            try {
                validator(id, true, stock);
            } catch (error) {
                logMessage(`Error al validar productos a crear: ${error.message}`);
                if (error.validationErrors) {
                    logMessage(JSON.stringify(error.validationErrors));
                };
                return null;
            };
            
            const stockInfo = existingStock.find(stockItem => stockItem.ProductId === id);

            if (stockInfo) {
                if (stockInfo.quantity > stock) {
                    const unitsSold = stockInfo.quantity - stock;
                    await createSale(id, unitsSold);
                };
                if (stockInfo.quantity !== stock) {
                    await stockInfo.update({ quantity: stock });
                };
            };
        });

        await Promise.all(existingProductsPromises);
    } catch (error) {
        throw error;
    };
};

const nonexistentProductsFunctions = async (nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country) => {
    let nonexistentProductsCreating = nonexistentProducts.map(({ id, name, stock, gallery, categories, description, sale_price }) => {
        stock = parseInt(stock);

        try {
            validator(id, name, stock);
        } catch (error) {
            logMessage(`Error al validar productos a crear: ${error.message}`);
            if (error.validationErrors) {
                logMessage(JSON.stringify(error.validationErrors));
            };
            return null;
        };

        let images = [];
        if (gallery && gallery.length > 0) {
            gallery.forEach(item => {
                if (item.urlS3) {
                    images.push(`${DROPI_IMG_URLS3}${item.urlS3}`);
                } else if (item.url) {
                    images.push(`${DROPI_IMG_URL}${item.url}`);
                };
            });
        };

        const image = images.join(',');
        const url = `${DROPI_DETAILS_PRODUCTS}${id}/${convertirString(name)}`;

        return { id, name, stock, image, categories, description, sale_price, url, country };
    });

    nonexistentProductsCreating = nonexistentProductsCreating.filter(item => item);

    try {
        const createNonexistentProducts = await createBulkProduct(nonexistentProductsCreating);

        let categoriesArray = await getCategoryFindAll();

        const idsAndStocks = createNonexistentProducts.map(async product => {
            const correspondingProduct = nonexistentProductsCreating.find(item => item.id == product.dropiId);

            let findCategory = correspondingProduct.categories.map(category => {
                let categoryInstance = categoriesArray.find(({ name }) => compareCategories(name, category.name));
                if (!categoryInstance) {
                    categoryInstance = categoriesArray.find(({ name }) => name == 'Otros');
                };
                return categoryInstance;
            });

            findCategory = await Promise.all(findCategory);

            let setFindCategory = [...new Set(findCategory)];
            setFindCategory = setFindCategory.filter(item => item);

            await Promise.all([
                product.addCategory(setFindCategory),
                createStock(product.id, correspondingProduct.stock)
            ]);

            return true;
        });

        await Promise.all(idsAndStocks);
    } catch (error) {
        throw error;
    };
};

const scraper = async (env, headers, pagesPerBatch = 3) => {
    const API = env.dropi_api_products;
    const DROPI_IMG_URL = env.dropi_img_url;
    const DROPI_DETAILS_PRODUCTS = env.dropi_details_products;

    let currentPage = 1;
    let hasMoreResults = true;

    while (hasMoreResults) {
        const batchRequests = [];
        
        for (let i = 0; i < pagesPerBatch; i++) {
            const page = currentPage + i;
            const offset = (page - 1) * limit;
            body.startData = offset;

            const requestPromise = (async () => {
                try {
                    const response = await post(API, body, { headers });
                    const { objects } = response.data;
        
                    if (objects.length === 0) {
                        logMessage(`No se encontraron más productos en la página ${page}`);
                        hasMoreResults = false;
                        return;
                    };
        
                    const idsArray = objects.map(({ id }) => id);

                    const queryOptionsProducts = { attributes: ['id', 'dropiId'], where: { dropiId: idsArray, country: env.country } };
                    const productArray = await getProductsFindAll(queryOptionsProducts);

                    const productIds = productArray.map(product => product.dropiId);

                    const nonexistentProducts = objects.filter(obj => !productIds.includes(obj.id));
                    const existingProducts = productArray.filter(obj => objects.map(({ id }) => id).includes(obj.dropiId));

                    const existingProductsWithStock = existingProducts.map(obj => {
                        const objectWithStock = objects.find(({ id }) => id === obj.dropiId);
                        return {
                            id: obj.id,
                            stock: objectWithStock.stock
                        };
                    });

                    let functionArray = [];
                    if (existingProducts && existingProducts.length > 0) {
                        functionArray.push(existingProductsFunctions(existingProductsWithStock));
                    };
                    if (nonexistentProducts && nonexistentProducts.length > 0) {
                        functionArray.push(nonexistentProductsFunctions(nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, env.country));
                    };

                    await Promise.all(functionArray);
        
                    logMessage(`Página ${page}: ${limit * page} productos en total analizados (${env.country})`);
                } catch (error) {
                    logMessage(`Error al scrapear productos de la página ${page}: ${error.message}`);
                    if (error.validationErrors) {
                        logMessage(JSON.stringify(error.validationErrors));
                    }
                }
            })();
            
            batchRequests.push(requestPromise);
        };

        await Promise.all(batchRequests);

        currentPage += pagesPerBatch;
    };
};

const scraperConfig = async () => {
    logMessage('Scraper iniciado');

    const configByCountries = config.dropi_country;

    let headers = {
        "dropi-integration-key": "token",
        "Content-Type": "application/json;charset=UTF-8"
    };

    const productPromises = configByCountries.map(async config => {
        const clonedHeaders = { ...headers };
        clonedHeaders["dropi-integration-key"] = config.dropi_token;
        await scraper(config, clonedHeaders);
    });

    await Promise.all(productPromises);
    logMessage('Scraper terminado');
};

module.exports = { scraperConfig };