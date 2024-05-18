const { Product, Sale } = require('../../infrastructure/config/database');

const getProductFindByPk = async (productId) => {
    try {       
        const product = await Product.findByPk(productId, {
            include: [{
                model: Sale,
                attributes: ['unitsSold', 'createdAt'],
            }],
        });

        return product;
    } catch (error) {
        throw error;
    };
};

module.exports = { getProductFindByPk };