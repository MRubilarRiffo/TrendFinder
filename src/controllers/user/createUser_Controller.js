const { getUserFindOne } = require("../../handlers/user/getUserFindOne");
const { createUser } = require("../../handlers/user/createUser");
const { logMessage } = require("../../helpers/logMessage");
const { validations } = require("../../helpers/validations");
const bcrypt = require("bcrypt");

const createUser_Controller = async (req, res, next) => {
    try {
        const { name, lastName, email, password } = req.body;

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
            error.validationErrors = errors
            throw error;
        };

        const queryOptions = { where: { email } };
        const existingUser = await getUserFindOne(queryOptions);

        if (existingUser) {
            const error = new Error('El correo electrónico ya está en uso.');
            error.statusCode = 400;
            throw error;
        };

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await createUser(name, lastName, email, hashedPassword);

        return res.status(201).json(newUser);
    } catch (error) {
        next(error);
    };
};

module.exports = { createUser_Controller };