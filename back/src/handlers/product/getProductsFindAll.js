const { Product } = require('../../config/database');

const getProductsFindAll = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const products = await Product.findAll(queryOptions);
    
        return products;
    } catch (error) {
        throw error;
    };
};

module.exports = { getProductsFindAll };