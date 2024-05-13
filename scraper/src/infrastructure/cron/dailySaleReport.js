const { Op } = require("sequelize");
const { getSale } = require("../../handlers/Sale/getSale");
const { sumSale } = require("../../handlers/Sale/sumSale");
const { createDailySale } = require("../../handlers/Sale/createDailySale");
const { logMessage } = require("../../helpers/logMessage");

const dailySaleReport = async () => {
    logMessage('Reporte diario iniciado');
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const whereDate = {
        [Op.gte]: yesterday,
        [Op.lt]: today
    };
    
    const queryOptions = {
        attributes: [ 'ProductId' ],
        group: [ 'ProductId' ],
        where: {
            createdAt: whereDate
        }
    };

    try {
        const sales = await getSale(queryOptions);
            
        const salesPromises = sales.map(async ({ ProductId }) => {
            const totalUnitsSold = await sumSale(ProductId, whereDate);
            await createDailySale(ProductId, totalUnitsSold, yesterday);
            return totalUnitsSold;
        });
    
        await Promise.all(salesPromises);
    } catch (error) {
        logMessage(`Error en el informe diario de ventas: ${error.message}`);
        if (error.validationErrors) {
            logMessage(JSON.stringify(error.validationErrors));
        };
    };
    logMessage('Reporte diario terminado');
};

module.exports = { dailySaleReport };