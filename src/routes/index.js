const { Router } = require('express');
const productsRoutes = require('./productsRoute');

const router = Router();

router.use('/products', productsRoutes);

module.exports = router;