const productsRoutes = require('express').Router();

const { getProducts } = require('../controllers/products/getProducts');
const { createProduct_Controllers } = require('../controllers/products/createProduct_Controllers');
const { getProductById } = require('../controllers/products/getProductById');

productsRoutes.get('/', getProducts);
productsRoutes.get('/:id', getProductById);
productsRoutes.post('/', createProduct_Controllers);

module.exports = productsRoutes;