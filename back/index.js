const server = require('./src/config/server');
const { conn } = require('./src/config/database');
const { logMessage } = require('./src/helpers/logMessage');
const { configCategory } = require('./src/config/configCategory');

const PORT = 3001;

conn.sync({ force: false })
    // .then(async () => {
    //     let sales = await conn.models.Sale.findAll();

    //     let repeatSales = {}
    //     for (const { ProductId, unitsSold } of sales) {
    //         if (repeatSales[ProductId]) {
    //             repeatSales[ProductId].repeat += 1;
    //             repeatSales[ProductId].totalSales += unitsSold;

    //         } else {
    //             repeatSales[ProductId] = { repeat: 1, totalSales: unitsSold };
    //         };
    //     };

    //     let salesArray = [];
    //     for (const key in repeatSales) {
    //         console.log("productId: ", key, " | repeat: ", repeatSales[key].repeat, " | totalSales: ", repeatSales[key].totalSales );
    //         salesArray.push({ ProductId: key, repeat: repeatSales[key].repeat, totalSales: repeatSales[key].totalSales })
    //     };
        
    //     await conn.models.CountSale.bulkCreate(salesArray);
    // })
    // .then(async () => {
    //     await configCategory();
    // })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });