const usersRoutes = require('express').Router();

const { createUser_Controller } = require('../controllers/user/createUser_Controller');
const { loginUser } = require('../controllers/user/loginUser');
const { verifyToken } = require('../controllers/user/verifyToken');

const limiterMiddleware = require('../middleware/limiterMiddleware');
const verifyTokenMiddleware = require('../middleware/verifyTokenMiddleware');


usersRoutes.post('/register', limiterMiddleware, createUser_Controller);
usersRoutes.post('/login', limiterMiddleware, loginUser);
usersRoutes.post('/verify-token', limiterMiddleware, verifyTokenMiddleware, verifyToken);



module.exports = usersRoutes;