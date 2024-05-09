const { validations } = require('../../helpers/validations');
const { Category } = require('../../infrastructure/config/database');

const createCategory = async (name) => {
    try {
        const validationRules = {
            name: { type: 'string', required: true }
        };
        
        const errors = validations({ name }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const queryOptions = { name };

        const createdCategory = await Category.create(queryOptions);

        return createdCategory;
    } catch (error) {
        throw error;
    };
};

module.exports = { createCategory };