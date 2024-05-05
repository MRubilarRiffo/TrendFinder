const { validations } = require('../../helpers/validations');
const { Product } = require('../../infrastructure/config/database');

const getProductFindByPk = async (productId) => {
    try {
        const validationRules = {
            productId: { required: true },
        };
        
        const errors = validations({ productId }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };
        
        const product = await Product.findByPk(productId);

        return product;
    } catch (error) {
        throw error;
    };
};

module.exports = { getProductFindByPk };