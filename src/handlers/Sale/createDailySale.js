const { logMessage } = require('../../helpers/logMessage');
const { DailySale } = require('../../infrastructure/config/database');

const createDailySale = async (productId, unitsSold) => {
    try {
        if (!productId) {
            throw new Error('Falta productId');
        };

        if (!unitsSold) {
            throw new Error('Falta unitsSold');
        };

        const dailySales = await DailySale.create({ ProductId: productId, unitsSold });

        if (!dailySales) {
            throw new Error('Error al crear venta diaria');
        };

        return dailySales;
    } catch (error) {
        logMessage(`Error al crear venta diaria: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { createDailySale };