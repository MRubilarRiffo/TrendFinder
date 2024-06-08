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

export const getReviewsByProduct = (productId) => {
    return async function (dispatch) {
        try {
            const response = await axios.get(`${API}/reviews/${productId}`);
            return dispatch({ type: actionTypes.GET_REVIEWS_BY_PRODUCT, payload: response.data });
        } catch (error) {
            console.log(error.response.data);
        };
    };
};

export const getLeakedProducts = (filters) => {
    return async function (dispatch) {
        try {
            const limit = `limit=${filters.limit}`;
            const sortOrder = `sortOrder=${filters.sortOrder}`;
            const name = `name=${filters.name}`;
            const page = `page=${filters.page}`;
            const countries = `countries=${filters.countries.join(',')}`;
            if (filters.categories.length > 0) {
                var categories = `included=category:${filters.categories.join(':')}`;
            };
            const response = await axios.get(`${API}/products?${limit}&${sortOrder}&${name}&${page}&${countries}&${categories}`);
            return dispatch({ type: actionTypes.GET_LEAKED_PRODUCTS, payload: response.data });
        } catch (error) {
            console.log(error.response.data);
        };
    };
};