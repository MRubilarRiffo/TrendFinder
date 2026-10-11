const { conn, Product, Stock, Category, ProductSale, SalesSnapshot } = require('../../src/config/database');

const resetTestDb = async () => {
    await conn.sync({ force: true });
};

const closeTestDb = async () => {
    await conn.close();
};

module.exports = {
    conn,
    Product,
    Stock,
    Category,
    ProductSale,
    SalesSnapshot,
    resetTestDb,
    closeTestDb
};
