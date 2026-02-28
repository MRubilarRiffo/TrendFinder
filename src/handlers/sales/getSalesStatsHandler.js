const { ProductSale, Product } = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Handler de Ventas: Exclusivamente extrae los registros de Base de Datos.
 * 
 * @param {number|string} days - Días hacia atrás a consultar.
 * @param {string|null} country - Filtra las ventas por país.
 * @param {string|null} startDate - Fecha inicio de rango.
 * @param {string|null} endDate - Fecha límite de rango.
 * @returns {Promise<Object>} Regresa las transacciones brutas { sales, daysEvaluated, midDateLimit }
 */
const getSalesStatsHandler = async (days = 7, country = null, startDate = null, endDate = null) => {
    let dateLimit = new Date();
    let daysInt = parseInt(days);
    let endLimit = new Date();
    if (startDate) {
        dateLimit = new Date(startDate);
        if (endDate) {
            endLimit = new Date(endDate);
            endLimit.setHours(23, 59, 59, 999);
        }

        // Recalcular los días para el midDateLimit si hay fechas específicas
        const diffTime = Math.abs(endLimit - dateLimit);
        daysInt = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    } else {
        dateLimit.setDate(dateLimit.getDate() - daysInt);
    }

    // Para calcular velocidad de tendencia, dividimos el periodo a la mitad
    const midDateLimit = new Date(dateLimit.getTime() + ((endLimit.getTime() - dateLimit.getTime()) / 2));

    const whereProduct = country ? { country } : {};

    const sales = await ProductSale.findAll({
        where: {
            saleDate: {
                [Op.between]: [dateLimit, endLimit]
            }
        },
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price', 'suggested_price'],
            where: whereProduct
        }],
        order: [['saleDate', 'ASC']] // Ordenamos ASC para construir el historial cronológico
    });

    return {
        sales,
        daysEvaluated: daysInt,
        midDateLimit
    };
};

module.exports = { getSalesStatsHandler };