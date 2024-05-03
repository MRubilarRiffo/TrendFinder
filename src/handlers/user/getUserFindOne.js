const { User } = require("../../infrastructure/config/database");

const getUserFindOne = async (queryOptions) => {
    try {
        if (!queryOptions) {
            throw new Error('Falta parámetro "queryOptions".');
        };

        const user = await User.findOne(queryOptions);

        return user;
    } catch (error) {
        throw error;
    };
};

module.exports = { getUserFindOne };