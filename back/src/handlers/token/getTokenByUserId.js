const { Token } = require("../../config/database");

const getTokenByUserId = async (userId) => {
    try {
        const token = await Token.findOne({ userId });

        return token;
    } catch (error) {
        throw error;
    };
};

module.exports = { getTokenByUserId };