const productsRoutes = require('express').Router();

const limiterMiddleware = require('../middleware/limiterMiddleware');

const { getProductsStats } = require('../controllers/products/getProductsStats');

productsRoutes.get('/stats/:id', limiterMiddleware, getProductsStats);

module.exports = productsRoutes;