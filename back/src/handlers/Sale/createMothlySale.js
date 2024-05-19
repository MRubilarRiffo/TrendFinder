const { validations } = require('../../helpers/validations');
const { MothlySale } = require('../../config/database');

const createMothlySale = async (productId, unitsSold, date) => {
    try {
        const validationRules = {
            productId: { required: true },
            unitsSold: { type: 'number', required: true },
            date: { required: true },
        };
        
        const errors = validations({ productId, unitsSold, date }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const queryOptions = { ProductId: productId, unitsSold, date };

        const mothlySales = await MothlySale.create(queryOptions);

        if (!mothlySales) {
            const error = new Error('Reporte de venta mensual no creada.');
            throw error;
        };

        return mothlySales;
    } catch (error) {
        throw error;
    };
};

module.exports = { createMothlySale };