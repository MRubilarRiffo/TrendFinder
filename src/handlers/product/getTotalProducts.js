const { Product } = require('../../db');

const getTotalProducts = async (props) => {
    try {
        const totalProducts = await Product.count(props);

        return totalProducts;
    } catch (error) {
        return error;
    };
};

module.exports = { getTotalProducts };