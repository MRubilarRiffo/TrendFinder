const { Op } = require('sequelize');
const { Sale } = require('../../infrastructure/config/database');
const { logMessage } = require('../../helpers/logMessage');

const sumSale = async (productId, date) => {
    try {
        if (!productId) {
            throw new Error('Falta "productId"')
        };

        if (!date) {
            throw new Error('Falta "date"')
        };

        const unitsSold = await Sale.sum('unitsSold', {
            where: {
                ProductId: productId,
                createdAt: date,
            },
        });

        if (!unitsSold) {
            throw new Error(`No hay ventas para productId = ${productId}`);
        };

        return unitsSold;
    } catch (error) {
        logMessage(`Error al sumar ventas: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { sumSale };