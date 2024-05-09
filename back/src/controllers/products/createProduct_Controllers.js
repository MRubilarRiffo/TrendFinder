const { createProduct } = require('../../handlers/product/createProduct');
const { validations } = require('../../helpers/validations');

const createProduct_Controllers = async (req, res, next) => {
    try {
        const { name, id, stock, image, category } = req.body;

        const validationRules = {
            name: { type: 'string', required: true },
            id: { type: 'number', required: true },
            stock: { type: 'number', required: true, greaterThan: 0 },
            image: { type: 'string' },
            category: { type: 'string' }
        };
        
        const errors = validations({ name, id, stock, image, category }, validationRules );

        if (Object.keys(errors).length > 0) {
            const error = new Error('Se encontraron errores de validación.');
            error.statusCode = 400;
            error.validationErrors = errors
            throw error;
        };

        const queryOptions = { name, id, stock, image, category };
        
        const product = await createProduct(queryOptions);

        if (!product) {
            const error = new Error('Hubo un error al agregar el producto a la base de datos.');
            error.statusCode = 400;
            throw error;
        };

        return res.status(201).json({ data: product });
    } catch (error) {
        next(error);
    };
};

module.exports = { createProduct_Controllers };