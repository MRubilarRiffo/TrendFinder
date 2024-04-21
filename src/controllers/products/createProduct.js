const { createProducts_h } = require('../../handlers/product/createProduct');

const createProduct = async (req, res, next) => {
    try {
        const { name, id, stock, image, category } = req.body;

        if (!name || !id || stock < 0) {
            throw Error('missing data for registration');
        }

        const props = { name, id, stock, image, category };
        
        const product = await createProducts_h(props);

        if (!product) {
            return res.status(400).send(product.error)
        } else {
            return res.status(201).json({ data: product.dataValues });
        };
    } catch (error) {
        return res.status(500).json({ error: error.message });
    };
};

module.exports = { createProduct };