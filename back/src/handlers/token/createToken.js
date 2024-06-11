const { Token } = require('../../config/database');
const { validations } = require('../../helpers/validations');

const createToken = async (token, userId) => {
    try {
        const validationRules = {
            userId: { required: true },
            token: { required: true },
        };
        
        const errors = validations({ userId, token }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación al crear token.');
            error.validationErrors = errors;
            throw error;
        };

        const tokenQuery = {
            UserId: userId,
            token
        };

        const response = await Token.create(tokenQuery);

        return response;
    } catch (error) {
        throw error;
    }
};

module.exports = { createToken };