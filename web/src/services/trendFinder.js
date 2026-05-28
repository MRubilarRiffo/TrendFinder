import axios from 'axios';

const host = import.meta.env.VITE_API_DROPISALES || import.meta.env.VITE_API_URL || 'http://localhost:3000/api/';

const api = axios.create({
    baseURL: host,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getTrendingProducts = async (days, country, sortBy, cursor) => {
    try {
        const params = new URLSearchParams();

        if (days) params.append('days', days);
        if (country) params.append('country', country);
        if (sortBy) params.append('sortBy', sortBy);
        if (cursor) params.append('cursor', cursor);
        
        params.append('limit', '10');

        const { data } = await api.get(`sales?${params.toString()}`);
        return data;
    } catch (error) {
        console.error('Error fetching trending products:', error);
        return { success: false, data: [] };
    }
}

export const getLatestProducts = async () => {
    try {
        const { data } = await api.get('products/latest?limit=20');
        return data;
    } catch (error) {
        console.error('Error fetching latest products:', error);
        return { success: false, data: [] };
    }
}

export const getProductStats = async (productId, startDate, endDate, country) => {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (country) params.append('country', country);

        const qs = params.toString();
        const { data } = await api.get(`products/stats/${productId}${qs ? `?${qs}` : ''}`);
        return data;
    } catch (error) {
        console.error('Error fetching product stats:', error);
        return { success: false, data: null };
    }
}