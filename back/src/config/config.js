require('dotenv').config();

const config = {
    db_user: process.env.DB_USER,
    db_password: process.env.DB_PASSWORD,
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_name: process.env.DB_NAME,
    jwt_secret: process.env.JWT_SECRET,
    dropi_categories: process.env.DROPI_CATEGORIES.split(','),
    dropi_img_urls3: process.env.DROPI_IMG_URLS3,
    dropi_country: [
        {
            country: 'Colombia',
            dropi_token: process.env.DROPI_CO_TOKEN,
            dropi_api_products: process.env.DROPI_CO_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_CO_IMG_URL,
            dropi_details_products: process.env.DROPI_CO_DETAILS_PRODUCTS,
        },
        {
            country: 'Chile',
            dropi_token: process.env.DROPI_CL_TOKEN,
            dropi_api_products: process.env.DROPI_CL_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_CL_IMG_URL,
            dropi_details_products: process.env.DROPI_CL_DETAILS_PRODUCTS,
        },
        {
            country: 'España',
            dropi_token: process.env.DROPI_ES_TOKEN,
            dropi_api_products: process.env.DROPI_ES_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_ES_IMG_URL,
            dropi_details_products: process.env.DROPI_ES_DETAILS_PRODUCTS,
        },
        {
            country: 'Perú',
            dropi_token: process.env.DROPI_PE_TOKEN,
            dropi_api_products: process.env.DROPI_PE_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_PE_IMG_URL,
            dropi_details_products: process.env.DROPI_PE_DETAILS_PRODUCTS,
        },
        {
            country: 'Ecuador',
            dropi_token: process.env.DROPI_EC_TOKEN,
            dropi_api_products: process.env.DROPI_EC_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_EC_IMG_URL,
            dropi_details_products: process.env.DROPI_EC_DETAILS_PRODUCTS,
        },
        {
            country: 'Panamá',
            dropi_token: process.env.DROPI_PA_TOKEN,
            dropi_api_products: process.env.DROPI_PA_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_PA_IMG_URL,
            dropi_details_products: process.env.DROPI_PA_DETAILS_PRODUCTS,
        },
        {
            country: 'México',
            dropi_token: process.env.DROPI_MX_TOKEN,
            dropi_api_products: process.env.DROPI_MX_API_PRODUCTS,
            dropi_img_url: process.env.DROPI_MX_IMG_URL,
            dropi_details_products: process.env.DROPI_MX_DETAILS_PRODUCTS,
        },
    ]
};

module.exports = { config };