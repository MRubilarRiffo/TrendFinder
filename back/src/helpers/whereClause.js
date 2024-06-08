const { Op } = require('sequelize');

const whereClause = (filters) => {
    const whereClause = {};

    if (filters.name) {
        let name = filters.name;

        name = name = '%' + name.toLowerCase() + '%';

        whereClause.name = {
            [Op.like]: name
        };
    };

    if (filters.productId) {
        whereClause.id = parseInt(filters.productId);
    };

    if (filters.UserId) {
        whereClause.UserId = parseInt(filters.UserId);
    };

    if (filters.slug) {
        whereClause.slug = filters.slug;
    };

    if (filters.country) {
        const countries = filters.country.split(',');
        whereClause.country = { [Op.in]: countries };
    };

    if (filters.category) {
        whereClause.id = filters.category;
    };

    if (filters.countsales) {
        console.log(filters.countsales);
        whereClause.totalSales = {
            [Op.gte]: filters.countsales[0],
        };
    };


    return whereClause;
};

module.exports = { whereClause };