const { Product } = require('../../db');

const updateProducts_h = async (productId, updateProduct) => {
    try {
        const product = await Product.findByPk(productId);

        if (!product) return { success: false, error: 'Product not found' };
        
        await product.update(updateProduct);

        return { success: true, product };
    } catch (error) {
        return error.message;
    };
};

module.exports = { updateProducts_h };