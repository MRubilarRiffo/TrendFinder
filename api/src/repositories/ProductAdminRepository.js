const { Product } = require('../config/database');
const { logMessage } = require('../helpers/logMessage');

const createBulkProduct = async (products, transaction = null) => {
    try {
        const queryOptions = products.map(product => ({
            dropiId: product.id,
            name: product.name,
            image: product.image,
            sale_price: product.sale_price,
            url: product.url,
            country: product.country,
            suggested_price: product.suggested_price
        }));
        logMessage(`[DB HANDLER] Recrutando Array para BulkCreate: ${queryOptions.length} items recibidos.`);

        const bulkOptions = {
            updateOnDuplicate: ['name', 'sale_price', 'suggested_price'],
            ignoreDuplicates: true
        };
        if (transaction) {
            bulkOptions.transaction = transaction;
        }

        const createdProducts = await Product.bulkCreate(queryOptions, bulkOptions);

        logMessage(`[DB HANDLER] Inserción completada de ${createdProducts.length} productos en DB.`);
        return createdProducts;
    } catch (error) {
        logMessage(`[DB HANDLER CRÍTICO] Error en bulkCreate: ${error.message}`);
        throw error;
    }
};

const getProductsFindAll = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        }

        const products = await Product.findAll(queryOptions);
    
        return products;
    } catch (error) {
        throw error;
    }
};

module.exports = { 
    createBulkProduct,
    getProductsFindAll 
};
