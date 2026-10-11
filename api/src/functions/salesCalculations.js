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
        const sortedSales = [...productSales].sort((a, b) => new Date(a.saleDate || a.createdAt) - new Date(b.saleDate || b.createdAt));
        const firstSaleDate = new Date(sortedSales[0].saleDate || sortedSales[0].createdAt);
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

    if (!totalQuantitySold || totalQuantitySold <= 0) return 0;
    return parseFloat((totalQuantitySold / actualDaysEvaluated).toFixed(2));
};

/**
 * Calcula el porcentaje de crecimiento comparando las ventas recientes vs. las antiguas.
 * Aplica límites porcentuales razonables y suavizado para evitar números gigantescos distorsionados.
 * 
 * @param {number} recentSales - Cantidad de ventas en la mitad más reciente del periodo
 * @param {number} oldSales - Cantidad de ventas en la primera mitad del periodo
 * @returns {number} Crecimiento porcentual
 */
const calculateTrendGrowth = (recentSales, oldSales) => {
    if (!recentSales && !oldSales) return 0;

    let trendGrowth = 0;

    if (oldSales > 0) {
        trendGrowth = (((recentSales - oldSales) / oldSales) * 100);
    } else if (recentSales > 0) {
        // Para productos despegando desde 0 ventas, se usa una escala suavizada basada en aceleración
        // donde 1 venta = +100% y se aplica una escala logarítmica para volúmenes altos
        trendGrowth = 100 * (1 + Math.log10(recentSales));
    }

    // Limitar al rango máximo razonable en porcentaje [-99999.99, 99999.99]
    const MAX_PERCENTAGE = 99999.99;
    const MIN_PERCENTAGE = -99999.99;
    const cappedGrowth = Math.min(Math.max(trendGrowth, MIN_PERCENTAGE), MAX_PERCENTAGE);

    return parseFloat(cappedGrowth.toFixed(2));
};

/**
 * Evalúa si un producto está en despegue (Breakout) desde 0 ventas y calcula su score.
 * 
 * @param {number} recentSales - Ventas en la mitad reciente del periodo
 * @param {number} oldSales - Ventas en la mitad antigua del periodo
 * @param {number} daysInactive - Días aproximados que el producto estuvo sin ventas previas
 * @returns {Object} { isBreakout: boolean, breakoutScore: number }
 */
const calculateBreakoutMetrics = (recentSales, oldSales, daysInactive = 0) => {
    // Un producto entra en Despegue (Breakout) si no tuvo ventas en la primera mitad
    // y logró al menos un umbral mínimo de ventas recientes (ej. >= 2 unidades)
    const MIN_BREAKOUT_SALES = 2;
    const isBreakout = oldSales === 0 && recentSales >= MIN_BREAKOUT_SALES;

    let breakoutScore = 0;
    if (isBreakout) {
        // Pondera las ventas recientes con los días de inactividad previos (factor logarítmico)
        const inactivityFactor = 1 + Math.log10(Math.max(1, daysInactive));
        breakoutScore = parseFloat((recentSales * inactivityFactor).toFixed(2));
    }

    return { isBreakout, breakoutScore };
};

/**
 * Calcula el DropScore Global (0 a 100)
 * 
 * @param {Object} params - Parámetros de ventas
 * @param {number} params.salePrice - Costo del producto
 * @param {number} params.suggestedPriceCod - Precio sugerido COD
 * @param {number} params.trendGrowth - Crecimiento de tendencia
 * @param {number} params.totalQuantitySold - Cantidad total vendida
 * @param {number} params.periodDays - Días del periodo evaluado
 * @param {boolean} params.isBreakout - Si está en despegue
 * @returns {number} Score de 0 a 100
 */
const calculateDropScore = ({ salePrice, suggestedPriceCod, trendGrowth, totalQuantitySold, periodDays, isBreakout }) => {
    const marginCod = suggestedPriceCod > 0 ? (suggestedPriceCod - salePrice) / suggestedPriceCod : 0;
    const pPerf = Math.min(100, Math.max(0, (marginCod - 0.2) / 0.6 * 100));
    
    const trendGrowthVal = parseFloat(trendGrowth) || 0;
    const pGrowth = trendGrowthVal <= 0 ? 0 : Math.min(100, (trendGrowthVal / 150) * 100);
    
    const period = parseInt(periodDays) || 7;
    const dailyAverageSales = (parseInt(totalQuantitySold) || 0) / period;
    const pVol = Math.min(100, (dailyAverageSales / 15) * 100);
    
    let computedScore = (pPerf * 0.35) + (pVol * 0.35) + (pGrowth * 0.30);
    
    if (Boolean(isBreakout)) {
        computedScore += 15;
    }
    
    return Math.min(100, Math.max(0, Math.round(computedScore)));
};

/**
 * Aplica Winsorization / Recorte Robusto a un array de ventas diarias.
 * Detecta picos aislados extremos (outliers estadísticos) que superan el límite
 * intercuartil respecto al comportamiento habitual del producto y los acota,
 * protegiendo a los algoritmos y métricas de distorsiones por ajustes de stock.
 * Los productos ganadores con ventas consistentes altas no se ven afectados.
 *
 * @param {Array<number>} dailySales - Array con las ventas diarias del periodo
 * @param {Object} [options] - Opciones de configuración
 * @param {number} [options.minOutlierThreshold=30] - Umbral mínimo para considerar un valor como posible anomalía
 * @param {number} [options.iqrMultiplier=3] - Multiplicador del rango intercuartil para la valla superior
 * @returns {Array<number>} Array de ventas diarias winsorizado
 */
const winsorizeDailySales = (dailySales = [], options = {}) => {
    if (!Array.isArray(dailySales) || dailySales.length < 4) {
        return Array.isArray(dailySales) ? [...dailySales] : [];
    }

    const { minOutlierThreshold = 30, iqrMultiplier = 3 } = options;

    const values = dailySales.map(v => Math.max(0, parseInt(v, 10) || 0));
    const sorted = [...values].sort((a, b) => a - b);

    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const upperFence = Math.max(15, q3 + (iqrMultiplier * Math.max(1, iqr)));

    return values.map(val => {
        if (val > minOutlierThreshold && val > upperFence) {
            return upperFence;
        }
        return val;
    });
};

module.exports = {
    calculateSalesAverage,
    calculateTrendGrowth,
    calculateBreakoutMetrics,
    calculateDropScore,
    winsorizeDailySales
};