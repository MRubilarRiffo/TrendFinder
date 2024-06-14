const mailsRoutes = require('express').Router();

const { sendMail } = require('../controllers/mail/sendMail');
const { sendCode } = require('../controllers/mail/sendCode');

const limiterMiddleware = require('../middleware/limiterMiddleware');

mailsRoutes.post('/send-mail', limiterMiddleware, sendMail);
mailsRoutes.post('/send-code', limiterMiddleware, sendCode);



module.exports = mailsRoutes;