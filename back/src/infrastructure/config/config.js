require('dotenv').config();

const config = {
    db_user: process.env.DB_USER,
    db_password: process.env.DB_PASSWORD,
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_name: process.env.DB_NAME,
    jwt_secret: process.env.JWT_SECRET
};

module.exports = { config };