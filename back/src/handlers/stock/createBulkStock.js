const { Stock } = require('../../infrastructure/config/database');

const createBulkStock = async (stocks) => {
    try {
        const queryOptions = stocks.map(item => ({
            ProductId: item.id,
            quantity: item.stock,
        }));

        const stock = await Stock.bulkCreate(queryOptions, {
            updateOnDuplicate: ['quantity'],
            fields: ['quantity']
        });

        return stock;
    } catch (error) {
        throw error;
    }
};

module.exports = { createBulkStock };