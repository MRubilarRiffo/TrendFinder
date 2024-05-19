const { Product, Category, DailySale, Stock, Sale } = require("../config/database");

const includedClause = (included) => {
    const allowedIncluded = [
        { text: 'product', table: Product },
        { text: 'category', table: Category },
        { text: 'dailysale', table: DailySale },
        { text: 'stock', table: Stock },
        { text: 'sale', table: Sale },
    ];
    
    const selectedIncluded = included.split(',');

    const clause = selectedIncluded.map(item => {
        const found = allowedIncluded.find(({ text }) => text === item);
        if (found) {
            return found.table;
        } else {
            return null;
        };
    }).filter(item => item !== null);

    return clause;
};

module.exports = { includedClause };