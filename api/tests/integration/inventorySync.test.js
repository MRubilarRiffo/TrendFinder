const request = require('supertest');
const server = require('../../src/config/server');
const { resetTestDb, Product, Stock, ProductSale, Category, conn } = require('../helpers/setupTestDb');
const { processExistingProductsBatch, processNonexistentProductsBatch } = require('../../src/domain/InventorySync');

describe('InventorySync - Integration Tests (Strict)', () => {
    beforeEach(async () => {
        await resetTestDb();
        // Seed default 'Otros' category
        await Category.create({ name: 'Otros' });
    });

    describe('processExistingProductsBatch', () => {
        it('detects stock decrement, updates stock and creates ProductSale record', async () => {
            const p = await Product.create({
                dropiId: 1001,
                name: 'Audífonos Bluetooth',
                country: 'Chile',
                sale_price: 15000
            });
            await Stock.create({ ProductId: p.id, quantity: 50 });

            // Dropi reports stock fell from 50 to 38 (12 units sold)
            await processExistingProductsBatch([{ id: p.id, stock: 38 }]);

            // Assert stock was updated
            const updatedStock = await Stock.findOne({ where: { ProductId: p.id } });
            expect(updatedStock.quantity).toBe(38);

            // Assert sale was created
            const sales = await ProductSale.findAll({ where: { ProductId: p.id } });
            expect(sales.length).toBe(1);
            expect(sales[0].quantitySold).toBe(12);
        });

        it('handles stock replenishment without creating sales', async () => {
            const p = await Product.create({
                dropiId: 1002,
                name: 'Lámpara LED',
                country: 'Chile',
                sale_price: 8000
            });
            await Stock.create({ ProductId: p.id, quantity: 20 });

            // Supplier restocked: from 20 to 80
            await processExistingProductsBatch([{ id: p.id, stock: 80 }]);

            const updatedStock = await Stock.findOne({ where: { ProductId: p.id } });
            expect(updatedStock.quantity).toBe(80);

            const sales = await ProductSale.findAll({ where: { ProductId: p.id } });
            expect(sales.length).toBe(0);
        });

        it('distributes sales retroactively when bot was offline for > 25 hours with exact quantities and 24h intervals', async () => {
            const p = await Product.create({
                dropiId: 1003,
                name: 'Reloj Smartwatch',
                country: 'Chile',
                sale_price: 25000
            });
            const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000);
            const stockRecord = await Stock.create({ ProductId: p.id, quantity: 60 });
            // Simulate last update was exactly 72 hours ago
            const dateStr = threeDaysAgo.toISOString().replace('T', ' ').replace('Z', '');
            await conn.query('UPDATE Stocks SET updatedAt = :date WHERE id = :id', {
                replacements: { date: dateStr, id: stockRecord.id }
            });

            // 60 -> 30 (30 units sold over ~3 days offline)
            await processExistingProductsBatch([{ id: p.id, stock: 30 }]);

            const sales = await ProductSale.findAll({
                where: { ProductId: p.id },
                order: [['saleDate', 'ASC']]
            });

            // 1. Strict row count and exact total sum
            expect(sales.length).toBe(3);
            const totalSoldInDb = sales.reduce((acc, curr) => acc + curr.quantitySold, 0);
            expect(totalSoldInDb).toBe(30);

            // 2. Strict allocation per day: 30 / 3 = exactly 10 units each
            expect(sales[0].quantitySold).toBe(10);
            expect(sales[1].quantitySold).toBe(10);
            expect(sales[2].quantitySold).toBe(10);

            // 3. Strict temporal spacing: each consecutive sale spaced by 24h
            const t0 = new Date(sales[0].saleDate).getTime();
            const t1 = new Date(sales[1].saleDate).getTime();
            const t2 = new Date(sales[2].saleDate).getTime();
            const oneDayMs = 24 * 3600 * 1000;

            expect(t1 - t0).toBe(oneDayMs);
            expect(t2 - t1).toBe(oneDayMs);
            expect(t2).toBeLessThanOrEqual(Date.now());

            // 4. Stock record accurately updated
            const updatedStock = await Stock.findOne({ where: { ProductId: p.id } });
            expect(updatedStock.quantity).toBe(30);
        });

        it('accurately allocates remainder units to the most recent day on uneven division', async () => {
            const p = await Product.create({
                dropiId: 1004,
                name: 'Teclado Gamer',
                country: 'Chile',
                sale_price: 35000
            });
            const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000);
            const stockRecord = await Stock.create({ ProductId: p.id, quantity: 60 });
            const dateStr = threeDaysAgo.toISOString().replace('T', ' ').replace('Z', '');
            await conn.query('UPDATE Stocks SET updatedAt = :date WHERE id = :id', {
                replacements: { date: dateStr, id: stockRecord.id }
            });

            // 60 -> 28 (32 units sold over 3 days -> 10, 10, and remainder 2 on the last day = 12)
            await processExistingProductsBatch([{ id: p.id, stock: 28 }]);

            const sales = await ProductSale.findAll({
                where: { ProductId: p.id },
                order: [['saleDate', 'ASC']]
            });

            expect(sales.length).toBe(3);
            expect(sales[0].quantitySold).toBe(10);
            expect(sales[1].quantitySold).toBe(10);
            expect(sales[2].quantitySold).toBe(12); // 10 base + 2 remainder

            const totalSoldInDb = sales.reduce((acc, curr) => acc + curr.quantitySold, 0);
            expect(totalSoldInDb).toBe(32);

            const updatedStock = await Stock.findOne({ where: { ProductId: p.id } });
            expect(updatedStock.quantity).toBe(28);
        });

        it('does NOT distribute retroactively when offline period is within normal threshold (<= 25 hours)', async () => {
            const p = await Product.create({
                dropiId: 1005,
                name: 'Mouse Ergonómico',
                country: 'Chile',
                sale_price: 18000
            });
            const eighteenHoursAgo = new Date(Date.now() - 18 * 3600 * 1000);
            const stockRecord = await Stock.create({ ProductId: p.id, quantity: 50 });
            const dateStr = eighteenHoursAgo.toISOString().replace('T', ' ').replace('Z', '');
            await conn.query('UPDATE Stocks SET updatedAt = :date WHERE id = :id', {
                replacements: { date: dateStr, id: stockRecord.id }
            });

            // 50 -> 35 (15 units sold in normal 18h window <= 25h threshold)
            await processExistingProductsBatch([{ id: p.id, stock: 35 }]);

            const sales = await ProductSale.findAll({
                where: { ProductId: p.id }
            });

            // Must produce exactly 1 single sale record (today), NOT distributed
            expect(sales.length).toBe(1);
            expect(sales[0].quantitySold).toBe(15);
            expect(new Date(sales[0].saleDate).getTime()).toBeGreaterThanOrEqual(eighteenHoursAgo.getTime());
        });

        it('prevents artificial spikes in GET /api/products/stats/:id by producing continuous sales history', async () => {
            const p = await Product.create({
                dropiId: 1006,
                name: 'Silla Ergonómica',
                country: 'Chile',
                sale_price: 90000,
                suggested_price: 150000
            });
            // 4 days offline (96 hours)
            const fourDaysAgo = new Date(Date.now() - 96 * 3600 * 1000);
            const stockRecord = await Stock.create({ ProductId: p.id, quantity: 100 });
            const dateStr = fourDaysAgo.toISOString().replace('T', ' ').replace('Z', '');
            await conn.query('UPDATE Stocks SET updatedAt = :date WHERE id = :id', {
                replacements: { date: dateStr, id: stockRecord.id }
            });

            // 100 -> 60 (40 units sold over 4 days)
            await processExistingProductsBatch([{ id: p.id, stock: 60 }]);

            // Query the HTTP stats endpoint (which powers the frontend visualizer)
            const res = await request(server).get(`/api/products/stats/${p.id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.salesInfo.totalQuantitySold).toBe(40);

            // Crucial assertion: maxDailySales must be smoothed (~10 units), NOT an artificial spike of 40!
            expect(res.body.data.salesInfo.maxDailySales).toBeLessThanOrEqual(15);
            expect(res.body.data.salesInfo.maxDailySales).toBeGreaterThan(0);

            // Ensure salesHistory array has distributed values across multiple days
            const history = res.body.data.salesHistory;
            const daysWithSales = history.filter(day => day.quantity > 0);
            expect(daysWithSales.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('processNonexistentProductsBatch', () => {
        it('creates products and initial stock atomically in bulk', async () => {
            const nonexistent = [
                {
                    id: 501,
                    name: 'Cámara 4K',
                    stock: 25,
                    gallery: [{ urlS3: 'camara.jpg' }],
                    categories: [{ name: 'tecnologia' }],
                    sale_price: '45000.00',
                    suggested_price: '79990.00'
                },
                {
                    id: 502,
                    name: 'Trípode Pro',
                    stock: 50,
                    gallery: [],
                    categories: [{ name: 'Otros' }],
                    sale_price: '15000.00',
                    suggested_price: '29990.00'
                }
            ];

            await processNonexistentProductsBatch(nonexistent, 'https://dropi.cl/product/', 'Chile');

            const productsInDb = await Product.findAll({ order: [['id', 'ASC']] });
            expect(productsInDb.length).toBe(2);

            expect(productsInDb[0].dropiId).toBe(501);
            expect(productsInDb[0].name).toBe('Cámara 4K');
            expect(parseFloat(productsInDb[0].sale_price)).toBe(45000);

            // Verify Stocks were created
            const stocks = await Stock.findAll({ order: [['ProductId', 'ASC']] });
            expect(stocks.length).toBe(2);
            expect(stocks[0].ProductId).toBe(productsInDb[0].id);
            expect(stocks[0].quantity).toBe(25);
            expect(stocks[1].ProductId).toBe(productsInDb[1].id);
            expect(stocks[1].quantity).toBe(50);
        });

        it('sums up warehouse and variation stock properly', async () => {
            const productWithVariations = [
                {
                    id: 601,
                    name: 'Zapatos Deportivos',
                    stock: 0,
                    gallery: [],
                    categories: [],
                    sale_price: 30000,
                    suggested_price: 55000,
                    warehouse_product: [{ stock: 10 }],
                    variations: [
                        { stock: 15 },
                        { stock: 20 }
                    ]
                }
            ];

            await processNonexistentProductsBatch(productWithVariations, 'https://dropi.cl/product/', 'Chile');

            const prod = await Product.findOne({ where: { dropiId: 601 } });
            expect(prod).toBeDefined();

            const stock = await Stock.findOne({ where: { ProductId: prod.id } });
            // Total variation stock = 15 + 20 = 35 (higher than general stock 10, variation stock prevails)
            expect(stock.quantity).toBe(35);
        });
    });
});
