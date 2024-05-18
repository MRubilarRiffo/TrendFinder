const productsRoutes = require('express').Router();

const { getProducts } = require('../controllers/products/getProducts');
const { createProduct_Controllers } = require('../controllers/products/createProduct_Controllers');
const { getProductById } = require('../controllers/products/getProductById');
const { getProductsRandom_controllers } = require('../controllers/products/getProductsRandom_controllers');

productsRoutes.post('/', createProduct_Controllers);
productsRoutes.get('/', getProducts);
productsRoutes.get('/random', getProductsRandom_controllers);
productsRoutes.get('/:id', getProductById);

module.exports = productsRoutes;