const { Sequelize } = require('sequelize');

const orderClause = (sortOrder) => {
    let orderClause = [];
    let direction = 'ASC'; // Default sort order

    if (sortOrder === 'random') {
        orderClause.push(Sequelize.literal('RAND()'));
        return orderClause;
    }

    const sortOrderArray = sortOrder.split(',');

    if (sortOrderArray.length > 0) { 
        const column = sortOrderArray[0];

        if (sortOrderArray.length > 1) {
            direction = sortOrderArray[1].toUpperCase();
            if (direction !== 'DESC') { 
                direction = 'ASC'; 
            };
        };

        orderClause.push([column, direction]);
    };

    return orderClause;
};

module.exports = { orderClause };