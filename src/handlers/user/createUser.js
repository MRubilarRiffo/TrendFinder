const { logMessage } = require("../../helpers/logMessage");
const { User } = require("../../infrastructure/config/database");

const createUser = async (name, lastName, email, password) => {
    try {
        if (!name) {
            throw new Error('Falta parámetro "name"')
        };

        if (!lastName) {
            throw new Error('Falta parámetro "lastName"')
        };

        if (!email) {
            throw new Error('Falta parámetro "email"')
        };

        if (!password) {
            throw new Error('Falta parámetro "password"')
        };

        const newUser = await User.create({ name, lastName, email, password });

        if (!newUser) {
            throw new Error('Error al agregar usuario en la base de datos');
        };

        return newUser;
    } catch (error) {
        const errorMessage = `Error al crear usuario: ${error.message}`;
        logMessage(errorMessage);
        return { error: errorMessage };
    };
};

module.exports = { createUser };