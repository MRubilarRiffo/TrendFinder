const { logMessage } = require('../../helpers/logMessage');
const { WeeklySale } = require('../../infrastructure/config/database');

const createWeeklySale = async (productId, unitsSold, dateStart, dateEnd) => {
    try {
        if (!productId) {
            throw new Error('Falta productId');
        };

        if (!unitsSold) {
            throw new Error('Falta unitsSold');
        };

        const weeklySales = await WeeklySale.create({ ProductId: productId, unitsSold, dateStart, dateEnd });

        if (!weeklySales) {
            throw new Error('Error al crear venta semanal');
        };

        return weeklySales;
    } catch (error) {
        logMessage(`Error al crear venta semanal: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { createWeeklySale };