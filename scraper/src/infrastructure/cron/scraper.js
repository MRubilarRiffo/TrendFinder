const axios = require("axios");
const { config } = require("../config/config");
const { getCategoryFindAll } = require("../../handlers/category/getCategoryFindAll");
const { createCategory } = require("../../handlers/category/createCategory");
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

function compararStrings(str1, str2) {
    const eliminarPlural = (str) => {
        if (str.endsWith("s")) {
            return str.slice(0, -1); // Eliminar la 's' final
        };
        return str;
    };

    const normalizarCadena = (str) => eliminarPlural(str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    return normalizarCadena(str1) === normalizarCadena(str2);
};

const convertirString = (inputString) => {
    const outputString = inputString.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return outputString;
};

const validator = (id, name, stock) => {
    const validationRules = {
        id: { required: true },
        name: { required: true },
        stock: { required: true }
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
            validator(id, true, stock);
    
            const stockInfo = existingStock.find(stockItem => stockItem.ProductId === id);
            if (stockInfo && stockInfo.quantity > stock) {
                const unitsSold = stockInfo.quantity - stock;
                await createSale(id, unitsSold);
                stockInfo.quantity = stock;
                await stockInfo.save();
            };
        });

        await Promise.all(existingProductsPromises);
    } catch (error) {
        throw error;
    };
};

const nonexistentProductsFunctions = async (nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country) => {
    let nonexistentProductsCreating = nonexistentProducts.map(({ id, name, stock, gallery, categories, description, sale_price }) => {
        try {
            validator(id, name, stock);
        } catch (error) {
            logMessage(`Error al scrapear productos: ${error.message}`);
            if (error.validationErrors) {
                logMessage(JSON.stringify(error.validationErrors));
            };
            return null;
        };
        
        let images = [];

        if (gallery && gallery.length > 0) {
            gallery.forEach(item => {
                if (item.url) {
                    images.push(`${DROPI_IMG_URL}${item.url}`);
                };
                if (item.urlS3) {
                    images.push(`${DROPI_IMG_URLS3}${item.urlS3}`);
                };
            });
        };
        
        const image = images.join(',');
        const url = `${DROPI_DETAILS_PRODUCTS}${id}/${convertirString(name)}`;

        return { id, name, stock, image, categories, description, sale_price, url, country };
    });

    nonexistentProductsCreating = await Promise.all(nonexistentProductsCreating);
    nonexistentProductsCreating = nonexistentProductsCreating.filter(item => item);

    try {

        const createNonexistentProducts = await createBulkProduct(nonexistentProductsCreating);
        let categoriesArray = await getCategoryFindAll();

        const idsAndStocks = createNonexistentProducts.map(async product => {
            const correspondingProduct = nonexistentProductsCreating.find(item => item.id == product.dropiId);

            const creatingCategory = correspondingProduct.categories.map(async category => {
                let categoryInstance = categoriesArray.find(({ name }) => compararStrings(name, category.name));
                if (!categoryInstance) {
                    categoryInstance = await createCategory(category.name);
                    categoriesArray.push(categoryInstance);
                } else {
                    await product.addCategory(categoryInstance);
                };
                return true;
            });
            await Promise.all(creatingCategory);

            await createStock(product.id, correspondingProduct.stock);
            return true;
        });

        await Promise.all(idsAndStocks);
    } catch (error) {
        throw error;
    };
};

const scraper = async (env, headers) => {
    const API = env.dropi_api_products;
    const DROPI_IMG_URL = env.dropi_img_url;
    const DROPI_DETAILS_PRODUCTS = env.dropi_details_products;

    let currentPage = 1;
    let hasMoreResults = true;

    while (hasMoreResults) {
        const offset = (currentPage - 1) * limit;
        body.startData = offset;

        try {
            const response = await axios.post(API, body, { headers } );
    
            const { objects } = response.data;
    
            if (objects.length === 0) {
                logMessage(`No se encontraron más productos en la página ${currentPage}`);
                hasMoreResults = false;
                continue;
            };
    
            logMessage(`Analizando ${limit * currentPage} productos (${env.country})`);

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
    
            currentPage++;
        } catch (error) {
            logMessage(`Error al scrapear productos: ${error.message}`);
            if (error.validationErrors) {
                logMessage(JSON.stringify(error.validationErrors));
            };
        };
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