const salesRoutes = require('express').Router();

const { getSalesStats } = require('../controllers/sales/salesController');
const limiterMiddleware = require('../middleware/limiterMiddleware');

salesRoutes.get('/', limiterMiddleware, getSalesStats);

module.exports = salesRoutes;