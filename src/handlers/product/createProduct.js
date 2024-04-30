const { Product } = require('../../infrastructure/config/database');

const createProduct = async (props) => {
    try {
        const createProduct = await Product.create(props);

        return createProduct;
    } catch (error) {
        return error.message;
    };
};

module.exports = { createProduct };