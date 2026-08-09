const { processExistingProductsBatch } = require('./internal/processExistingProductsBatch');
const { processNonexistentProductsBatch } = require('./internal/processNonexistentProductsBatch');

const syncInventoryBatch = async (existingProductsWithStock, nonexistentProducts, DROPI_DETAILS_PRODUCTS, country) => {
    const promises = [];

    if (existingProductsWithStock && existingProductsWithStock.length > 0) {
        promises.push(processExistingProductsBatch(existingProductsWithStock));
    }
    if (nonexistentProducts && nonexistentProducts.length > 0) {
        promises.push(processNonexistentProductsBatch(nonexistentProducts, DROPI_DETAILS_PRODUCTS, country));
    }

    await Promise.all(promises);
};

module.exports = { syncInventoryBatch, processExistingProductsBatch, processNonexistentProductsBatch };
