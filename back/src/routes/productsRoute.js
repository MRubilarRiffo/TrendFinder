const productsRoutes = require('express').Router();

const { getProducts } = require('../controllers/product/getProducts');
const { createProduct_Controllers } = require('../controllers/product/createProduct_Controllers');
const { getProductById } = require('../controllers/product/getProductById');
const { getProductsByCountry } = require('../controllers/product/getProductsByCountry');

const limiterMiddleware = require('../middleware/limiterMiddleware');
const verifyTokenMiddleware = require('../middleware/verifyTokenMiddleware');

productsRoutes.post('/', limiterMiddleware, verifyTokenMiddleware, createProduct_Controllers);
productsRoutes.get('/', limiterMiddleware, verifyTokenMiddleware, getProducts);
productsRoutes.get('/countries', limiterMiddleware, verifyTokenMiddleware, getProductsByCountry);
productsRoutes.get('/:id', limiterMiddleware, verifyTokenMiddleware, getProductById);

module.exports = productsRoutes;