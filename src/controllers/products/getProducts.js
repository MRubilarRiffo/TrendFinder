const { getProducts_h } = require('../../handlers/product/getProducts_h');
const { whereClause } = require('../../helpers/whereClause');
const { getTotalProducts } = require('../../handlers/product/getTotalProducts');
const { includedClause } = require('../../helpers/includedClause');

const getProducts = async (req, res) => {
    try {
        const limit = 10;
        const currentPage = req.query.page > 0 ? req.query.page : 1;
        const offset = (currentPage - 1) * limit;
        
        const filters = {
            name: req.query.name,
            slug: req.query.slug,
            id: req.query.id
        };

        const where = whereClause(filters)

        const sortOrder = req.query.sortOrder || 'asc';
        let order = [
            [ 'name' , sortOrder === 'desc' ? 'DESC' : 'ASC' ]
        ];

        const allowedFields = [ 'id', 'name', 'description', 'shortDescription', 'price', 'priceOffert', 'slug', 'averageRating', 'immediateDelivery', 'image', 'category', 'bulkPrice', 'createdAt', 'updatedAt' ];
        const selectedFields = req.query.fields ? req.query.fields.split(',') : null;
        const attributes = selectedFields && selectedFields.filter(field => allowedFields.includes(field));

        const include = req.query.included ? includedClause(req.query.included) : [];
        
        const props = { where, order, limit, offset, attributes, include };

        const products = await getProducts_h(props);

        if (products.error) {
            return res.status(400).send(products.error);
        } else {
            const totalProducts = await getTotalProducts(props);

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
        };  
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener productos' });
    };
};

module.exports = { getProducts };