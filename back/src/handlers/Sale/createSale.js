const { Sale } = require('../../infrastructure/config/database');
const { validations } = require('../../helpers/validations');

const createSale = async (productId, unitsSold) => {
    try {
        const validationRules = {
            productId: { type: 'number', required: true },
            unitsSold: { type: 'number', required: true },
        };
        
        const errors = validations({ productId, unitsSold }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const sale = await Sale.create({ ProductId: productId, unitsSold });

        if (!sale) {
            const error = new Error(`Error al crear venta del producto ${productId}.`);
            throw error;
        };

        return sale;
    } catch (error) {
        throw error;
    };
};

module.exports = { createSale };