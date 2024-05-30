const { Product, Sale, Stock, CountSale } = require('../../config/database');

const getProductFindByPk = async (productId) => {
    try {       
        const product = await Product.findByPk(productId, {
            include: [
                {
                    model: Sale,
                    attributes: ['unitsSold', 'createdAt'],
                },
                {
                    model: Stock,
                    attributes: ['quantity'],
                },
                {
                    model: CountSale,
                    attributes: ['totalSales'],
                }
        ],
        });

        return product;
    } catch (error) {
        throw error;
    };
};

module.exports = { getProductFindByPk };