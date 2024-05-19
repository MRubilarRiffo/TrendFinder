const { Stock } = require('../../config/database');

const getStockFindAll = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const stock = await Stock.findAll(queryOptions);
    
        return stock;
    } catch (error) {
        throw error;
    };
};

module.exports = { getStockFindAll };