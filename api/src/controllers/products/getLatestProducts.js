const { getLatestProductsFromDb } = require('../../handlers/products/getLatestProductsFromDb');
const { formatPrice } = require('../../functions/formatPrice');
const { calculateSuggestedPrices } = require('../../functions/financialCalculations');

const getLatestProducts = async (req, res, next) => {
    try {
        const { limit, country } = req.query;

        // Llamada al Handler para obtener de DB
        const products = await getLatestProductsFromDb(limit, country);

        // Formatear JSON response (Lógica de Negocio)
        const formattedProducts = products.map(product => {
            const currentStock = product.Stock ? product.Stock.quantity : 0;
            const salePrice = parseFloat(product.sale_price) || 0;
            const financial = calculateSuggestedPrices(salePrice, req.query);

            const country = product.country;

            return {
                productId: product.id,
                dropiId: product.dropiId,
                name: product.name,
                country: product.country,
                image: product.image,
                price: formatPrice(salePrice, country),
                rawPrice: salePrice,
                suggestedPriceCod: formatPrice(financial.cod.suggestedPrice, country),
                unitProfitCod: formatPrice(financial.cod.weightedProfit, country),
                suggestedPricePrepaid: formatPrice(financial.prepaid.suggestedPrice, country),
                unitProfitPrepaid: formatPrice(financial.prepaid.netProfit, country),
                suggestedPrice: formatPrice(financial.cod.suggestedPrice, country),
                unitProfit: formatPrice(financial.cod.weightedProfit, country),
                stock: currentStock,
                url: product.url,
                addedAt: product.createdAt
            };
        });

        return res.status(200).json({
            success: true,
            totalReturned: formattedProducts.length,
            data: formattedProducts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getLatestProducts };