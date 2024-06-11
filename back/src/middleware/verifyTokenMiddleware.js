const { getTokenFindOne } = require('../handlers/token/getTokenFindOne');
const jwt = require("jsonwebtoken");

const verifyTokenMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error('Token no proporcionado o formato inválido.');
            error.statusCode = 401;
            throw error;
        };

        const token = authHeader.split(' ')[1];

        const tokenQuery = { where: { token } };

        const tokenData = await getTokenFindOne(tokenQuery)

        if (!tokenData) { 
            const error = new Error('Token inválido.');
            error.statusCode = 401;
            throw error;
        };

        const decodedToken = jwt.decode(tokenData.token);

        if (!decodedToken || !decodedToken.exp) {
            const error = new Error('Token inválido o sin fecha de expiración.');
            error.statusCode = 401;
            throw error;
        };

        const expirationTimestamp = decodedToken.exp;
        const expirationDate = new Date(expirationTimestamp * 1000);

        if (expirationDate < new Date()) {
            const error = new Error('Token expirado.');
            error.statusCode = 401;
            throw error;
        };

        req.user = {
            id: tokenData.userId
        };
    
        next();
    } catch (error) {
        next(error);
    };
};

module.exports = verifyTokenMiddleware;