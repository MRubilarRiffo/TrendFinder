const { logMessage } = require('../../helpers/logMessage');
const { createWeeklySale } = require('../../infrastructure/config/database');

const createWeeklySale = async (productId, unitsSold, date) => {
    try {
        if (!productId) {
            throw new Error('Falta productId');
        };

        if (!unitsSold) {
            throw new Error('Falta unitsSold');
        };

        const createWeeklySales = await createWeeklySale.create({ ProductId: productId, unitsSold, date });

        if (!createWeeklySales) {
            throw new Error('Error al crear venta semanal');
        };

        return createWeeklySales;
    } catch (error) {
        logMessage(`Error al crear venta semanal: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { createWeeklySale };