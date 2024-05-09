const { validations } = require('../../helpers/validations');
const { WeeklySale } = require('../../infrastructure/config/database');

const createWeeklySale = async (productId, unitsSold, dateStart, dateEnd) => {
    try {
        const validationRules = {
            productId: { type: 'number', required: true },
            unitsSold: { type: 'number', required: true },
            dateStart: { required: true },
            dateEnd: { required: true },
        };
        
        const errors = validations({ productId, unitsSold, dateStart, dateEnd }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validaciónal crear el reporte de ventas semanal.');
            error.validationErrors = errors;
            throw error;
        };

        const weeklySales = await WeeklySale.create({ ProductId: productId, unitsSold, dateStart, dateEnd });

        if (!weeklySales) {
            const error = new Error('Reporte de venta semanal no creada.');
            throw error;
        };

        return weeklySales;
    } catch (error) {
        throw error;
    };
};

module.exports = { createWeeklySale };