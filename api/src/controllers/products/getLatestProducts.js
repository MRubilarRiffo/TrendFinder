const { getLatestProductCatalogue } = require('../../domain/ProductCatalogue');
const { formatPrice } = require('../../functions/formatPrice');

const formatLatestProductsResponse = (catalogue) => {
    return catalogue.map(product => {
        const country = product.country;
        const financial = product.financialBreakdown;

        return {
            productId: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            price: formatPrice(product.rawPrice, country),
            rawPrice: product.rawPrice,
            
            suggestedPriceCod: formatPrice(financial.cod.suggestedPrice, country),
            unitProfitCod: formatPrice(financial.cod.weightedProfit, country),
            suggestedPricePrepaid: formatPrice(financial.prepaid.suggestedPrice, country),
            unitProfitPrepaid: formatPrice(financial.prepaid.netProfit, country),
            
            suggestedPrice: formatPrice(financial.cod.suggestedPrice, country),
            unitProfit: formatPrice(financial.cod.weightedProfit, country),
            
            stock: product.stock,
            url: product.url,
            addedAt: product.addedAt
        };
    });
};

const getLatestProducts = async (req, res, next) => {
    try {
        const { limit, country } = req.query;

        const catalogue = await getLatestProductCatalogue(limit, country);

        const formattedProducts = formatLatestProductsResponse(catalogue);

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