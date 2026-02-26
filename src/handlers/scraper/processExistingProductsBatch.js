const { Stock, ProductSale } = require('../../config/database');
const { logMessage } = require('../../helpers/logMessage');
const { validateDropiProduct } = require('../../helpers/scraper/dropiValidator');

/**
 * Procesa en batch los productos que **ya existen** en base de datos.
 * Actualiza información (si Dropi dice que hubo una modificación reciente) y
 * descuenta / registra ventas si el stock disminuyó entre la foto local y la nueva bajada de Dropi.
 */
const processExistingProductsBatch = async (existingProductsWithStock) => {
    try {
        const existingProductIds = existingProductsWithStock.map(product => product.id);

        const queryOptionsStock = { attributes: ['id', 'ProductId', 'quantity'], where: { ProductId: existingProductIds } };
        const existingStock = await Stock.findAll(queryOptionsStock);

        const existingProductsPromises = existingProductsWithStock.map(async ({ id, stock }) => {
            const safeStock = stock !== null && stock !== undefined && !isNaN(parseInt(stock)) ? parseInt(stock) : 0;

            try {
                validateDropiProduct(id, true, safeStock); // Asumimos name:true porque el update puede omitirlo y solo importar el stock
            } catch (error) {
                logMessage(`Error al validar productos existentes: ${error.message}`);
                if (error.validationErrors) logMessage(JSON.stringify(error.validationErrors));
                return null;
            }

            const stockInfo = existingStock.find(stockItem => stockItem.ProductId === id);

            if (stockInfo) {
                // Nivelar inventario al real actual (Sumatoria Dropshipping V2)
                if (stockInfo.quantity !== safeStock) {
                    // Si el stock nuevo es menor al que teníamos, asumimos que hubo ventas
                    if (stockInfo.quantity > safeStock) {
                        const soldAmount = stockInfo.quantity - safeStock;
                        try {
                            await ProductSale.create({
                                quantitySold: soldAmount,
                                ProductId: id,
                                saleDate: new Date()
                            });
                        } catch (saleError) {
                            logMessage(`Error registrando venta para producto ${id}: ${saleError.message}`);
                        }
                    }

                    await stockInfo.update({ quantity: safeStock });
                    updatedSomething = true;
                }
            }

            // Si quieres logear opcionalmente qué pasó (Opcional, omitido por default visual noise)
            // if(updatedSomething) logMessage(`Producto ID ${id} sincronizado exitosamente.`);
        });

        await Promise.all(existingProductsPromises);
    } catch (error) {
        throw error;
    }
};

module.exports = { processExistingProductsBatch };