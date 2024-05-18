const { getProductsRandom } = require("../../handlers/product/getProductsRandom");
const { splitImages } = require("../../helpers/splitImages");

const getProductsRandom_controllers = async (req, res, next) => {
    try {
        const countries = [ 'Chile', 'Colombia' ];
        // const countries = [ 'Chile' ];

        const limit = 5;

        let promisesDailySales = countries.map(async country => {
            const dailySales = await getProductsRandom(country, limit);
            let products;
            if (dailySales && dailySales.length > 0) {
                products = dailySales.map(({ Product }) => {
                    Product.image = splitImages(Product.image);

                    let sales = Product.Sales.map(sale => sale.unitsSold);

                    const sumSales = sales.reduce((acumulador, valorActual) => acumulador + valorActual, 0);

                    // console.log(sales);

                    return { id: Product.id, dropiId: Product.dropiId, name: Product.name, image: Product.image, country: Product.country, unitsSold: sumSales };
                });
            };

            return { country, products };
        });

        let products = await Promise.all(promisesDailySales);

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

module.exports = { getProductsRandom_controllers };