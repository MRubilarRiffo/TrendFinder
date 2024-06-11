const { Token } = require("../../config/database");

const getTokenFindOne = async (tokenQuery) => {
    try {
        const token = await Token.findOne(tokenQuery);

        return token;
    } catch (error) {
        throw error;
    };
};

module.exports = { getTokenFindOne };