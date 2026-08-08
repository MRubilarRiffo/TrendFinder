/**
 * Módulo de Cálculo Financiero y Determinación de Precios Sugeridos
 * Basado en las especificaciones de 'Cálculo Financiero.md'
 * Con parámetros independientes para Pago Anticipado y Pago Contra Entrega (COD).
 */

const DEFAULT_FINANCIAL_PARAMS = {
    // Modelo 1: Pago Anticipado
    shippingCostPrepaid: 5000,
    cpaPrepaid: 8000,
    desiredProfitPrepaid: 8000,
    commissionPctPrepaid: 0.06,      // 6%

    // Modelo 2: Pago Contra Entrega (COD)
    shippingCostCod: 8000,
    cpaCod: 4000,
    desiredProfitCod: 8000,
    deliveryRatePctCod: 0.70,        // 70%
    failedShippingCostCod: 8000
};

/**
 * Parsea y valida los parámetros de entrada desde req.query u objetos de configuración.
 * Soporta nombres específicos y retrocompatibilidad con nombres genéricos.
 * 
 * @param {Object} query - Objeto de consulta o parámetros enviados por el cliente
 * @returns {Object} Parámetros normalizados
 */
const parseFinancialParams = (query = {}) => {
    // Fallbacks genéricos por si el cliente envía cpa o desiredProfit globales
    const genericCpa = query.cpa !== undefined && !isNaN(parseFloat(query.cpa)) ? parseFloat(query.cpa) : null;
    const genericProfit = query.desiredProfit !== undefined && !isNaN(parseFloat(query.desiredProfit)) ? parseFloat(query.desiredProfit) : null;

    return {
        // --- Pago Anticipado ---
        shippingCostPrepaid: query.shippingCostPrepaid !== undefined && !isNaN(parseFloat(query.shippingCostPrepaid))
            ? parseFloat(query.shippingCostPrepaid)
            : DEFAULT_FINANCIAL_PARAMS.shippingCostPrepaid,

        cpaPrepaid: query.cpaPrepaid !== undefined && !isNaN(parseFloat(query.cpaPrepaid))
            ? parseFloat(query.cpaPrepaid)
            : (genericCpa !== null ? genericCpa : DEFAULT_FINANCIAL_PARAMS.cpaPrepaid),

        desiredProfitPrepaid: query.desiredProfitPrepaid !== undefined && !isNaN(parseFloat(query.desiredProfitPrepaid))
            ? parseFloat(query.desiredProfitPrepaid)
            : (genericProfit !== null ? genericProfit : DEFAULT_FINANCIAL_PARAMS.desiredProfitPrepaid),

        commissionPctPrepaid: query.commissionPctPrepaid !== undefined && !isNaN(parseFloat(query.commissionPctPrepaid))
            ? parseFloat(query.commissionPctPrepaid)
            : (query.commissionPct !== undefined && !isNaN(parseFloat(query.commissionPct))
                ? parseFloat(query.commissionPct)
                : DEFAULT_FINANCIAL_PARAMS.commissionPctPrepaid),

        // --- Pago Contra Entrega (COD) ---
        shippingCostCod: query.shippingCostCod !== undefined && !isNaN(parseFloat(query.shippingCostCod))
            ? parseFloat(query.shippingCostCod)
            : DEFAULT_FINANCIAL_PARAMS.shippingCostCod,

        cpaCod: query.cpaCod !== undefined && !isNaN(parseFloat(query.cpaCod))
            ? parseFloat(query.cpaCod)
            : (genericCpa !== null ? genericCpa : DEFAULT_FINANCIAL_PARAMS.cpaCod),

        desiredProfitCod: query.desiredProfitCod !== undefined && !isNaN(parseFloat(query.desiredProfitCod))
            ? parseFloat(query.desiredProfitCod)
            : (genericProfit !== null ? genericProfit : DEFAULT_FINANCIAL_PARAMS.desiredProfitCod),

        deliveryRatePctCod: query.deliveryRatePctCod !== undefined && !isNaN(parseFloat(query.deliveryRatePctCod))
            ? parseFloat(query.deliveryRatePctCod)
            : (query.deliveryRatePct !== undefined && !isNaN(parseFloat(query.deliveryRatePct))
                ? parseFloat(query.deliveryRatePct)
                : DEFAULT_FINANCIAL_PARAMS.deliveryRatePctCod),

        failedShippingCostCod: query.failedShippingCostCod !== undefined && !isNaN(parseFloat(query.failedShippingCostCod))
            ? parseFloat(query.failedShippingCostCod)
            : (query.failedShippingCost !== undefined && !isNaN(parseFloat(query.failedShippingCost))
                ? parseFloat(query.failedShippingCost)
                : DEFAULT_FINANCIAL_PARAMS.failedShippingCostCod),
    };
};

