const { getStocksByProductIds, updateStockQuantity } = require('../../../repositories/StockRepository');
const { createSale } = require('../../../repositories/ProductSaleRepository');
const { logMessage } = require('../../../helpers/logMessage');
const { getLastRunFinishedAt } = require('../../../helpers/botState');
const { validateDropiProduct } = require('./dropiValidator');

// Umbrales para diferenciar ventas orgánicas de ajustes manuales de proveedor
const MAX_SINGLE_CHECK_ORGANIC_SALES = 75; // Máximo de ventas creíble en un único escaneo de ~1 hora
const MAX_DAILY_OFFLINE_SALES = 250; // Techo diario máximo para redistribución retroactiva tras inactividad del bot

/**
 * Procesa en batch los productos que **ya existen** en base de datos.
 * Actualiza información y descuenta / registra ventas si el stock disminuyó
 * entre la foto local y la nueva bajada de Dropi.
 * Aplica guardrails para neutralizar ajustes manuales de stock y agotamiento masivo.
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
                    // Si el stock nuevo es menor al que teníamos, evaluamos si es venta real o ajuste de proveedor
                    if (stockInfo.quantity > safeStock) {
                        const soldAmount = stockInfo.quantity - safeStock;
                        const now = new Date();

                        // 1. Detección de Agotamiento Masivo (Stock Zeroing)
                        // Si el producto tenía stock relevante (>= 30) y cae súbitamente a 0 o <= 2,
                        // en Dropi representa que el proveedor vació o pausó el producto manualmente.
                        const isDepletionAdjustment = safeStock <= 2 && stockInfo.quantity >= 30;

                        if (isDepletionAdjustment) {
                            logMessage(`[INVENTORY SYNC] Agotamiento masivo detectado para producto ${id} (${stockInfo.quantity} -> ${safeStock}). Nivelando stock sin registrar venta ficticia.`);
                        } else {
                            // 2. Determinar tiempo transcurrido desde la última corrida
                            let lastCheck = null;
                            const lastBotRun = getLastRunFinishedAt();
                            if (lastBotRun) {
                                lastCheck = lastBotRun;
                            } else if (stockInfo.updatedAt) {
                                const parsed = new Date(stockInfo.updatedAt);
                                if (!isNaN(parsed.getTime())) {
                                    lastCheck = parsed;
                                }
                            }
                            if (!lastCheck) lastCheck = now;

                            const hoursOffline = Math.max(0, (now.getTime() - lastCheck.getTime()) / (1000 * 3600));

                            // 3. Manejo de Inactividad del Bot (offline > 25 horas)
                            if (hoursOffline > 25) {
                                const daysOffline = Math.max(1, Math.floor(hoursOffline / 24));
                                const rawDailyQty = Math.floor(soldAmount / daysOffline);
                                const dailyQty = Math.min(rawDailyQty, MAX_DAILY_OFFLINE_SALES);
                                const remainder = Math.min(soldAmount % daysOffline, MAX_DAILY_OFFLINE_SALES);

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
                                // 4. Verificación de Velocidad Creíble en Escaneo Regular
                                // En un check de ~1 hora, caídas descomunales (ej. 897 uds) son retiros de lote del proveedor.
                                const maxAllowedSales = Math.max(MAX_SINGLE_CHECK_ORGANIC_SALES, Math.ceil(Math.max(1, hoursOffline)) * 30);

                                if (soldAmount > maxAllowedSales) {
                                    logMessage(`[INVENTORY SYNC] Ajuste masivo de proveedor detectado para producto ${id} (${soldAmount} uds en ${hoursOffline.toFixed(1)}h > límite ${maxAllowedSales}). Nivelando stock sin registrar venta.`);
                                } else {
                                    // Venta orgánica legítima (ej. 15, 35 unidades)
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