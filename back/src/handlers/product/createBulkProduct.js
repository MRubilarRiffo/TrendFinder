const { Product } = require('../../config/database');
const { logMessage } = require('../../helpers/logMessage');
const createBulkProduct = async (products) => {
    try {
        const queryOptions = products.map(product => ({
            dropiId: product.id,
            name: product.name,
            image: product.image,
            description: product.description,
            sale_price: product.sale_price,
            url: product.url,
            country: product.country,
            stores: product.stores,
            productUpdateDate: product.productUpdateDate,
            suggested_price: product.suggested_price
        }));
        logMessage(`[DB HANDLER] Recrutando Array para BulkCreate: ${queryOptions.length} items recibidos.`);

        // Evita estallar si en la segunda página hay duplicados cruzados de dropi
        const createdProducts = await Product.bulkCreate(queryOptions, {
            updateOnDuplicate: ['name', 'sale_price', 'suggested_price', 'stock', 'productUpdateDate'],
            ignoreDuplicates: true
        });

        logMessage(`[DB HANDLER] Inserción completada de ${createdProducts.length} productos en DB.`);
        return createdProducts;
    } catch (error) {
        logMessage(`[DB HANDLER CRÍTICO] Error en bulkCreate: ${error.message}`);
        throw error;
    };
};

module.exports = { createBulkProduct };