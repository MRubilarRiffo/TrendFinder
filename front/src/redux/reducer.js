import * as actionTypes from './actions-type';

const initialState = {
    products: [],
    details: {},
    reviewProduct: [],
    productsByCountry: [],
    leakedProducts: [],
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
        default:
            return state;
    };
};

export { reducer };