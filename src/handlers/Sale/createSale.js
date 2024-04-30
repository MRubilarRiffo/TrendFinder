const { Sale } = require('../../infrastructure/config/database');
const { logMessage } = require('../../helpers/logMessage');

const createSale = async (productId, unitsSold) => {
    try {
        if (!productId) {
            throw new Error('Falta productId');
        };

        if (!unitsSold) {
            throw new Error('Falta unitsSold');
        };

        const sale = await Sale.create({ ProductId: productId, unitsSold });

        if (!sale) {
            throw new Error('Error al crear una venta');
        };

        return sale;
    } catch (error) {
        logMessage(`Error al crear venta: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { createSale };