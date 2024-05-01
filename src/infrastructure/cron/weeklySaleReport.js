const { Op } = require("sequelize");
const { logMessage } = require("../../helpers/logMessage");
const { getDailySale } = require("../../handlers/Sale/getDailySale");
const { sumSale } = require("../../handlers/Sale/sumSale");
const { createWeeklySale } = require("../../handlers/Sale/createWeeklySale");

const weeklySaleReport = async () => {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    let lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const whereDate = {
        [Op.gte]: lastWeekStart,
        [Op.lt]: lastWeekEnd
    };

    const queryOptions = {
        attributes: [ 'ProductId' ],
        group: [ 'ProductId' ],
        where: {
            date: whereDate
        }
    };

    try {
        const report = await getDailySale(queryOptions);

        const salesPromises = report.map(async ({ ProductId }) => {
            const totalUnitsSold = await sumSale(ProductId, whereDate);
            await createWeeklySale(ProductId, totalUnitsSold, lastWeekStart, lastWeekEnd);
            return totalUnitsSold;
        });

        await Promise.all(salesPromises);
    } catch (error) {
        logMessage(`Error en el informe semanal de ventas: ${error.message}`);
    }
};

module.exports = { weeklySaleReport };