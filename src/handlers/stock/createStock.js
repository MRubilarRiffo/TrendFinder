const { Stock } = require('../../db');

const createStock = async (productId, quantity) => {
    try {
        const stock = await Stock.create({ ProductId: productId, quantity });

        return stock;
    } catch (error) {
        console.error('Error al crear stock:', error);
        throw error;
    }
};

module.exports = { createStock };