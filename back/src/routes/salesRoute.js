const salesRoutes = require('express').Router();

const { getSale_Controller } = require('../controllers/sale/getSale');

salesRoutes.get('/', getSale_Controller);

module.exports = salesRoutes;