require('dotenv').config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validations } = require("../../helpers/validations");
const { getUserFindOne } = require("../../handlers/user/getUserFindOne");

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const validationRules = {
            password: { type: 'string', required: true },
            email: { type: 'email', required: true }
        };
        
        const errors = validations({ email, password }, validationRules);

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.statusCode = 400;
            error.validationErrors = errors
            throw error;
        };

        const queryOptions = { where: { email } };
        const user = await getUserFindOne(queryOptions);

        if (!user) {
            const error = new Error('Credenciales inválidas.');
            error.statusCode = 401;
            throw error;
        };
        
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            const error = new Error('Credenciales inválidas.');
            error.statusCode = 401;
            throw error;
        };

        const jwtSecret = process.env.JWT_SECRET;
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            jwtSecret,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        next(error);
    };
};

module.exports = { loginUser };