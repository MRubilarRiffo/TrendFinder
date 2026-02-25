const { ProductSale, Product } = require('../../config/database');
const { Op } = require('sequelize');

const getSalesStatsHandler = async (days = 7, country = null) => {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const whereProduct = country ? { country } : {};

    const sales = await ProductSale.findAll({
        where: {
            saleDate: {
                [Op.gte]: dateLimit
            }
        },
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price'],
            where: whereProduct
        }],
        order: [['saleDate', 'DESC']]
    });

    const productStats = {};
    sales.forEach(sale => {
        if (!sale.Product) return;
        const productId = sale.Product.id;

        if (!productStats[productId]) {
            productStats[productId] = {
                productId: sale.Product.id,
                name: sale.Product.name,
                country: sale.Product.country,
                image: sale.Product.image,
                price: sale.Product.sale_price,
                totalQuantitySold: 0,
                totalRevenue: 0,
                salesHistory: []
            };
        }

        const revenue = sale.quantitySold * (parseFloat(sale.Product.sale_price) || 0);
        productStats[productId].totalQuantitySold += sale.quantitySold;
        productStats[productId].totalRevenue += revenue;
        productStats[productId].salesHistory.push({
            date: sale.saleDate,
            quantity: sale.quantitySold,
            revenue
        });
    });

    return {
        totalSalesRecords: sales.length,
        daysIncluded: days,
        data: Object.values(productStats).sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    };
};

module.exports = { getSalesStatsHandler };