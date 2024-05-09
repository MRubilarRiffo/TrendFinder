const { validations } = require('../../helpers/validations');
const { DailySale } = require('../../infrastructure/config/database');

const createDailySale = async (productId, unitsSold, date) => {
    try {
        const validationRules = {
            productId: { required: true },
            unitsSold: { type: 'number', required: true },
            date: { required: true },
        };
        
        const errors = validations({ productId, unitsSold, date }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación al crear el reporte de ventas diaria.');
            error.validationErrors = errors;
            throw error;
        };

        const dailySales = await DailySale.create({ ProductId: productId, unitsSold, date });

        if (!dailySales) {
            const error = new Error('Reporte de venta diaria no creada.');
            throw error;
        };

        return dailySales;
    } catch (error) {
        throw error;
    };
};

module.exports = { createDailySale };