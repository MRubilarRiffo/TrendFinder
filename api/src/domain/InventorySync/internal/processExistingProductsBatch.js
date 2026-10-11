const { getStocksByProductIds, updateStockQuantity } = require('../../../repositories/StockRepository');
const { createSale } = require('../../../repositories/ProductSaleRepository');
const { logMessage } = require('../../../helpers/logMessage');
const { validateDropiProduct } = require('./dropiValidator');

/**
 * Procesa en batch los productos que **ya existen** en base de datos.
 * Actualiza información y descuenta / registra ventas si el stock disminuyó
 * entre la foto local y la nueva bajada de Dropi.
 */
const processExistingProductsBatch = async (existingProductsWithStock) => {
    try {
        const existingProductIds = existingProductsWithStock.map(product => product.id);
        const existingStock = await getStocksByProductIds(existingProductIds);

        const existingProductsPromises = existingProductsWithStock.map(async ({ id, stock }) => {
            const safeStock = stock !== null && stock !== undefined && !isNaN(parseInt(stock)) ? parseInt(stock) : 0;

            try {
                validateDropiProduct(id, true, safeStock);
            } catch (error) {
                logMessage(`Error al validar productos existentes: ${error.message}`);
                if (error.validationErrors) logMessage(JSON.stringify(error.validationErrors));
                return null;
            }

            const stockInfo = existingStock.find(stockItem => stockItem.ProductId === id);

            if (stockInfo) {
                // Nivelar inventario al real actual
                if (stockInfo.quantity !== safeStock) {
                    // Si el stock nuevo es menor al que teníamos, registramos ventas
                    if (stockInfo.quantity > safeStock) {
                        const soldAmount = stockInfo.quantity - safeStock;
                        const now = new Date();
                        let lastCheck = now;
                        if (stockInfo.updatedAt) {
                            const parsed = new Date(stockInfo.updatedAt);
                            if (!isNaN(parsed.getTime())) {
                                lastCheck = parsed;
                            }
                        }
                        const hoursOffline = (now.getTime() - lastCheck.getTime()) / (1000 * 3600);

                        // Si el bot estuvo inactivo/offline por más de 1 día (umbral > 25 horas)
                        if (hoursOffline > 25) {
                            const daysOffline = Math.max(1, Math.floor(hoursOffline / 24));
                            const dailyQty = Math.floor(soldAmount / daysOffline);
                            const remainder = soldAmount % daysOffline;

                            for (let i = 0; i < daysOffline; i++) {
                                const retroactiveDate = new Date(lastCheck.getTime() + (i + 1) * (24 * 3600 * 1000));
                                const qtyForDay = dailyQty + (i === daysOffline - 1 ? remainder : 0);

                                if (qtyForDay > 0) {
                                    try {
                                        await createSale({
                                            quantitySold: qtyForDay,
                                            ProductId: id,
                                            saleDate: retroactiveDate
                                        });
                                    } catch (saleError) {
                                        logMessage(`Error registrando venta retroactiva para producto ${id}: ${saleError.message}`);
                                    }
                                }
                            }
                            logMessage(`[BOT] Ventas de producto ${id} (${soldAmount} uds) redistribuidas en ${daysOffline} días por inactividad de ${hoursOffline.toFixed(1)}h.`);
                        } else {
                            try {
                                await createSale({
                                    quantitySold: soldAmount,
                                    ProductId: id,
                                    saleDate: now
                                });
                            } catch (saleError) {
                                logMessage(`Error registrando venta para producto ${id}: ${saleError.message}`);
                            }
                        }
                    }

                    await updateStockQuantity(stockInfo, safeStock);
                }
            }
        });

        await Promise.all(existingProductsPromises);
    } catch (error) {
        throw error;
    }
};

module.exports = { processExistingProductsBatch };