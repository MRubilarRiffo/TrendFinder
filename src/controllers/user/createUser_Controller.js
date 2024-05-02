const { getUserFindOne } = require("../../handlers/user/getUserFindOne");
const { createUser } = require("../../handlers/user/createUser");
const { logMessage } = require("../../helpers/logMessage");
const { validations } = require("../../helpers/validations");
const bcrypt = require("bcrypt");

const createUser_Controller = async (req, res) => {
    try {
        const { name, lastName, email, password } = req.body;

        const error = validations({ name, lastName, email, password });
        if (error && error.length > 0) {
            return res.status(400).json({
                message: 'Por favor, proporcione todos los campos requeridos.',
                error: error
            });
        };

        const queryOptions = { where: { email } };
        const existingUser = await getUserFindOne(queryOptions);
        if (existingUser) {
            return res.status(400).json({ error: 'El correo electrónico ya está en uso.' });
        };

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await createUser(name, lastName, email, hashedPassword);

        if (newUser.error) {
            return res.status(400).json({ error: newUser.error });
        };

        return res.status(201).json(newUser);
    } catch (error) {
        const errorMessage = `Hubo un problema al procesar su solicitud: ${error.message}`;
        logMessage(errorMessage);
        return res.status(500).json({ error: errorMessage });
    };
};

module.exports = { createUser_Controller };