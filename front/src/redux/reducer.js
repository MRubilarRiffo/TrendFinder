import * as actionTypes from './actions-type';

const initialState = {
    products: [],
    details: {},
    reviewProduct: [],
    productsByCountry: [],
    leakedProducts: [],
    filters: {
        name: '',
        limit: 0,
        sortOrder: 'id,desc',
        page: 1,
        countries: [],
        categories: [],
        sales: 200,
        repeat: 200
    },
    user: {
        status: null,
        message: '',
        name: '',
        email: '',
        token: ''
    },
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.GET_PRODUCTS_RANDOM_BY_COUNTRY:
            return {
                ...state,
                productsByCountry: action.payload
            };
        case actionTypes.GET_PRODUCTS:
            return {
                ...state,
                products: action.payload
            };
        case actionTypes.GET_DETAILS:
            return {
                ...state,
                details: action.payload
            };
        case actionTypes.RESET_DETAILS:
            return {
                ...state,
                details: []
            };
        case actionTypes.GET_REVIEWS_BY_PRODUCT:
            return {
                ...state,
                reviewProduct: action.payload
            };
        case actionTypes.RESET_REVIEWS_BY_PRODUCT:
            return {
                ...state,
                reviewProduct: []
            };
        case actionTypes.GET_LEAKED_PRODUCTS:
            return {
                ...state,
                leakedProducts: action.payload
            };
        case actionTypes.RESET_LEAKED_PRODUCTS:
            return {
                ...state,
                leakedProducts: []
            };
        case actionTypes.FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload
                }
            };
        case actionTypes.RESET_FILTERS:
            return {
                ...state,
                filters: initialState.filters
            };
        case actionTypes.USER_SESSION:
            const userData = {
                ...state.user,
                ...action.payload 
            };
            localStorage.setItem('user', JSON.stringify(userData)); // Guardamos en localStorage
            return {
                ...state,
                user: userData
            };
        default:
            return state;
    };
};

export { reducer };