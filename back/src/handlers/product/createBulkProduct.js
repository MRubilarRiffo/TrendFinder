const { Product } = require('../../config/database');

const createBulkProduct = async (products) => {
    try {
        const queryOptions = products.map(product => ({
            dropiId: product.id,
            name: product.name,
            image: product.image,
            description: product.description,
            sale_price: product.sale_price,
            url: product.url,
            country: product.country,
            stores: product.stores,
            productUpdateDate: product.productUpdateDate,
            suggested_price: product.suggested_price
        }));

        const createdProducts = await Product.bulkCreate(queryOptions);

        return createdProducts;
    } catch (error) {
        throw error;
    };
};

module.exports = { createBulkProduct };