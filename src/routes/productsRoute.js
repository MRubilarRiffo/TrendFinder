const productsRoutes = require('express').Router();

const { getProducts } = require('../controllers/products/getProducts');
const { createProduct } = require('../controllers/products/createProduct');
const { getProductById } = require('../controllers/products/getProductById');

productsRoutes.get('/', getProducts);
productsRoutes.get('/:id', getProductById);
productsRoutes.post('/', createProduct);

module.exports = productsRoutes;