const { getProductFindByPk } = require("../../handlers/product/getProductFindByPk");

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(id);

        const product = await getProductFindByPk(id);

        if (product.error) {
            return res.status(400).send(product.error);
        } else {
            return res.json(product);
        };
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener el producto' });
    };
};

module.exports = { getProductById };