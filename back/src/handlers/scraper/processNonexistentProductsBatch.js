const { getCategoryFindAll } = require('../../handlers/category/getCategoryFindAll');
const { createBulkProduct } = require('../../handlers/product/createBulkProduct');
const { Stock } = require('../../config/database');
const { logMessage } = require('../../helpers/logMessage');

const { validateDropiProduct } = require('../../helpers/scraper/dropiValidator');
const { compareCategories, convertirString, updateImages, updateStores } = require('../../helpers/scraper/dropiUtils');

/**
 * Inserta masivamente los productos que el scraper identificó como **nuevos**.
 * Establece su inventario inicial y sus categorías correspondientes haciendo un match con el diccionario.
 */
const processNonexistentProductsBatch = async (nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country) => {
    let nonexistentProductsCreating = nonexistentProducts.map(({ id, name, stock, gallery, categories, description, sale_price, suggested_price, warehouses, updated_at, created_at }) => {
        stock = parseInt(stock);

        try {
            validateDropiProduct(id, name, stock);
        } catch (error) {
            logMessage(`Error al validar producto nuevo (${name}): ${error.message}`);
            return null;
        }

        const stores = updateStores(warehouses);
        // NOTA: Para no romper la integridad enviamos 'null' para que la función de utils decida usar las variables de entorno después.
        // Pero en la nueva arquitectura lo mejor será inyectarlo completo con el configS3 de ser necesario por parámetro si Trendfinder lo soporta global.
        const image = updateImages(gallery, DROPI_IMG_URL, null);
        const url = `${DROPI_DETAILS_PRODUCTS}${id}/${convertirString(name)}`;

        let productUpdateDate = updated_at ? updated_at : created_at;

        return { id, name, stock, image, categories, description, sale_price, suggested_price, url, country, stores, productUpdateDate };
    });

    nonexistentProductsCreating = nonexistentProductsCreating.filter(item => item);

    try {
        const createNonexistentProducts = await createBulkProduct(nonexistentProductsCreating);

        let categoriesArray = await getCategoryFindAll();

        const idsAndStocks = createNonexistentProducts.map(async product => {
            const correspondingProduct = nonexistentProductsCreating.find(item => item.id == product.dropiId);

            let findCategory = correspondingProduct.categories.map(category => {
                let categoryInstance = categoriesArray.find(({ name }) => compareCategories(name, category.name));
                if (!categoryInstance) {
                    categoryInstance = categoriesArray.find(({ name }) => name == 'Otros');
                }
                return categoryInstance;
            });

            findCategory = await Promise.all(findCategory);

            let setFindCategory = [...new Set(findCategory)].filter(item => item);

            await Promise.all([
                product.addCategory(setFindCategory),
                Stock.create({ ProductId: product.id, quantity: correspondingProduct.stock })
            ]);

            return true;
        });

        await Promise.all(idsAndStocks);
    } catch (error) {
        throw error;
    }
};

module.exports = { processNonexistentProductsBatch };