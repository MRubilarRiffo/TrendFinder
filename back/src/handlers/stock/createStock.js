const { validations } = require('../../helpers/validations');
const { Stock } = require('../../config/database');

const createStock = async (productId, quantity) => {
    try {
        const validationRules = {
            productId: { required: true },
            quantity: { required: true },
        };
        
        const errors = validations({ productId, quantity }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const stock = await Stock.create({ ProductId: productId, quantity });

        return stock;
    } catch (error) {
        throw error;
    }
};

module.exports = { createStock };