const { getProductsRandom } = require("../../handlers/product/getProductsRandom");
const { splitImages } = require("../../helpers/splitImages");

const getProductsByCountry = async (req, res, next) => {
    try {
        const { countries } = req.query;

        const countriesArray = countries.split(',');

        const limit = 10;

        let promisesCountSales = countriesArray.map(async country => {
            const countSales = await getProductsRandom(country, limit);
            let products = [];
            if (countSales && countSales.length > 0) {
                products = countSales.map(({ Product, totalSales }) => {
                    Product.image = splitImages(Product.image);

                    return {
                        id: Product.id,
                        dropiId: Product.dropiId,
                        name: Product.name,
                        image: Product.image,
                        country: Product.country,
                        unitsSold: totalSales
                    };
                });
            };
            return { country, products };
        });

        let products = await Promise.all(promisesCountSales);

        products = products.filter(item => item.products.length > 0);

        if (products.length === 0) {
            const error = new Error(`No se encontraron productos.`);
            error.statusCode = 400;
            throw error;
        };

        return res.json(products);
    } catch (error) {
        next(error);
    };
};

module.exports = { getProductsByCountry };