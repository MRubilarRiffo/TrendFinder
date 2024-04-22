const { Sale } = require('../../db');

const createSale = async (productId, unitsSold) => {
    try {
        const sale = await Sale.create({ ProductId: productId, unitsSold });

        return sale;
    } catch (error) {
        console.error('Error al crear Sale:', error);
        throw error;
    }
};

module.exports = { createSale };