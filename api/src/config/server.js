const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const errorMiddleware = require('../middleware/errorMiddleware');
const helmet = require('helmet');

const router = require('../routes');

const server = express();

server.set('trust proxy', 1);

server.use(morgan('dev'));
server.use(express.json());
server.use(cors());
server.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

server.use('/api', router);

// Handler 404 JSON para rutas inexistentes
server.use((req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

server.use(errorMiddleware);

module.exports = server;