const { Product } = require('../../db');

const getProductFindByPk = async (productId) => {
    try {
        const product = await Product.findByPk(productId);
        return product;
    } catch (error) {
        return error.message;
    };
};

module.exports = { getProductFindByPk };