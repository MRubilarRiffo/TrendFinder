const { Sale } = require('../../db');
const { logMessage } = require('../../helpers/logMessage');

const createSale = async (productId, unitsSold) => {
    try {
        const sale = await Sale.create({ ProductId: productId, unitsSold });

        return sale;
    } catch (error) {
        logMessage('Error al crear Sale:', error);
        throw error;
    }
};

module.exports = { createSale };