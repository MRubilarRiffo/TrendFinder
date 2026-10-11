const { ProductSale } = require('../config/database');

/**
 * Repositorio de Persistencia para Ventas (Infraestructura / Driven Adapter)
 */
const createSale = async (saleData, transaction = null) => {
    const options = transaction ? { transaction } : {};
    return await ProductSale.create(saleData, options);
};

const createBulkSales = async (salesEntries, transaction = null) => {
    const options = transaction ? { transaction } : {};
    return await ProductSale.bulkCreate(salesEntries, options);
};

module.exports = {
    createSale,
    createBulkSales
};
