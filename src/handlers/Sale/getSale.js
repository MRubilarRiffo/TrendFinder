const { Sale } = require('../../infrastructure/config/database');
const { logMessage } = require('../../helpers/logMessage');

const getSale = async (props) => {
    try {
        if (!props) {
            throw new Error('Faltan parámetros para ejecutar la operación');
        };

        const sales = await Sale.findAll(props);

        if (!sales || sales.length === 0) {
            throw new Error('Ventas no encontradas');
        };

        return sales;
    } catch (error) {
        logMessage(`Error al buscar ventas: ${error.message}`);
        return { error: error.message };
    };
};

module.exports = { getSale };