const { Stock } = require("../../config/database");
const { logMessage } = require("../../helpers/logMessage");
const { validateDropiProduct } = require("../../helpers/scraper/dropiValidator");

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

        const existingProductsPromises = existingProductsWithStock.map(async ({ id, stock, updateProduct, obj }) => {
            stock = parseInt(stock);

            try {
                validateDropiProduct(id, true, stock); // Asumimos name:true porque el update puede omitirlo y solo importar el stock
            } catch (error) {
                logMessage(`Error al validar productos existentes: ${error.message}`);
                if (error.validationErrors) logMessage(JSON.stringify(error.validationErrors));
                return null;
            }

            const stockInfo = existingStock.find(stockItem => stockItem.ProductId === id);

            // Actualiza info texto/imagenes si la fecha de actualizacion reporta cambios en Dropi respecto a Local
            if (Object.keys(updateProduct).length > 0) {
                await obj.update(updateProduct);
            }

            if (stockInfo) {
                // Nivelar inventario al real actual
                if (stockInfo.quantity !== stock) {
                    await stockInfo.update({ quantity: stock });
                }
            }
        });

        await Promise.all(existingProductsPromises);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    processExistingProductsBatch
};
