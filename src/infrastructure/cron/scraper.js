const axios = require("axios");
const { createProduct } = require("../../handlers/product/createProduct");
const { getCategoryByName } = require("../../handlers/category/getCategoryByName");
const { createCategory } = require("../../handlers/category/createCategory");
const { getProductFindByPk } = require("../../handlers/product/getProductFindByPk");
const { createSale } = require("../../handlers/Sale/createSale");
const { getStockFindOne } = require("../../handlers/stock/getStockFindOne");
const { createStock } = require("../../handlers/stock/createStock");
const { logMessage } = require("../../helpers/logMessage");
const { validations } = require("../../helpers/validations");

const API = process.env.API_DROPI_GET_PRODUCTS;
const DROPI_IMG_URL = process.env.DROPI_IMG_URL;
const DROPI_IMG_URLS3 = process.env.DROPI_IMG_URLS3;
const DROPI_DETAILS_PRODUCTS = process.env.DROPI_DETAILS_PRODUCTS;

const limit = 500;

const body = {
    "privated_product": false,
    "bod": null,
    "stockmayor": null,
    "no_count": false,
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

const headers = {
    "dropi-integration-key": process.env.DROPI_TOKEN,
    "Content-Type": "application/json;charset=UTF-8"
};

const convertirString = (inputString) => {
    const outputString = inputString.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return outputString;
};

const scraper = async (currentPage = 1) => {
    const offset = (currentPage - 1) * limit;

    body.startData = offset;

    try {
        const response = await axios.post(API, body, { headers } );

        const { count, objects } = response.data;

        const totalPages = Math.ceil(count / limit);

        logMessage(`Página ${currentPage} de ${totalPages}`);

        const productPromises = objects.map(async ({ id, name, stock, gallery, categories, description, sale_price }) => {
            const validationRules = {
                id: { required: true },
                name: { required: true },
                stock: { required: true },
            };
            
            const errors = validations({ id, name, stock }, validationRules );
    
            if (Object.keys(errors).length > 0) {
                const error = new Error('Se encontraron errores de validación.');
                error.validationErrors = errors;
                throw error;
            };

            let product = await getProductFindByPk(id);

            if (!product) {
                let images = [];

                if (gallery && gallery.length > 0) {
                    gallery.forEach(item => {
                        if (item.url) {
                            images.push(`${DROPI_IMG_URL}${item.url}`);
                        } else if (item.urlS3) {
                            images.push(`${DROPI_IMG_URLS3}${item.urlS3}`);
                        };
                    });
                };
                
                const image = images.join(',');
                const url = `${DROPI_DETAILS_PRODUCTS}${id}/${convertirString(name)}`;

                product = await createProduct(id, name, image, description, sale_price, url );

                if (product && categories && categories.length > 0) {
                    // Iteramos sobre cada objeto de la array de categorías
                    for (const catObj of categories) {
                        // Verificamos que exista la propiedad 'name' en el objeto
                        if (catObj && catObj.name) {
                            // Obtenemos el nombre de la categoría del objeto
                            const categoryName = catObj.name;
                            // Buscamos la categoría en la base de datos
                            let categoryInstance = await getCategoryByName(categoryName);
                            // Si la categoría no existe, la creamos
                            if (!categoryInstance) {
                                categoryInstance = await createCategory(categoryName);
                            };
                            // Asociamos la categoría con el producto
                            await product.addCategory(categoryInstance);
                        };
                    };
                };
            };
            
            if (!product.id) return null;

            const lastStock = await getStockFindOne(product.id);
            
            if (lastStock && lastStock.quantity > stock) {
                const unitsSold = lastStock.quantity - stock;
                await createSale(product.id, unitsSold);
                lastStock.quantity = stock;
                await lastStock.save();
            };

            if (!lastStock) {
                await createStock(product.id, stock);
            };

            return null;
        });

        await Promise.all(productPromises);

        if (currentPage < totalPages) {
            await scraper(currentPage + 1, count);
        };

        return;
    } catch (error) {
        logMessage(`Error al scrapear productos: ${error.message}`);
        if (error.validationErrors) {
            logMessage(JSON.stringify(error.validationErrors));
        };
    };
};

module.exports = { scraper };