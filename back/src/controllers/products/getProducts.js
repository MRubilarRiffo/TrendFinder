const { getProductsFindAll } = require('../../handlers/product/getProductsFindAll');
const { whereClause } = require('../../helpers/whereClause');
const { getTotalProducts } = require('../../handlers/product/getTotalProducts');
const { includedClause } = require('../../helpers/includedClause');

const getProducts = async (req, res, next) => {
    try {
        const limit = 10;
        const currentPage = req.query.page > 0 ? req.query.page : 1;
        const offset = (currentPage - 1) * limit;
        
        const filters = {
            name: req.query.name,
            slug: req.query.slug,
            id: req.query.productId,
            country: req.query.country
        };

        const where = whereClause(filters);

        const sortOrder = req.query.sortOrder || 'asc';
        let order = [
            [ 'id' , sortOrder === 'desc' ? 'DESC' : 'ASC' ]
        ];

        const allowedFields = [ 'id', 'name', 'description', 'shortDescription', 'price', 'priceOffert', 'slug', 'averageRating', 'immediateDelivery', 'image', 'category', 'bulkPrice', 'createdAt', 'updatedAt' ];
        const selectedFields = req.query.fields ? req.query.fields.split(',') : null;
        const attributes = selectedFields && selectedFields.filter(field => allowedFields.includes(field));

        const include = req.query.included ? includedClause(req.query.included) : [];
        
        const queryOptions = { where, order, limit, offset, attributes, include };

        const products = await getProductsFindAll(queryOptions);

        if (!products) {
            const error = new Error('No se encontraron productos en la base de datos.');
            error.statusCode = 400;
            throw error;
        };

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