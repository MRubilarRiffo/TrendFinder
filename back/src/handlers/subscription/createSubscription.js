const { validations } = require("../../helpers/validations");
const { Subscription } = require("../../infrastructure/config/database");

const createSubscription = async (userId, level, duration, dateStart, dateEnd) => {
    try {
        const validationRules = {
            userId: { required: true },
            level: { type: 'string', required: true },
            duration: { type: 'number', required: true },
            dateStart: { required: true },
            dateEnd: { required: true }
        };
        
        const errors = validations({ userId, level, duration, dateStart, dateEnd }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.validationErrors = errors;
            throw error;
        };

        const queryOptions = { UserId: userId, level, duration, dateStart, dateEnd };

        const subscription = await Subscription.create(queryOptions);

        return subscription;
    } catch (error) {
        throw error;
    };
};

module.exports = { createSubscription };