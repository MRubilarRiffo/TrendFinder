const { getProductsFindAll } = require('../../handlers/product/getProductsFindAll');
const { whereClause } = require('../../helpers/whereClause');
const { getTotalProducts } = require('../../handlers/product/getTotalProducts');
const { includedClause } = require('../../helpers/includedClause');
const { splitImages } = require('../../helpers/splitImages');
const { orderClause } = require('../../helpers/orderClause');

const getProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const currentPage = req.query.page > 0 ? req.query.page : 1;
        const offset = (currentPage - 1) * limit;
        
        const filters = {
            name: req.query.name,
            slug: req.query.slug,
            id: req.query.productId,
            country: req.query.country,
            limit: req.query.limit
        };

        let where = whereClause(filters);

        const sortOrder = req.query.sortOrder || 'id,asc';
        let order = orderClause(sortOrder);

        const allowedFields = [ 'id', 'name', 'description', 'shortDescription', 'price', 'priceOffert', 'slug', 'averageRating', 'immediateDelivery', 'image', 'category', 'bulkPrice', 'createdAt', 'updatedAt' ];
        const selectedFields = req.query.fields ? req.query.fields.split(',') : null;
        const attributes = selectedFields && selectedFields.filter(field => allowedFields.includes(field));

        const include = req.query.included ? includedClause(req.query.included) : [];
        
        const queryOptions = { where, order, limit, offset, attributes, include };

        let products = await getProductsFindAll(queryOptions);

        if (!products) {
            const error = new Error('No se encontraron productos en la base de datos.');
            error.statusCode = 400;
            throw error;
        };

        products = products.map(product => {
            product.image = splitImages(product.image);
            return product
        });

        const totalProducts = await getTotalProducts(queryOptions);
        const totalPages = Math.ceil(totalProducts / limit);

        const response = {
            Metadata: {
                'Total Products': totalProducts,
                'Total Pages': totalPages,
                'Current Page': currentPage
            },
            Data: products
        };

        return res.json(response);
    } catch (error) {
        next(error);
    };
};

module.exports = { getProducts };