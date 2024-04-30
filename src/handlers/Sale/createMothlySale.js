const { logMessage } = require('../../helpers/logMessage');
const { MothlySale } = require('../../infrastructure/config/database');

const createMothlySale = async (productId, unitsSold) => {
    try {
        if (!productId) {
            throw new Error('Falta productId');
        };

        if (!unitsSold) {
            throw new Error('Falta unitsSold');
        };

        const mothlySales = await MothlySale.create({ ProductId: productId, unitsSold });

        if (!mothlySales) {
            throw new Error('Error al crear venta mensual');
        };

        return mothlySales;
    } catch (error) {
        logMessage(`Error al crear venta mensual: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { createMothlySale };