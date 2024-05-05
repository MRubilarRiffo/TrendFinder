const { Sale } = require('../../infrastructure/config/database');

const getSale = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const sales = await Sale.findAll(queryOptions);

        if (!sales) {
            const error = new Error('No hay ventas disponibles.');
            throw error;
        };

        return sales;
    } catch (error) {
        throw error;
    };
};

module.exports = { getSale };