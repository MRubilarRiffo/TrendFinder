import axios from 'axios';
import * as actionTypes from './actions-type';

const API = 'http://localhost:3001';
// const API = 'https://api.innovoza.com/api';

const errorMapping = {
    TOKEN_EXPIRED: 'Token expirado.',
    TOKEN_INVALID_OR_EXPIRED: 'Token inválido o sin fecha de expiración.',
    TOKEN_INVALID: 'Token inválido.',
    TOKEN_NO_PROVIDED_OR_INVALID: 'Token no proporcionado o formato inválido.',
    CREDENTIALS_INVALID: 'Credenciales inválidas.',
};

export const getProductsByCountry = (countriesActive, token) => {
    return async function (dispatch) {
        try {
            const countriesName = countriesActive.map(country => country.name).toString();

            const response = await axios({
                method: 'GET',
                url: `${API}/products/countries?countries=${countriesName}`,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return dispatch({ type: actionTypes.GET_PRODUCTS_RANDOM_BY_COUNTRY, payload: response.data });
        } catch (error) {
            const err = error.response.data.error;
            if (err === errorMapping.TOKEN_EXPIRED || err === errorMapping.TOKEN_INVALID_OR_EXPIRED || err === errorMapping.TOKEN_INVALID || err === errorMapping.TOKEN_NO_PROVIDED_OR_INVALID) {
                return dispatch({
                    type: actionTypes.USER_SESSION,
                    payload: {
                        status: 'failed',
                        message: err,
                    },
                });
            };
        };
    };
};

export const getDetails = (token, id) => {
    return async function (dispatch) {
        try {
            const response = await axios({
                method: 'GET',
                url: `${API}/products/${id}`,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return dispatch({ type: actionTypes.GET_DETAILS, payload: response.data });
        } catch (error) {
            const err = error.response.data.error;
            if (err === errorMapping.TOKEN_EXPIRED || err === errorMapping.TOKEN_INVALID_OR_EXPIRED || err === errorMapping.TOKEN_INVALID || err === errorMapping.TOKEN_NO_PROVIDED_OR_INVALID) {
                return dispatch({
                    type: actionTypes.USER_SESSION,
                    payload: {
                        status: 'failed',
                        message: err,
                    },
                });
            };
        };
    };
};

export const getLeakedProducts = (filters, token) => {
    return async function (dispatch) {
        try {
            let query = '';
            const limit = `limit=${filters.limit}`;
            const sortOrder = `sortOrder=${filters.sortOrder}`;
            const name = `name=${filters.name}`;
            const page = `page=${filters.page}`;

            query += `${limit}&${sortOrder}&${name}&${page}`;

            if (filters.countries.length > 0) {
                const countries = `countries=${filters.countries.join(',')}`;
                query += `&${countries}`;
            };

            let included = 'included=';
            const countsales = `countsales:${filters.sales}:${filters.repeat}`;

            included += `${countsales}`

            if (filters.categories.length > 0) {
                const categories = `category:${filters.categories.join(':')}`;
                included += `,${categories}`
            };

            const response = await axios({
                method: 'GET',
                url: `${API}/products?${query}&${included}`,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return dispatch({ type: actionTypes.GET_LEAKED_PRODUCTS, payload: response.data });
        } catch (error) {
            const err = error.response.data.error;
            if (err === errorMapping.TOKEN_EXPIRED || err === errorMapping.TOKEN_INVALID_OR_EXPIRED || err === errorMapping.TOKEN_INVALID || err === errorMapping.TOKEN_NO_PROVIDED_OR_INVALID) {
                return dispatch({
                    type: actionTypes.USER_SESSION,
                    payload: {
                        status: 'failed',
                        message: err,
                    },
                });
            };
        };
    };
};

export const userSession = (mail, password) => {
    return async function (dispatch) {
        try {
            const response = await axios.post(`${API}/users/login`, { email: mail, password });
            return dispatch({ type: actionTypes.USER_SESSION, payload: response.data });
        } catch (error) {
            console.log(error.response.data);
        };
    };
};

export const verifyToken = (token) => {
    return async function (dispatch) {
        try {
            const response = await axios.post(`${API}/users/verify-token`, null, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return;
        } catch (error) {
            const err = error.response.data.error;
            if (err === errorMapping.TOKEN_EXPIRED || err === errorMapping.TOKEN_INVALID_OR_EXPIRED || err === errorMapping.TOKEN_INVALID || err === errorMapping.TOKEN_NO_PROVIDED_OR_INVALID) {
                return dispatch({
                    type: actionTypes.USER_SESSION,
                    payload: {
                        status: 'failed',
                        message: err,
                    },
                });
            };
        };
    };
};