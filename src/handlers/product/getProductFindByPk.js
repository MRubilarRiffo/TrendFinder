const { Product } = require('../../infrastructure/config/database');

const getProductFindByPk = async (productId) => {
    try {
        const product = await Product.findByPk(productId);
        return product;
    } catch (error) {
        return error.message;
    };
};

module.exports = { getProductFindByPk };