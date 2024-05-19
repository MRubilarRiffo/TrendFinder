const { logMessage } = require("../../helpers/logMessage");
const { DailySale } = require("../../config/database");

const getDailySale = async (queryOptions) => {
    try {
        if (!queryOptions) {
            const error = new Error('Faltan opciones de consulta para realizar la busqueda.');
            throw error;
        };

        const reportSale = await DailySale.findAll(queryOptions);

        if (!reportSale) {
            const error = new Error('No hay ventas disponibles.');
            throw error;
        };

        return reportSale;
    } catch (error) {
        throw error;
    }
};

module.exports = { getDailySale };