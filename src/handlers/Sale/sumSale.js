const { Sale } = require('../../infrastructure/config/database');
const { validations } = require('../../helpers/validations');

const sumSale = async (productId, date) => {
    try {
        const validationRules = {
            productId: { required: true },
            date: { required: true },
        };
        
        const errors = validations({ productId, date }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const queryOptions = {
            where: {
                ProductId: productId,
                createdAt: date,
            },
        };

        const unitsSold = await Sale.sum('unitsSold', queryOptions);

        if (!unitsSold) {
            const error = new Error(`No hay ventas para el producto ${productId}`);
            throw error;
        };

        return unitsSold;
    } catch (error) {
        throw error;
    };
};

module.exports = { sumSale };