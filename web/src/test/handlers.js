import { http, HttpResponse } from 'msw';

export const mockTrendingProducts = [
    {
        productId: 'prod-101',
        name: 'Depiladora Láser IPL',
        country: 'Colombia',
        price: '$ 45.000',
        suggestedPriceCod: '$ 89.900',
        unitProfitCod: '$ 24.500',
        suggestedPricePrepaid: '$ 79.900',
        unitProfitPrepaid: '$ 21.000',
        totalQuantitySold: 120,
        totalRevenue: '$ 10.788.000',
        totalProfit: '$ 2.940.000',
        trendGrowth: 45.5,
        performanceRate: 85.2,
        breakoutScore: 0,
        dropScore: 88,
        isBreakout: false,
        isHighTicket: false,
        isDeclining: false,
        hasLowStock: false,
        stock: 150,
        dailySales: [10, 15, 20, 18, 25, 22, 30]
    },
    {
        productId: 'prod-102',
        name: 'Reloj Smartwatch Ultra',
        country: 'Chile',
        price: '$ 12.000',
        suggestedPriceCod: '$ 29.990',
        unitProfitCod: '$ 9.500',
        suggestedPricePrepaid: '$ 26.990',
        unitProfitPrepaid: '$ 8.000',
        totalQuantitySold: 45,
        totalRevenue: '$ 1.349.550',
        totalProfit: '$ 427.500',
        trendGrowth: -12.3,
        performanceRate: 62.0,
        breakoutScore: 18.5,
        dropScore: 65,
        isBreakout: true,
        isHighTicket: true,
        isDeclining: false,
        hasLowStock: true,
        stock: 12,
        dailySales: [2, 5, 8, 12, 10, 9, 8]
    }
];

export const mockLatestProducts = [
    {
        productId: 'prod-201',
        name: 'Humidificador Ultrasónico LED',
        country: 'Colombia',
        price: 32000,
        stock: 80,
        image: 'https://via.placeholder.com/200'
    }
];

export const mockProductStats = {
    dropiId: 'dropi-999',
    name: 'Depiladora Láser IPL',
    country: 'Colombia',
    price: '$ 45.000',
    stock: 150,
    dropScore: 88,
    isHighTicket: false,
    isDeclining: false,
    hasLowStock: false,
    suggestedPriceCod: '$ 89.900',
    unitProfitCod: '$ 24.500',
    suggestedPricePrepaid: '$ 79.900',
    unitProfitPrepaid: '$ 21.000',
    url: 'https://dropi.co/products/999',
    salesInfo: {
        totalQuantitySold: 120,
        totalRevenue: '$ 10.788.000',
        trendGrowthPercentage: 45.5,
        maxDailySales: 30,
        isBreakout: false
    },
    salesHistory: [
        { date: '2026-03-01', quantity: 10 },
        { date: '2026-03-02', quantity: 15 },
        { date: '2026-03-03', quantity: 20 },
        { date: '2026-03-04', quantity: 18 },
        { date: '2026-03-05', quantity: 25 },
        { date: '2026-03-06', quantity: 22 },
        { date: '2026-03-07', quantity: 30 }
    ]
};

export const handlers = [
    // GET /api/sales
    http.get('*/api/sales', ({ request }) => {
        const url = new URL(request.url);
        const sortBy = url.searchParams.get('sortBy');
        
        return HttpResponse.json({
            success: true,
            data: mockTrendingProducts,
            pagination: {
                prevCursor: null,
                nextCursor: 'next-cursor-token'
            },
            meta: { sortBy }
        });
    }),

    // GET /api/products/latest
    http.get('*/api/products/latest', () => {
        return HttpResponse.json({
            success: true,
            data: mockLatestProducts
        });
    }),

    // GET /api/products/stats/:id
    http.get('*/api/products/stats/:id', ({ params }) => {
        const { id } = params;
        if (id === 'error-id') {
            return HttpResponse.json({ success: false, data: null }, { status: 404 });
        }

        return HttpResponse.json({
            success: true,
            data: {
                ...mockProductStats,
                dropiId: id
            }
        });
    }),

    // GET /api/products/search
    http.get('*/api/products/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q') || '';
        const country = url.searchParams.get('country');
        const page = Number(url.searchParams.get('page')) || 1;

        if (query.toLowerCase().includes('nada')) {
            return HttpResponse.json({
                success: true,
                data: [],
                pagination: {
                    totalMatches: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        }

        return HttpResponse.json({
            success: true,
            data: [
                {
                    productId: 'search-1',
                    name: `Producto con término ${query}`,
                    country: country || 'Colombia',
                    price: '$ 25.000',
                    suggestedPriceCod: '$ 59.900',
                    unitProfitCod: '$ 15.000',
                    suggestedPricePrepaid: '$ 49.900',
                    unitProfitPrepaid: '$ 12.000',
                    stock: 45
                }
            ],
            pagination: {
                totalMatches: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: page > 1
            }
        });
    })
];
