const { Stock } = require('../config/database');

/**
 * Repositorio de Persistencia para Stock (Infraestructura / Driven Adapter)
 */
const getStocksByProductIds = async (productIds) => {
    return await Stock.findAll({
        attributes: ['id', 'ProductId', 'quantity', 'updatedAt'],
        where: { ProductId: productIds }
    });
};

const updateStockQuantity = async (stockItem, quantity) => {
    return await stockItem.update({ quantity });
};

const createBulkStock = async (stockEntries, transaction = null) => {
    const options = transaction ? { transaction } : {};
    return await Stock.bulkCreate(stockEntries, options);
};

module.exports = {
    getStocksByProductIds,
    updateStockQuantity,
    createBulkStock
};
