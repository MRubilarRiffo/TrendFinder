require('dotenv').config();

const config = {
    db_user: process.env.DB_USER,
    db_password: process.env.DB_PASSWORD,
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_name: process.env.DB_NAME,
    dropi_categories: process.env.DROPI_CATEGORIES.split(','),
    dropi_img_urls3: process.env.DROPI_IMG_URLS3,
    dropi_country: [
        {
            country: 'Chile',
            dropi_token: process.env.DROPI_CL_TOKEN,
            dropi_api_products: process.env.DROPI_CL_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_CL_IMG_URL,
            dropi_details_products: process.env.DROPI_CL_DETAILS_PRODUCTS,
        },
        {
            country: 'Colombia',
            dropi_token: process.env.DROPI_CO_TOKEN,
            dropi_api_products: process.env.DROPI_CO_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_CO_IMG_URL,
            dropi_details_products: process.env.DROPI_CO_DETAILS_PRODUCTS,
        },
    ]
};

module.exports = { config };