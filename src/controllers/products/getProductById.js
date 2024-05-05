const { getProductFindByPk } = require("../../handlers/product/getProductFindByPk");
const { validations } = require("../../helpers/validations");

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const validationRules = {
            id: { required: true },
        };
        
        const errors = validations({ id }, validationRules);

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.statusCode = 400;
            error.validationErrors = errors
            throw error;
        };

        const product = await getProductFindByPk(id);

        if (!product) {
            const error = new Error(`No se encontró el producto ${id}`);
            error.statusCode = 400;
            throw error;
        };

        return res.json(product);
    } catch (error) {
        next(error);
    };
};

module.exports = { getProductById };