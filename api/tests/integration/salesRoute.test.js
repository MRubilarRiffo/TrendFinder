const request = require('supertest');
const server = require('../../src/config/server');
const { resetTestDb, Product, Stock, SalesSnapshot } = require('../helpers/setupTestDb');

describe('Sales Route - Integration Tests (Strict)', () => {
    beforeEach(async () => {
        await resetTestDb();
    });

    describe('GET /api/sales Validation & Default State', () => {
        it('returns empty list when no snapshots exist for valid period', async () => {
            const res = await request(server).get('/api/sales?days=7');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.periodDays).toBe(7);
            expect(res.body.data).toEqual([]);
            expect(res.body.pagination).toEqual({ prevCursor: null, nextCursor: null });
        });

        it('returns 400 Bad Request when period is invalid (not 1, 7, 30)', async () => {
            const res = await request(server).get('/api/sales?days=15');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/Periodo inválido/i);
        });

        it('returns 400 Bad Request when sortBy is invalid', async () => {
            const res = await request(server).get('/api/sales?sortBy=hack_column');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/ordenamiento/i);
        });

        it('returns 400 Bad Request when country is invalid', async () => {
            const res = await request(server).get('/api/sales?country=Atlantis');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/País no válido/i);
        });

        it('returns 400 Bad Request when cursor is corrupted or invalid', async () => {
            const res = await request(server).get('/api/sales?cursor=not-a-valid-cursor-token');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/Cursor inválido/i);
        });
    });

    describe('GET /api/sales Sorting & Content', () => {
        it('returns snapshots sorted by totalProfit DESC by default', async () => {
            const p1 = await Product.create({ name: 'Prod Low Profit', country: 'Chile', sale_price: 10000 });
            const p2 = await Product.create({ name: 'Prod High Profit', country: 'Chile', sale_price: 20000 });

            await SalesSnapshot.create({
                ProductId: p1.id,
                periodDays: 7,
                totalProfit: 5000,
                totalQuantitySold: 10,
                totalRevenue: 50000,
                trendGrowth: 20
            });
            await SalesSnapshot.create({
                ProductId: p2.id,
                periodDays: 7,
                totalProfit: 25000,
                totalQuantitySold: 20,
                totalRevenue: 200000,
                trendGrowth: 80
            });

            const res = await request(server).get('/api/sales?days=7&sortBy=profit');

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(2);
            expect(res.body.data[0].name).toBe('Prod High Profit');
            expect(res.body.data[0].totalProfit).toMatch(/25\.000/);
            expect(res.body.data[1].name).toBe('Prod Low Profit');
        });
    });

    describe('GET /api/sales Cursor Pagination (Strict)', () => {
        it('paginates forward and backward without skipping or duplicating records', async () => {
            // Create 5 products and 5 snapshots with distinct profits
            const created = [];
            for (let i = 1; i <= 5; i++) {
                const p = await Product.create({ name: `Product ${i}`, country: 'Chile', sale_price: 1000 * i });
                const snap = await SalesSnapshot.create({
                    ProductId: p.id,
                    periodDays: 7,
                    totalProfit: 10000 * i, // P1: 10000, P2: 20000, P3: 30000, P4: 40000, P5: 50000
                    totalQuantitySold: i * 5,
                    totalRevenue: 20000 * i,
                    trendGrowth: 10 * i
                });
                created.push({ product: p, snapshot: snap });
            }

            // Page 1: limit = 2 (Should get P5, P4)
            const page1 = await request(server).get('/api/sales?days=7&sortBy=profit&limit=2');
            expect(page1.status).toBe(200);
            expect(page1.body.data.length).toBe(2);
            expect(page1.body.data[0].name).toBe('Product 5');
            expect(page1.body.data[1].name).toBe('Product 4');
            expect(page1.body.pagination.nextCursor).toBeDefined();

            const nextCursor = page1.body.pagination.nextCursor;

            // Page 2: with cursor (Should get P3, P2)
            const page2 = await request(server).get(`/api/sales?days=7&sortBy=profit&limit=2&cursor=${encodeURIComponent(nextCursor)}`);
            expect(page2.status).toBe(200);
            expect(page2.body.data.length).toBe(2);
            expect(page2.body.data[0].name).toBe('Product 3');
            expect(page2.body.data[1].name).toBe('Product 2');
            expect(page2.body.pagination.prevCursor).toBeDefined();

            const prevCursor = page2.body.pagination.prevCursor;

            // Navigate back to Page 1 using prevCursor
            const backToPage1 = await request(server).get(`/api/sales?days=7&sortBy=profit&limit=2&cursor=${encodeURIComponent(prevCursor)}`);
            expect(backToPage1.status).toBe(200);
            expect(backToPage1.body.data.length).toBe(2);
            expect(backToPage1.body.data[0].name).toBe('Product 5');
            expect(backToPage1.body.data[1].name).toBe('Product 4');
        });
    });
});
