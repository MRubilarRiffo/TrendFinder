const mailsRoutes = require('express').Router();

const { sendMail } = require('../controllers/mail/sendMail');

const limiterMiddleware = require('../middleware/limiterMiddleware');
const verifyTokenMiddleware = require('../middleware/verifyTokenMiddleware');


mailsRoutes.post('/send-mail', limiterMiddleware, sendMail);



module.exports = mailsRoutes;