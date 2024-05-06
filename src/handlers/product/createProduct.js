const { validations } = require('../../helpers/validations');
const { Product } = require('../../infrastructure/config/database');

const createProduct = async (id, name, image, description, sale_price, url) => {
    try {
        const validationRules = {
            id: { required: true },
            name: { type: 'string', required: true },
            image: { type: 'string' },
            url: { type: 'string' }
        };
        
        const errors = validations({ id, name, image, url }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const queryOptions = { id, name, image, description, sale_price, url };

        const createProduct = await Product.create(queryOptions);

        return createProduct;
    } catch (error) {
        throw error;
    };
};

module.exports = { createProduct };