const { validations } = require('../../helpers/validations');
const { User } = require('../../infrastructure/config/database');

const getUserFindByPk = async (userId) => {
    try {
        const validationRules = {
            userId: { required: true },
        };
        
        const errors = validations({ userId }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };
        
        const product = await User.findByPk(userId);

        return product;
    } catch (error) {
        throw error;
    };
};

module.exports = { getUserFindByPk };