const { User } = require("../../config/database");

const getUserFindOne = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const user = await User.findOne(queryOptions);

        return user;
    } catch (error) {
        throw error;
    };
};

module.exports = { getUserFindOne };