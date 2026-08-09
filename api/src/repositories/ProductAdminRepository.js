const { Product } = require('../config/database');
const { logMessage } = require('../helpers/logMessage');

const createBulkProduct = async (products) => {
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

        const createdProducts = await Product.bulkCreate(queryOptions, {
            updateOnDuplicate: ['name', 'sale_price', 'suggested_price'],
            ignoreDuplicates: true
        });

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
