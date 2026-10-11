const request = require('supertest');
const server = require('../../src/config/server');
const { resetTestDb, Product, Stock, ProductSale } = require('../helpers/setupTestDb');

describe('Products Route - Integration Tests (Strict)', () => {
    beforeEach(async () => {
        await resetTestDb();
    });

    describe('GET /api/products/latest', () => {
        it('returns empty array when no products exist', async () => {
            const res = await request(server).get('/api/products/latest');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.totalReturned).toBe(0);
            expect(res.body.data).toEqual([]);
        });

        it('returns latest products ordered by createdAt DESC with stock and formatted prices', async () => {
            const p1 = await Product.create({
                name: 'Producto Uno',
                dropiId: 101,
                country: 'Chile',
                sale_price: 10000,
                suggested_price: 25000,
                createdAt: new Date('2026-01-01T10:00:00Z')
            });
            await Stock.create({ ProductId: p1.id, quantity: 45 });

            const p2 = await Product.create({
                name: 'Producto Dos',
                dropiId: 102,
                country: 'Chile',
                sale_price: 20000,
                suggested_price: 45000,
                createdAt: new Date('2026-01-02T10:00:00Z')
            });
            await Stock.create({ ProductId: p2.id, quantity: 12 });

            const res = await request(server).get('/api/products/latest');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.totalReturned).toBe(2);

            // Latest product (p2) should be first
            const firstItem = res.body.data[0];
            expect(firstItem.productId).toBe(p2.id);
            expect(firstItem.name).toBe('Producto Dos');
            expect(firstItem.stock).toBe(12);
            expect(firstItem.rawPrice).toBe(20000);
            expect(firstItem.price).toMatch(/20\.000/);
            expect(firstItem.suggestedPriceCod).toBeDefined();
            expect(firstItem.unitProfitCod).toBeDefined();

            const secondItem = res.body.data[1];
            expect(secondItem.productId).toBe(p1.id);
            expect(secondItem.stock).toBe(45);
        });

        it('filters correctly by country and respects limit parameter', async () => {
            const pChile = await Product.create({ name: 'Chile Prod', country: 'Chile', sale_price: 10000 });
            await Stock.create({ ProductId: pChile.id, quantity: 10 });

            const pCol1 = await Product.create({ name: 'Col Prod 1', country: 'Colombia', sale_price: 15000 });
            await Stock.create({ ProductId: pCol1.id, quantity: 20 });

            const pCol2 = await Product.create({ name: 'Col Prod 2', country: 'Colombia', sale_price: 25000 });
            await Stock.create({ ProductId: pCol2.id, quantity: 30 });

            const res = await request(server).get('/api/products/latest?country=Colombia&limit=1');

            expect(res.status).toBe(200);
            expect(res.body.totalReturned).toBe(1);
            expect(res.body.data[0].country).toBe('Colombia');
            expect(res.body.data[0].productId).toBe(pCol2.id);
        });

        it('returns 400 Bad Request when an invalid country is provided', async () => {
            const res = await request(server).get('/api/products/latest?country=Atlantis');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/País no válido/i);
        });

        it('clamps limit to maximum of 50 to prevent DoS by memory', async () => {
            // Create 55 products
            for (let i = 1; i <= 55; i++) {
                const p = await Product.create({ name: `Prod ${i}`, country: 'Chile', sale_price: 1000 * i });
                await Stock.create({ ProductId: p.id, quantity: i });
            }

            const res = await request(server).get('/api/products/latest?limit=1000');

            expect(res.status).toBe(200);
            expect(res.body.totalReturned).toBe(50);
            expect(res.body.data.length).toBe(50);
        });
    });

    describe('GET /api/products/stats/:id', () => {
        it('returns 400 Bad Request when id is not a positive integer (e.g. abc or negative)', async () => {
            const resAlpha = await request(server).get('/api/products/stats/abc');
            expect(resAlpha.status).toBe(400);
            expect(resAlpha.body.success).toBe(false);
            expect(resAlpha.body.error).toMatch(/ID de producto/i);

            const resNeg = await request(server).get('/api/products/stats/-5');
            expect(resNeg.status).toBe(400);
            expect(resNeg.body.success).toBe(false);

            const resZero = await request(server).get('/api/products/stats/0');
            expect(resZero.status).toBe(400);
            expect(resZero.body.success).toBe(false);
        });

        it('returns 400 Bad Request when date range is invalid (startDate > endDate or bad format)', async () => {
            const p = await Product.create({ name: 'Prod Dates', country: 'Chile', sale_price: 10000 });
            await Stock.create({ ProductId: p.id, quantity: 5 });

            const resInverted = await request(server).get(`/api/products/stats/${p.id}?startDate=2026-05-10&endDate=2026-05-01`);
            expect(resInverted.status).toBe(400);
            expect(resInverted.body.success).toBe(false);
            expect(resInverted.body.error).toMatch(/startDate/i);

            const resBadFormat = await request(server).get(`/api/products/stats/${p.id}?startDate=not-a-date`);
            expect(resBadFormat.status).toBe(400);
            expect(resBadFormat.body.success).toBe(false);
        });

        it('returns 400 Bad Request when country filter is invalid', async () => {
            const p = await Product.create({ name: 'Prod Country', country: 'Chile', sale_price: 10000 });
            await Stock.create({ ProductId: p.id, quantity: 5 });

            const res = await request(server).get(`/api/products/stats/${p.id}?country=Fantasia`);
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/País no válido/i);
        });

        it('returns 404 when product is not found', async () => {
            const res = await request(server).get('/api/products/stats/9999');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/Producto no encontrado/i);
        });

        it('returns full metrics, salesHistory, and pricing breakdown for existing product', async () => {
            const prod = await Product.create({
                name: 'Gadget Pro',
                dropiId: 555,
                country: 'Chile',
                sale_price: 12000,
                suggested_price: 28000
            });
            await Stock.create({ ProductId: prod.id, quantity: 35 });

            // Create sales
            const now = new Date();
            const dateSale1 = new Date(now.getTime() - 2 * 24 * 3600 * 1000); // 2 days ago
            const dateSale2 = new Date(now.getTime() - 1 * 24 * 3600 * 1000); // 1 day ago

            await ProductSale.create({ ProductId: prod.id, quantitySold: 5, saleDate: dateSale1 });
            await ProductSale.create({ ProductId: prod.id, quantitySold: 10, saleDate: dateSale2 });

            const res = await request(server).get(`/api/products/stats/${prod.id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.productId).toBe(prod.id);
            expect(res.body.data.name).toBe('Gadget Pro');
            expect(res.body.data.stock).toBe(35);
            expect(res.body.data.hasLowStock).toBe(true); // 35 <= 50 -> low stock flag
            expect(res.body.data.salesInfo.totalQuantitySold).toBe(15);
            expect(res.body.data.salesInfo.salesAverage).toBeGreaterThan(0);
            expect(res.body.data.salesHistory).toBeInstanceOf(Array);
            expect(res.body.data.salesHistory.length).toBeGreaterThan(0);
            expect(res.body.data.dropScore).toBeGreaterThanOrEqual(0);
            expect(res.body.data.dropScore).toBeLessThanOrEqual(100);
        });
    });
});
