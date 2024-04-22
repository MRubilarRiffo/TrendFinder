const axios = require("axios");
const { createProduct } = require("../handlers/product/createProduct");
const { getCategoryByName } = require("../handlers/category/getCategoryByName");
const { createCategory } = require("../handlers/category/createCategory");
const { getProductFindByPk } = require("../handlers/product/getProductFindByPk");
const { createSale } = require("../handlers/Sale/createSale");
const { getStockFindOne } = require("../handlers/stock/getStockFindOne");
const { createStock } = require("../handlers/stock/createStock");

const API = process.env.API_DROPI_GET_PRODUCTS;

const scraper = async (currentPage = 1) => {
    try {
        const limit = 500;
        const offset = (currentPage - 1) * limit;

        const body = {
            "privated_product": false,
            "bod": null,
            "stockmayor": 1,
            "no_count": false,
            "order_by": "id",
            "order_type": "asc",
            "pageSize": limit,
            "startData": offset,
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

        const response = await axios.post(API, body, { headers } );

        const { count, objects } = response.data;

        const totalPages = Math.ceil(count / limit);

        console.log("page " + currentPage + " de " + totalPages);

        const productPromises = objects.map(async ({ id, name, stock, gallery, categories }) => {
            if (!id || !name || !stock) return null;

            let images = [];

            if (gallery && gallery.length > 0) {
                gallery.forEach(item => {
                    if (item.url) {
                        images.push(`https://api.dropi.cl/${item.url}`);
                    } else if (item.urlS3) {
                        images.push(`https://d39ru7awumhhs2.cloudfront.net/${item.urlS3}`);
                    };
                });
            };

            let product = await getProductFindByPk(id);

            if (!product) {
                product = await createProduct({
                    id: id,
                    name: name,
                    image: images.join(',')
                });

                if (categories && categories.length > 0) {
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
                                categoryInstance = await createCategory({ name: categoryName });
                            };
                            // Asociamos la categoría con el producto
                            await product.addCategory(categoryInstance);
                        };
                    };
                };
            };
            
            if (!product.id) return null;


            const lastStock = await getStockFindOne(product.id);
            
            if (lastStock) {
                const unitsSold = lastStock.quantity - stock;
                await createSale(product.id, unitsSold);
            };

            return createStock(product.id, stock);
        });

        await Promise.all(productPromises);

        if (currentPage < totalPages) {
            await scraper(currentPage + 1, count);
        };

        return;
    } catch (error) {
        console.log(error);
    };
};

module.exports = { scraper };