/**
 * Calcula el Precio Sugerido y Ganancias de Pago Anticipado y Contra Entrega (COD)
 * tomando como costo base el precio del producto (sale_price).
 * 
 * Garantiza que la ganancia neta final en ambos modelos sea EXACTAMENTE la ganancia limpia deseada.
 * 
 * @param {number} costPrice - Precio de costo base del producto (sale_price)
 * @param {Object} rawParams - Parámetros financieros opcionales
 * @returns {Object} Resultados numéricos exactos de las fórmulas
 */
const calculateSuggestedPrices = (costPrice, rawParams = {}) => {
    const cp = parseFloat(costPrice) || 0;
    const params = parseFinancialParams(rawParams);

    const {
        shippingCostPrepaid,
        cpaPrepaid,
        desiredProfitPrepaid,
        commissionPctPrepaid,

        shippingCostCod,
        cpaCod,
        desiredProfitCod,
        deliveryRatePctCod,
        failedShippingCostCod
    } = params;

    // --- 1. MODELO PAGO ANTICIPADO (E-commerce Tradicional) ---
    // Pv = (Cp + Ce + CPA + Gd) / (1 - %com)
    const subtotalPrepaid = cp + shippingCostPrepaid + cpaPrepaid + desiredProfitPrepaid;
    const denom = 1 - commissionPctPrepaid;
    const suggestedPricePrepaid = denom > 0 ? (subtotalPrepaid / denom) : subtotalPrepaid;
    const commissionAmount = suggestedPricePrepaid * commissionPctPrepaid;
    const netProfitPrepaid = suggestedPricePrepaid - cp - shippingCostPrepaid - cpaPrepaid - commissionAmount;

    // --- 2. MODELO PAGO CONTRA ENTREGA (COD / Dropi) ---
    // Para lograr una Ganancia Promedio Real Limpia (Bu) de EXACTAMENTE desiredProfitCod ($8.000):
    // Pérdida por devuelto = flete_falla + CPA
    // Tasa de falla = 1 - %efectividad
    // Margen por entregado requerido (Ge) = (Ganancia_Deseada + (Pérdida * Tasa_falla)) / %efectividad
    const failRatePct = 1 - deliveryRatePctCod;
    const lossPerFailed = failedShippingCostCod + cpaCod;
    const weightedLoss = lossPerFailed * failRatePct;

    const requiredDeliveredProfitCod = deliveryRatePctCod > 0
        ? ((desiredProfitCod + weightedLoss) / deliveryRatePctCod)
        : desiredProfitCod;

    const suggestedPriceCod = cp + shippingCostCod + cpaCod + requiredDeliveredProfitCod;
    const deliveredProfitCod = suggestedPriceCod - cp - shippingCostCod - cpaCod;
    const weightedProfitCod = (deliveredProfitCod * deliveryRatePctCod) - weightedLoss;

    return {
        costPrice: cp,
        prepaid: {
            suggestedPrice: Math.round(suggestedPricePrepaid * 100) / 100,
            commissionAmount: Math.round(commissionAmount * 100) / 100,
            netProfit: Math.round(netProfitPrepaid * 100) / 100
        },
        cod: {
            suggestedPrice: Math.round(suggestedPriceCod * 100) / 100,
            deliveredProfit: Math.round(deliveredProfitCod * 100) / 100,
            weightedProfit: Math.round(weightedProfitCod * 100) / 100  // Es EXACTAMENTE desiredProfitCod ($8.000)
        },
        params
    };
};

module.exports = {
    DEFAULT_FINANCIAL_PARAMS,
    parseFinancialParams,
    calculateSuggestedPrices
};
