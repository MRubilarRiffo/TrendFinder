const { Op } = require("sequelize");
const { getSale } = require("../../handlers/Sale/getSale");
const { sumSale } = require("../../handlers/Sale/sumSale");

const dailySaleReport = async () => {
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const props = {
        attributes: [ 'ProductId' ],
        group: [ 'ProductId' ],
        where: {
            createdAt: {
                [Op.gte]: currentDate
            }
        }
    };

    const sales = await getSale(props);

    const sale = await sumSale(3222, currentDate);

    console.log(sale);

    // const salesPromises = sales.map(async ({ ProductId }) => {
    //     const sale = await sumSale(ProductId, currentDate);

    //     return sale;
    // });

    // await Promise.all(salesPromises);
    console.log(sales.length);
};

module.exports = { dailySaleReport };