const productsRoutes = require('express').Router();

const { getProducts } = require('../controllers/product/getProducts');
const { createProduct_Controllers } = require('../controllers/product/createProduct_Controllers');
const { getProductById } = require('../controllers/product/getProductById');
const { getProductsByCountry } = require('../controllers/product/getProductsByCountry');

productsRoutes.post('/', createProduct_Controllers);
productsRoutes.get('/', getProducts);
productsRoutes.get('/countries', getProductsByCountry);
productsRoutes.get('/:id', getProductById);

module.exports = productsRoutes;