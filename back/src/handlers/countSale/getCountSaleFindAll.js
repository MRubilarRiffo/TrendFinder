const { CountSale } = require('../../config/database');

const getCountSaleFindAll = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const countSale = await CountSale.findAll(queryOptions);
    
        return countSale;
    } catch (error) {
        throw error;
    };
};

module.exports = { getCountSaleFindAll };