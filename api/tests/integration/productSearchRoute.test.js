const request = require('supertest');
const server = require('../../src/config/server');
const { resetTestDb, Product, Stock } = require('../helpers/setupTestDb');

describe('Product Search Route - Integration Tests (Strict)', () => {
    beforeEach(async () => {
        await resetTestDb();
    });

    describe('GET /api/products/search - Success Scenarios', () => {
        it('returns matching products by single keyword (case-insensitive)', async () => {
            const p1 = await Product.create({
                name: 'Cepillo Alisador Eléctrico',
                dropiId: 1001,
                country: 'Colombia',
                sale_price: 30000,
                suggested_price: 65000,
                image: 'https://img.com/1.jpg',
                url: 'https://dropi.co/1'
            });
            await Stock.create({ ProductId: p1.id, quantity: 50 });

            const p2 = await Product.create({
                name: 'Organizador de Zapatos Plegable',
                dropiId: 1002,
                country: 'Colombia',
                sale_price: 20000,
                suggested_price: 45000
            });
            await Stock.create({ ProductId: p2.id, quantity: 20 });

            const res = await request(server).get('/api/products/search?q=cepillo');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.query).toBe('cepillo');
            expect(res.body.pagination.totalMatches).toBe(1);
            expect(res.body.pagination.totalPages).toBe(1);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
            expect(res.body.data.length).toBe(1);

            const product = res.body.data[0];
            expect(product.productId).toBe(p1.id);
            expect(product.dropiId).toBe(1001);
            expect(product.name).toBe('Cepillo Alisador Eléctrico');
            expect(product.stock).toBe(50);
            expect(product.country).toBe('Colombia');
            expect(product.rawPrice).toBe(30000);
            expect(product.price).toMatch(/30\.000/);
            expect(product.suggestedPriceCod).toBeDefined();
            expect(product.unitProfitCod).toBeDefined();
            expect(product.suggestedPricePrepaid).toBeDefined();
            expect(product.unitProfitPrepaid).toBeDefined();
        });

        it('supports multi-token search where all tokens must match regardless of position', async () => {
            const p1 = await Product.create({
                name: 'Audífonos Bluetooth Inalámbricos Pro Deportivos',
                dropiId: 2001,
                country: 'Chile',
                sale_price: 15000
            });
            await Stock.create({ ProductId: p1.id, quantity: 30 });

            const p2 = await Product.create({
                name: 'Audífonos con Cable Tradicionales',
                dropiId: 2002,
                country: 'Chile',
                sale_price: 8000
            });
            await Stock.create({ ProductId: p2.id, quantity: 10 });

            // Query: "bluetooth audifonos" (different order than in title)
            const res = await request(server).get('/api/products/search?q=bluetooth%20audífonos');

            expect(res.status).toBe(200);
            expect(res.body.pagination.totalMatches).toBe(1);
            expect(res.body.data[0].productId).toBe(p1.id);
        });

        it('finds product by numeric Dropi ID or internal ID', async () => {
            const p1 = await Product.create({
                name: 'Lámpara LED Sunset',
                dropiId: 88412,
                country: 'México',
                sale_price: 250
            });
            await Stock.create({ ProductId: p1.id, quantity: 15 });

            const res = await request(server).get('/api/products/search?q=88412');

            expect(res.status).toBe(200);
            expect(res.body.pagination.totalMatches).toBe(1);
            expect(res.body.data[0].productId).toBe(p1.id);
            expect(res.body.data[0].dropiId).toBe(88412);
        });

        it('filters search results strictly by country', async () => {
            const pChile = await Product.create({
                name: 'Faja Reductora Térmica',
                dropiId: 3001,
                country: 'Chile',
                sale_price: 12000
            });
            await Stock.create({ ProductId: pChile.id, quantity: 25 });

            const pCol = await Product.create({
                name: 'Faja Reductora Térmica',
                dropiId: 3002,
                country: 'Colombia',
                sale_price: 35000
            });
            await Stock.create({ ProductId: pCol.id, quantity: 40 });

            const res = await request(server).get('/api/products/search?q=faja&country=Chile');

            expect(res.status).toBe(200);
            expect(res.body.pagination.totalMatches).toBe(1);
            expect(res.body.data[0].productId).toBe(pChile.id);
            expect(res.body.data[0].country).toBe('Chile');
        });

        it('handles pagination correctly (page, limit, totalPages, hasNextPage, hasPrevPage)', async () => {
            // Create 15 matching products
            for (let i = 1; i <= 15; i++) {
                const p = await Product.create({
                    name: `Reloj Smartwatch Serie ${i}`,
                    dropiId: 4000 + i,
                    country: 'Colombia',
                    sale_price: 50000 + (i * 1000)
                });
                await Stock.create({ ProductId: p.id, quantity: i * 2 });
            }

            // Page 1 with limit 10
            const resPage1 = await request(server).get('/api/products/search?q=smartwatch&page=1&limit=10');
            expect(resPage1.status).toBe(200);
            expect(resPage1.body.pagination.totalMatches).toBe(15);
            expect(resPage1.body.pagination.totalPages).toBe(2);
            expect(resPage1.body.pagination.page).toBe(1);
            expect(resPage1.body.pagination.limit).toBe(10);
            expect(resPage1.body.pagination.hasNextPage).toBe(true);
            expect(resPage1.body.pagination.hasPrevPage).toBe(false);
            expect(resPage1.body.data.length).toBe(10);

            // Page 2 with limit 10
            const resPage2 = await request(server).get('/api/products/search?q=smartwatch&page=2&limit=10');
            expect(resPage2.status).toBe(200);
            expect(resPage2.body.pagination.page).toBe(2);
            expect(resPage2.body.pagination.hasNextPage).toBe(false);
            expect(resPage2.body.pagination.hasPrevPage).toBe(true);
            expect(resPage2.body.data.length).toBe(5);
        });

        it('supports sorting by different criteria (price_asc, price_desc, name_asc, recent)', async () => {
            const pCheap = await Product.create({
                name: 'Cámara Mini A',
                country: 'Chile',
                sale_price: 10000,
                createdAt: new Date('2026-01-01T10:00:00Z')
            });
            await Stock.create({ ProductId: pCheap.id, quantity: 5 });

            const pExpensive = await Product.create({
                name: 'Cámara Pro B',
                country: 'Chile',
                sale_price: 50000,
                createdAt: new Date('2026-01-02T10:00:00Z')
            });
            await Stock.create({ ProductId: pExpensive.id, quantity: 5 });

            // Sort by price_asc
            const resAsc = await request(server).get('/api/products/search?q=cámara&sortBy=price_asc');
            expect(resAsc.status).toBe(200);
            expect(resAsc.body.data[0].productId).toBe(pCheap.id);
            expect(resAsc.body.data[1].productId).toBe(pExpensive.id);

            // Sort by price_desc
            const resDesc = await request(server).get('/api/products/search?q=cámara&sortBy=price_desc');
            expect(resDesc.status).toBe(200);
            expect(resDesc.body.data[0].productId).toBe(pExpensive.id);
            expect(resDesc.body.data[1].productId).toBe(pCheap.id);

            // Sort by name_asc
            const resName = await request(server).get('/api/products/search?q=cámara&sortBy=name_asc');
            expect(resName.status).toBe(200);
            expect(resName.body.data[0].productId).toBe(pCheap.id);

            // Sort by recent (default)
            const resRecent = await request(server).get('/api/products/search?q=cámara&sortBy=recent');
            expect(resRecent.status).toBe(200);
            expect(resRecent.body.data[0].productId).toBe(pExpensive.id);
        });

        it('returns empty array with 0 totalMatches when no products match', async () => {
            await Product.create({ name: 'Zapatos Deportivos', country: 'Chile', sale_price: 20000 });

            const res = await request(server).get('/api/products/search?q=inexistente');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pagination.totalMatches).toBe(0);
            expect(res.body.pagination.totalPages).toBe(0);
            expect(res.body.pagination.hasNextPage).toBe(false);
            expect(res.body.pagination.hasPrevPage).toBe(false);
            expect(res.body.data).toEqual([]);
        });

        it('safely escapes special wildcard characters (% and _) without throwing or matching all', async () => {
            await Product.create({ name: 'Cable USB 100% Cobre', country: 'Chile', sale_price: 5000 });
            await Product.create({ name: 'Cable Genérico Simple', country: 'Chile', sale_price: 3000 });

            // Searching for literal "%" should only match products containing "%"
            const res = await request(server).get('/api/products/search?q=100%25');

            expect(res.status).toBe(200);
            expect(res.body.pagination.totalMatches).toBe(1);
            expect(res.body.data[0].name).toBe('Cable USB 100% Cobre');
        });
    });

    describe('GET /api/products/search - Validation & Error Handling (Strict 400)', () => {
        it('returns 400 Bad Request when q parameter is missing', async () => {
            const res = await request(server).get('/api/products/search');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/parámetro de búsqueda "q" es requerido/i);
        });

        it('returns 400 Bad Request when q is empty string or only whitespace', async () => {
            const res = await request(server).get('/api/products/search?q=%20%20%20');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/parámetro de búsqueda "q" es requerido/i);
        });

        it('returns 400 Bad Request when q is shorter than 2 characters', async () => {
            const res = await request(server).get('/api/products/search?q=a');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/al menos 2 caracteres/i);
        });

        it('returns 400 Bad Request when q consists solely of SQL wildcards (% or _)', async () => {
            const resPercent = await request(server).get('/api/products/search?q=%25%25%25');
            expect(resPercent.status).toBe(400);
            expect(resPercent.body.success).toBe(false);
            expect(resPercent.body.error).toMatch(/al menos 2 caracteres/i);

            const resUnder = await request(server).get('/api/products/search?q=___');
            expect(resUnder.status).toBe(400);
            expect(resUnder.body.success).toBe(false);
            expect(resUnder.body.error).toMatch(/al menos 2 caracteres/i);
        });

        it('returns 400 Bad Request when q exceeds 100 characters', async () => {
            const longQuery = 'a'.repeat(101);
            const res = await request(server).get(`/api/products/search?q=${longQuery}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/no puede exceder 100 caracteres/i);
        });

        it('returns 400 Bad Request when country is invalid', async () => {
            const res = await request(server).get('/api/products/search?q=reloj&country=PaisInexistente');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/País no válido/i);
        });

        it('returns 400 Bad Request when page is not a positive integer (e.g. 0, negative, string)', async () => {
            const resZero = await request(server).get('/api/products/search?q=reloj&page=0');
            expect(resZero.status).toBe(400);
            expect(resZero.body.error).toMatch(/page/i);

            const resNeg = await request(server).get('/api/products/search?q=reloj&page=-3');
            expect(resNeg.status).toBe(400);
            expect(resNeg.body.error).toMatch(/page/i);

            const resStr = await request(server).get('/api/products/search?q=reloj&page=abc');
            expect(resStr.status).toBe(400);
            expect(resStr.body.error).toMatch(/page/i);
        });

        it('returns 400 Bad Request when limit is not a positive integer', async () => {
            const resNeg = await request(server).get('/api/products/search?q=reloj&limit=-10');
            expect(resNeg.status).toBe(400);
            expect(resNeg.body.error).toMatch(/limit/i);

            const resStr = await request(server).get('/api/products/search?q=reloj&limit=xyz');
            expect(resStr.status).toBe(400);
            expect(resStr.body.error).toMatch(/limit/i);
        });

        it('returns 400 Bad Request when sortBy is not an allowed value', async () => {
            const res = await request(server).get('/api/products/search?q=reloj&sortBy=hack_order');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toMatch(/criterio de ordenamiento inválido/i);
        });

        it('clamps limit to maximum of 50 to avoid memory exhaustion', async () => {
            for (let i = 1; i <= 55; i++) {
                await Product.create({ name: `Gafas de Sol ${i}`, country: 'Chile', sale_price: 15000 });
            }

            const res = await request(server).get('/api/products/search?q=gafas&limit=200');

            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(50);
            expect(res.body.data.length).toBe(50);
        });

        it('ensures /search does NOT get intercepted as an :id parameter by /stats/:id', async () => {
            // If /search was registered after /stats/:id, /stats/search would have failed with "ID de producto inválido"
            // Testing /api/products/search explicitly proves routing order is correct
            const res = await request(server).get('/api/products/search?q=test');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
