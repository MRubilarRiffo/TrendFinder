const { Product, Category, DailySale, Stock, Sale, CountSale  } = require("../config/database");
const { whereClause } = require("./whereClause");

const includedClause = (included) => {
    const allowedIncluded = [
        { text: 'product', table: Product },
        { text: 'category', table: Category },
        { text: 'dailysale', table: DailySale },
        { text: 'stock', table: Stock },
        { text: 'sale', table: Sale },
        { text: 'countsales', table: CountSale },
    ];
    
    const selectedIncluded = included.split(',');

    let clause = selectedIncluded.map(item => {
        let info = item.split(':');
        const modelText = info.shift();

        const found = allowedIncluded.find(({ text }) => text === modelText);
        if (found) {
            let where = {};
            if (info.length > 0) {
                const filters = { 
                    [found.text]: info
                }
                where = whereClause(filters);
            };

            return {
                model: found.table,
                where
            };
        } else {
            return null;
        };
    }).filter(item => item !== null);

    return clause;
};

module.exports = { includedClause };