const { logMessage } = require("../../helpers/logMessage");
const { User } = require("../../infrastructure/config/database");

const getUserFindOne = async (queryOptions) => {
    try {
        if (!queryOptions) {
            throw new Erro('Falta parámetro "queryOptions"');
        };

        const user = User.findOne(queryOptions);

        if (!user) {
            throw new Error('No se encontraron usuarios en la base de datos');
        };

        return user;
    } catch (error) {
        const errorMessage = `Error al obtener usuario: ${error.message}`;
        logMessage(errorMessage);
        return { error: errorMessage };
    };
};

module.exports = { getUserFindOne };