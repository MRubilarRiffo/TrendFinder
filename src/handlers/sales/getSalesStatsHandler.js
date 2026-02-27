const { ProductSale, Product } = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Obtiene y procesa las estadísticas de ventas de productos basadas en caídas de stock.
 * 
 * @param {number|string} days - Cantidad de días hacia atrás a consultar (default: 7).
 * @param {string|null} country - Filtra las ventas por país. Opcional.
 * @returns {Promise<Object>} Resultado con el listado de productos y sus métricas:
 *  - totalSalesRecords: {number} Cantidad de registros de venta brutos hallados.
 *  - daysIncluded: {number} Segmento de tiempo evaluado.
 *  - data: {Array<Object>} Lista de productos ordenados por mayor rentabilidad (totalProfit).
 *      - data[].productId: {number} ID BD.
 *      - data[].name: {string} Nombre y modelo.
 *      - data[].price: {number} Precio de venta al dropshipper (Costo Base).
 *      - data[].suggestedPrice: {number} Precio de venta al público recomendado.
 *      - data[].unitProfit: {number} Ganancia neta (suggestedPrice - price) por cada unidad.
 *      - data[].totalQuantitySold: {number} Unidades totales inferidas como vendidas en el periodo.
 *      - data[].totalRevenue: {number} Recaudación bruta generada a nivel costo.
 *      - data[].totalProfit: {number} Ganancia total potencial (unitProfit * totalQuantitySold).
 *      - data[].trendGrowthInfo: {Object} Indicadores de aceleración de tendencia. 
 *          - growthPercentage: {number} % de crecimiento comparando mitades del periodo.
 *          - isTrendingUp: {boolean} True si vendió más en los días recientes que en los antiguos.
 *      - data[].salesHistory: {Array<Object>} Array para graficar de unidades y ganancia agrupadas YYYY-MM-DD.
 */
const getSalesStatsHandler = async (days = 7, country = null) => {
    const daysInt = parseInt(days);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysInt);

    // Para calcular velocidad de tendencia, dividimos el periodo a la mitad
    const midDateLimit = new Date();
    midDateLimit.setDate(midDateLimit.getDate() - Math.floor(daysInt / 2));

    const whereProduct = country ? { country } : {};

    const sales = await ProductSale.findAll({
        where: {
            saleDate: {
                [Op.gte]: dateLimit
            }
        },
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price', 'suggested_price'],
            where: whereProduct
        }],
        order: [['saleDate', 'ASC']] // Ordenamos ASC para construir el historial cronológico
    });

    const productStats = {};

    sales.forEach(sale => {
        if (!sale.Product) return;
        const productId = sale.Product.id;

        const salePrice = parseFloat(sale.Product.sale_price) || 0;
        const suggestedPrice = parseFloat(sale.Product.suggested_price) || 0;

        // Ganancia Bruta Real por unidad
        const unitProfit = suggestedPrice > salePrice ? (suggestedPrice - salePrice) : 0;
        const totalProfitSale = unitProfit * sale.quantitySold;
        const revenueSale = salePrice * sale.quantitySold;

        if (!productStats[productId]) {
            productStats[productId] = {
                productId: sale.Product.id,
                name: sale.Product.name,
                country: sale.Product.country,
                image: sale.Product.image,
                price: salePrice,
                suggestedPrice: suggestedPrice,
                unitProfit: unitProfit,
                totalQuantitySold: 0,
                totalRevenue: 0,
                totalProfit: 0,
                salesHistory: {},
                recentSalesCount: 0, // Ventas en la segunda mitad del periodo
                oldSalesCount: 0      // Ventas en la primera mitad del periodo
            };
        }

        const pStats = productStats[productId];

        // Sumatorias Totales
        pStats.totalQuantitySold += sale.quantitySold;
        pStats.totalRevenue += revenueSale;
        pStats.totalProfit += totalProfitSale;

        // Distribución para cálculo de tendencia (Trend Score)
        if (sale.saleDate >= midDateLimit) {
            pStats.recentSalesCount += sale.quantitySold;
        } else {
            pStats.oldSalesCount += sale.quantitySold;
        }

        // Agrupación por Día (YYYY-MM-DD)
        const dateKey = sale.saleDate.toISOString().split('T')[0];

        if (!pStats.salesHistory[dateKey]) {
            pStats.salesHistory[dateKey] = {
                date: dateKey,
                quantity: 0,
                revenue: 0,
                profit: 0
            };
        }

        pStats.salesHistory[dateKey].quantity += sale.quantitySold;
        pStats.salesHistory[dateKey].revenue += revenueSale;
        pStats.salesHistory[dateKey].profit += totalProfitSale;
    });

    // Formatear la salida final
    const finalData = Object.values(productStats).map(p => {
        // Cálculo de Score de Tendencia
        // Si no tuvo ventas en la primera mitad, y vendió en la segunda, crecimiento infinito (lo limitamos a un máximo o consideramos "Hot")
        let trendGrowth = 0;
        if (p.oldSalesCount > 0) {
            trendGrowth = ((p.recentSalesCount - p.oldSalesCount) / p.oldSalesCount) * 100;
        } else if (p.recentSalesCount > 0) {
            trendGrowth = 100; // Producto nuevo que acaba de despegar
        }

        return {
            ...p,
            trendGrowthInfo: {
                growthPercentage: Math.round(trendGrowth),
                isTrendingUp: trendGrowth > 0,
                isDying: trendGrowth < -20 // Si caen más de un 20%
            },
            // Convertimos el diccionario de historial a un array ordenado
            salesHistory: Object.values(p.salesHistory).sort((a, b) => new Date(a.date) - new Date(b.date))
        };
    });

    // Ordenar por Ganancia Total Potencial (lo que más le importa a un dropshipper) 
    // y luego por Cantidad Vendida.
    finalData.sort((a, b) => {
        if (b.totalProfit !== a.totalProfit) {
            return b.totalProfit - a.totalProfit;
        }
        return b.totalQuantitySold - a.totalQuantitySold;
    });

    return {
        totalSalesRecords: sales.length,
        daysIncluded: daysInt,
        data: finalData
    };
};

module.exports = { getSalesStatsHandler };