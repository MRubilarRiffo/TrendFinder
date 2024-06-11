import axios from 'axios';
import * as actionTypes from './actions-type';

const API = 'http://localhost:3001';
// const API = 'https://api.innovoza.com/api';

export const getProductsByCountry = (countriesActive) => {
    return async function (dispatch) {
        try {
            const countriesName = countriesActive.map(country => country.name).toString();
            const response = await axios.get(`${API}/products/countries?countries=${countriesName}`);
            return dispatch({ type: actionTypes.GET_PRODUCTS_RANDOM_BY_COUNTRY, payload: response.data });
        } catch (error) {
            console.log(error.response.data);
        };
    };
};

export const getDetails = (id) => {
    return async function (dispatch) {
        try {
            const response = await axios.get(`${API}/products/${id}`);
            return dispatch({ type: actionTypes.GET_DETAILS, payload: response.data });
        } catch (error) {
            console.log(error.response.data);
        };
    };
};

export const getLeakedProducts = (filters) => {
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


            const response = await axios.get(`${API}/products?${query}&${included}`);
            return dispatch({ type: actionTypes.GET_LEAKED_PRODUCTS, payload: response.data });
        } catch (error) {
            console.log(error.response.data);
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
            return dispatch({ type: actionTypes.USER_SESSION, payload: {} });
        }
    };
};