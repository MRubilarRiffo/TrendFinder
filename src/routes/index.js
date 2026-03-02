const { Router } = require('express');

const salesRoutes = require('./salesRoute');
const productsRoutes = require('./productsRoute');

const router = Router();

router.use('/sales', salesRoutes);
router.use('/products', productsRoutes);

module.exports = router;