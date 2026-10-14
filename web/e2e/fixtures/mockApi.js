export async function setupMockApi(page) {
    await page.route('**/api/sales*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: [
                    {
                        productId: 'e2e-prod-1',
                        name: 'Depiladora Láser E2E',
                        country: 'Colombia',
                        price: '$ 45.000',
                        suggestedPriceCod: '$ 89.900',
                        unitProfitCod: '$ 24.500',
                        suggestedPricePrepaid: '$ 79.900',
                        unitProfitPrepaid: '$ 21.000',
                        totalQuantitySold: 150,
                        totalRevenue: '$ 13.485.000',
                        totalProfit: '$ 3.675.000',
                        trendGrowth: 45.5,
                        performanceRate: 85.0,
                        breakoutScore: 0,
                        dropScore: 92,
                        isBreakout: false,
                        isHighTicket: false,
                        isDeclining: false,
                        hasLowStock: false,
                        dailySales: [10, 15, 20, 25, 30]
                    }
                ],
                pagination: { prevCursor: null, nextCursor: null }
            })
        });
    });

    await page.route('**/api/products/latest*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: [
                    {
                        productId: 'e2e-prod-1',
                        name: 'Depiladora Láser E2E',
                        country: 'Colombia',
                        price: 45000,
                        stock: 120
                    }
                ]
            })
        });
    });

    await page.route('**/api/products/stats/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    dropiId: 'dropi-e2e-1',
                    name: 'Depiladora Láser E2E',
                    country: 'Colombia',
                    price: '$ 45.000',
                    stock: 120,
                    dropScore: 92,
                    suggestedPriceCod: '$ 89.900',
                    unitProfitCod: '$ 24.500',
                    suggestedPricePrepaid: '$ 79.900',
                    unitProfitPrepaid: '$ 21.000',
                    url: 'https://dropi.co/products/e2e-1',
                    salesInfo: {
                        totalQuantitySold: 150,
                        totalRevenue: '$ 13.485.000',
                        trendGrowthPercentage: 45.5,
                        maxDailySales: 30,
                        isBreakout: false
                    },
                    salesHistory: [
                        { date: '2026-03-01', quantity: 20 },
                        { date: '2026-03-02', quantity: 30 }
                    ]
                }
            })
        });
    });

    await page.route('**/api/products/search*', async (route) => {
        const url = new URL(route.request().url());
        const query = url.searchParams.get('q') || '';
        const country = url.searchParams.get('country') || 'Colombia';

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: [
                    {
                        productId: 'e2e-search-1',
                        name: `Producto E2E ${query}`,
                        country: country,
                        price: '$ 30.000',
                        suggestedPriceCod: '$ 65.000',
                        unitProfitCod: '$ 18.000',
                        suggestedPricePrepaid: '$ 55.000',
                        unitProfitPrepaid: '$ 15.000',
                        stock: 80
                    }
                ],
                pagination: {
                    totalMatches: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            })
        });
    });
}
