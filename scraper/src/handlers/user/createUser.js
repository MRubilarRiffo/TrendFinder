const { validations } = require("../../helpers/validations");
const { User } = require("../../infrastructure/config/database");

const createUser = async (name, lastName, email, password) => {
    try {
        const validationRules = {
            name: { type: 'string', required: true, length: { min: 2, max: 30 } },
            lastName: { type: 'string', required: true, length: { min: 2, max: 30 } },
            password: { type: 'string', required: true, length: { min: 8 } },
            email: { type: 'email', required: true }
        };
        
        const errors = validations({ name, lastName, email, password }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.statusCode = 400;
            error.validationErrors = errors;
            throw error;
        };

        const newUser = await User.create({ name, lastName, email, password });

        if (!newUser) {
            const error = new Error('Error al crear usuario.');
            throw error;
        };

        return newUser;
    } catch (error) {
        throw error;
    };
};

module.exports = { createUser };