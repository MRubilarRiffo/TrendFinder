const { Product } = require('../../db');

const getProducts_h = async (props) => {
    try {
        const products = await Product.findAll(props);

        if (!products || products.length === 0) return { error: 'Productos no encontrados' };
    
        return products;
    } catch (error) {
        return error.message;
    }
};

module.exports = { getProducts_h };