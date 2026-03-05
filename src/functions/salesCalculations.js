/**
 * Calcula el promedio de ventas diario basado en los días reales que el producto
 * ha estado activo si su historial de ventas empezó después del inicio del rango evaluado.
 * 
 * @param {Object} params - Parámetros para calcular el promedio
 * @param {number} params.totalQuantitySold - Cantidad total de productos vendidos
 * @param {number} params.daysEvaluated - Rango de días del periodo a evaluar (ej. 30 días)
 * @param {Array} params.productSales - Array del historial de ventas del producto (para ver primera venta)
 * @param {Date} params.start - Objeto Date con el inicio del rango evaluado
 * @param {Date} params.end - Objeto Date con el término del rango evaluado
 * @param {Date|string} params.createdAt - Fecha de creación del producto como respaldo
 * @returns {number} Promedio de ventas calculado con 2 decimales
 */
const calculateSalesAverage = ({ totalQuantitySold, daysEvaluated, productSales = [], start, end, createdAt = null }) => {
    let actualDaysEvaluated = daysEvaluated || 1;

    // Si el producto tiene ventas y la primera venta fue posterior a la fecha de 'start',
    // limitamos los días evaluados a la vida útil real que ha tenido el producto en el análisis.
    if (productSales && productSales.length > 0) {
        const firstSaleDate = new Date(productSales[0].saleDate || productSales[0].createdAt);
        if (firstSaleDate > start) {
            const effectiveTimeDiff = end.getTime() - firstSaleDate.getTime();
            actualDaysEvaluated = Math.max(1, Math.ceil(effectiveTimeDiff / (1000 * 3600 * 24)));
        }
    } else if (createdAt) {
        // Como fallback alternativo, usamos la fecha de creación del producto 
        const createdAtDate = new Date(createdAt);
        if (createdAtDate > start) {
            const effectiveTimeDiff = end.getTime() - createdAtDate.getTime();
            actualDaysEvaluated = Math.max(1, Math.ceil(effectiveTimeDiff / (1000 * 3600 * 24)));
        }
    }

    return parseFloat((totalQuantitySold / actualDaysEvaluated).toFixed(2));
};

/**
 * Calcula el porcentaje de crecimiento comparando las ventas recientes vs. las antiguas.
 * Maneja adecuadamente el crecimiento a partir de 0 ventas.
 * 
 * @param {number} recentSales - Cantidad de ventas en la mitad más reciente del periodo
 * @param {number} oldSales - Cantidad de ventas en la primera mitad del periodo
 * @returns {number} Crecimiento porcentual
 */
const calculateTrendGrowth = (recentSales, oldSales) => {
    let trendGrowth = 0;

    if (oldSales > 0) {
        trendGrowth = parseFloat((((recentSales - oldSales) / oldSales) * 100).toFixed(2));
    } else if (recentSales > 0) {
        // Multiplica las ventas directas cuando no hubo un registro anterior
        trendGrowth = parseFloat((recentSales * 100).toFixed(2));
    }

    return trendGrowth;
};

module.exports = {
    calculateSalesAverage,
    calculateTrendGrowth
};