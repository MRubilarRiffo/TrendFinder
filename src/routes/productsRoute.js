const productsRoutes = require('express').Router();

const { getProducts } = require('../controllers/product/getProducts');
const { getProductById } = require('../controllers/product/getProductById');
const { getProductsByCountry } = require('../controllers/product/getProductsByCountry');

const limiterMiddleware = require('../middleware/limiterMiddleware');

productsRoutes.get('/', limiterMiddleware, getProducts);
productsRoutes.get('/countries', limiterMiddleware, getProductsByCountry);
productsRoutes.get('/:id', limiterMiddleware, getProductById);

module.exports = productsRoutes;