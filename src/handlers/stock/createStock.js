const { Stock } = require('../../db');
const { logMessage } = require('../../helpers/logMessage');

const createStock = async (productId, quantity) => {
    try {
        const stock = await Stock.create({ ProductId: productId, quantity });

        return stock;
    } catch (error) {
        logMessage('Error al crear stock:', error);
        throw error;
    }
};

module.exports = { createStock };