const { logMessage } = require("../../helpers/logMessage");
const { DailySale } = require("../../infrastructure/config/database");

const getDailySale = async (queryOptions) => {
    try {
        if (!queryOptions) {
            throw new Error('Falta el parametro "queryOptions"');
        };

        const reportSale = await DailySale.findAll(queryOptions);

        if (!reportSale) {
            throw new Error('Reporte no encontrado');
        };

        return reportSale;
    } catch (error) {
        logMessage(`Error al obtener reporte de ventas diarias: ${error.message}`);
        return { error: error.message };
    }
};

module.exports = { getDailySale };