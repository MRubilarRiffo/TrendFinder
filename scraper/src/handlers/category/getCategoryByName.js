const { validations } = require('../../helpers/validations');
const { Category } = require('../../infrastructure/config/database');

const getCategoryByName = async (name) => {
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

        const queryOptions = {
            where: { name }
        };

        const category = await Category.findOne(queryOptions);

        return category;
    } catch (error) {
        throw error;
    };
};

module.exports = { getCategoryByName };