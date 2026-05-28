const productsRoutes = require('express').Router();

const limiterMiddleware = require('../middleware/limiterMiddleware');

const { getProductsStats } = require('../controllers/products/getProductsStats');
const { getLatestProducts } = require('../controllers/products/getLatestProducts');

// NOTA: Rutas fijas siempre van antes de las rutas con parámetros dinámicos (:id)
productsRoutes.get('/latest', limiterMiddleware, getLatestProducts);
productsRoutes.get('/stats/:id', limiterMiddleware, getProductsStats);

module.exports = productsRoutes;