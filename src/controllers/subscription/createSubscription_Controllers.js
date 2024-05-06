const { createSubscription } = require("../../handlers/subscription/createSubscription");
const { getUserFindByPk } = require("../../handlers/user/getUserFindByPk");
const { validations } = require("../../helpers/validations");

const createSubscription_Controllers = async (req, res, next) => {
    try {
        const { userId, level, duration } = req.body;

        const validationRules = {
            userId: { required: true },
            level: { type: 'string', required: true },
            duration: { type: 'number', required: true }
        };
        
        const errors = validations({ userId, level, duration }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const dateStart = new Date();
        const dateEnd = new Date();

        dateEnd.setMonth(dateStart.getMonth() + duration);

        const existingUser = await getUserFindByPk(userId);

        if (!existingUser) {
            const error = new Error(`No se encontró el usuario con id ${userId}.`);
            error.statusCode = 400;
            throw error;
        };

        const subscription = await createSubscription(userId, level, duration, dateStart, dateEnd);

        return res.status(201).json(subscription);
    } catch (error) {
        next(error);
    };
};

module.exports = { createSubscription_Controllers };