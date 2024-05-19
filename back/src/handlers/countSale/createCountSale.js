const { CountSale } = require('../../config/database');

const createCountSale = async (ProductId, repeat, totalSales) => {
    try {
        const countSale = await CountSale.create({ ProductId, repeat, totalSales });

        return countSale;
    } catch (error) {
        throw error;
    };
};

module.exports = { createCountSale };