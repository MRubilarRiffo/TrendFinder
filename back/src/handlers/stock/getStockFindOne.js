const { validations } = require('../../helpers/validations');
const { Stock } = require('../../infrastructure/config/database');

const getStockFindOne = async (productId) => {
    try {
        const validationRules = {
            productId: { type: 'number', required: true },
        };
        
        const errors = validations({ productId }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const queryOptions = {
            where: {
                ProductId: productId
            }
        };

        const stock = await Stock.findOne(queryOptions);

        return stock;
    } catch (error) {
        throw error;
    };
};

module.exports = { getStockFindOne };