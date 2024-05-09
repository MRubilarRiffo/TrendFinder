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

    if (filters.id) {
        whereClause.id = parseInt(filters.id);
    };

    if (filters.UserId) {
        whereClause.UserId = parseInt(filters.UserId);
    };

    if (filters.slug) {
        whereClause.slug = filters.slug;
    };

    return whereClause;
};

module.exports = { whereClause };