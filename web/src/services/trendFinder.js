import axios from 'axios';

const host = import.meta.env.VITE_API_DROPISALES || import.meta.env.VITE_API_URL || 'http://localhost:3000/api/';

const api = axios.create({
    baseURL: host,
    headers: {
        'Content-Type': 'application/json',
    },
});

const appendFinancialParams = (params, financialParams) => {
    if (!financialParams) return;
    Object.keys(financialParams).forEach(key => {
        if (financialParams[key] !== undefined && financialParams[key] !== null) {
            params.append(key, financialParams[key]);
        }
    });
};

export const getTrendingProducts = async (days, country, sortBy, cursor, financialParams = null) => {
    try {
        const params = new URLSearchParams();

        if (days) params.append('days', days);
        if (country) params.append('country', country);
        if (sortBy) params.append('sortBy', sortBy);
        if (cursor) params.append('cursor', cursor);
        
        appendFinancialParams(params, financialParams);
        params.append('limit', '10');

        const { data } = await api.get(`sales?${params.toString()}`);
        return data;
    } catch (error) {
        console.error('Error fetching trending products:', error);
        return { success: false, data: [] };
    }
}

export const getLatestProducts = async (financialParams = null) => {
    try {
        const params = new URLSearchParams();
        params.append('limit', '20');
        appendFinancialParams(params, financialParams);

        const { data } = await api.get(`products/latest?${params.toString()}`);
        return data;
    } catch (error) {
        console.error('Error fetching latest products:', error);
        return { success: false, data: [] };
    }
}

export const getProductStats = async (productId, startDate, endDate, country, financialParams = null) => {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (country) params.append('country', country);

        appendFinancialParams(params, financialParams);

        const qs = params.toString();
        const { data } = await api.get(`products/stats/${productId}${qs ? `?${qs}` : ''}`);
        return data;
    } catch (error) {
        console.error('Error fetching product stats:', error);
        return { success: false, data: null };
    }
}