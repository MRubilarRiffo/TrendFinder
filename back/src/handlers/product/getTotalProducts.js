const { Product } = require('../../infrastructure/config/database');

const getTotalProducts = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const totalProducts = await Product.count(queryOptions);

        return totalProducts;
    } catch (error) {
        throw error;
    };
};

module.exports = { getTotalProducts };