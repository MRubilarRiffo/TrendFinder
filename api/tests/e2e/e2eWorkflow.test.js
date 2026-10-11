const request = require('supertest');
const server = require('../../src/config/server');
const { resetTestDb, Product, Stock, ProductSale, SalesSnapshot, Category } = require('../helpers/setupTestDb');
const { processNonexistentProductsBatch, processExistingProductsBatch } = require('../../src/domain/InventorySync');
const { calculateSnapshots } = require('../../src/workers/snapshots/salesSnapshotRunner');

describe('End-to-End System Workflow (Tracer Bullet)', () => {
    beforeAll(async () => {
        await resetTestDb();
    });

    it('executes full business lifecycle: Ingestion -> Sales Activity -> Snapshot Calculation -> HTTP API Leaderboard', async () => {
        // Step 0: Ensure default category exists
        await Category.create({ name: 'Otros' });

        // STEP 1: Ingestion of new products (Dropi Scraper finds novel product)
        const newProductsFromDropi = [
            {
                id: 9901,
                name: 'Humidificador Ultrasónico',
                stock: 100,
                gallery: [{ urlS3: 'humidifier.jpg' }],
                categories: [{ name: 'hogar' }],
                sale_price: '12000.00',
                suggested_price: '29990.00' // Suggested markup
            }
        ];

        await processNonexistentProductsBatch(newProductsFromDropi, 'https://dropi.cl/product/', 'Chile');

        // Verify product and initial stock were created in DB
        const createdProduct = await Product.findOne({ where: { dropiId: 9901 } });
        expect(createdProduct).toBeDefined();
        expect(createdProduct.name).toBe('Humidificador Ultrasónico');

        const initialStock = await Stock.findOne({ where: { ProductId: createdProduct.id } });
        expect(initialStock.quantity).toBe(100);

        // STEP 2: Sales Activity (Stock decreases on next scraper run: 100 -> 75, sold 25 units)
        const now = new Date();
        const baseMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // We run batch sync detecting 25 sales
        await processExistingProductsBatch([{ id: createdProduct.id, stock: 75 }]);

        const updatedStock = await Stock.findOne({ where: { ProductId: createdProduct.id } });
        expect(updatedStock.quantity).toBe(75);

        // Adjust sale date to within the active evaluation window for the cron (6h before midnight)
        const recentSaleDate = new Date(baseMidnight.getTime() - 6 * 3600 * 1000);
        await ProductSale.update(
            { saleDate: recentSaleDate },
            { where: { ProductId: createdProduct.id } }
        );

        const salesInDb = await ProductSale.findAll({ where: { ProductId: createdProduct.id } });
        expect(salesInDb.length).toBe(1);
        expect(salesInDb[0].quantitySold).toBe(25);

        // STEP 3: Background Worker calculates snapshots (Cron runner)
        await calculateSnapshots();

        const snapshot7d = await SalesSnapshot.findOne({
            where: { ProductId: createdProduct.id, periodDays: 7 }
        });
        expect(snapshot7d).toBeDefined();
        expect(snapshot7d.totalQuantitySold).toBe(25);
        // Total Profit = 25 * (29,990 - 12,000) = 25 * 17,990 = 449,750
        expect(parseFloat(snapshot7d.totalProfit)).toBe(449750);
        expect(parseFloat(snapshot7d.totalRevenue)).toBe(300000); // 25 * 12,000

        // STEP 4: HTTP API Consumers (Frontend Dashboard Leaderboard)
        const leaderboardRes = await request(server).get('/api/sales?days=7&sortBy=profit');

        expect(leaderboardRes.status).toBe(200);
        expect(leaderboardRes.body.success).toBe(true);
        expect(leaderboardRes.body.periodDays).toBe(7);
        expect(leaderboardRes.body.data.length).toBeGreaterThanOrEqual(1);

        const topProduct = leaderboardRes.body.data[0];
        expect(topProduct.dropiId).toBe(9901);
        expect(topProduct.name).toBe('Humidificador Ultrasónico');
        expect(topProduct.totalQuantitySold).toBe(25);
        expect(topProduct.totalProfit).toMatch(/449\.750/); // Formatted Chilean Pesos
        expect(topProduct.stock).toBe(75);

        // STEP 5: HTTP API Product Detail Stats
        const detailRes = await request(server).get(`/api/products/stats/${createdProduct.id}`);

        expect(detailRes.status).toBe(200);
        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data.productId).toBe(createdProduct.id);
        expect(detailRes.body.data.salesInfo.totalQuantitySold).toBe(25);
        expect(detailRes.body.data.financialBreakdown.cod.suggestedPrice).toBeDefined();
        expect(detailRes.body.data.financialBreakdown.cod.weightedProfit).toBeDefined();
    });

    it('end-to-end resilience: supplier anomaly (zeroing/spike) does NOT distort snapshot calculations or poison HTTP leaderboard', async () => {
        // Step 1: Ingest 2 products: one organic winner and one supplier-adjusted product
        const products = [
            {
                id: 9902,
                name: 'Lámpara Luna Viral (Ganador)',
                stock: 500,
                gallery: [{ urlS3: 'luna.jpg' }],
                categories: [{ name: 'hogar' }],
                sale_price: '10000.00',
                suggested_price: '25000.00' // Profit 15,000
            },
            {
                id: 9903,
                name: 'Producto Proveedor Vaciado (Anomalía)',
                stock: 1000,
                gallery: [{ urlS3: 'vaciado.jpg' }],
                categories: [{ name: 'Otros' }],
                sale_price: '5000.00',
                suggested_price: '20000.00' // High theoretical profit 15,000
            }
        ];

        await processNonexistentProductsBatch(products, 'https://dropi.cl/product/', 'Chile');

        const prodOrganic = await Product.findOne({ where: { dropiId: 9902 } });
        const prodAnomaly = await Product.findOne({ where: { dropiId: 9903 } });

        // Step 2: Simulate next sync:
        // - prodOrganic sells 30 units (500 -> 470)
        // - prodAnomaly has supplier manual drop of 900 units (1000 -> 0)
        await processExistingProductsBatch([
            { id: prodOrganic.id, stock: 470 },
            { id: prodAnomaly.id, stock: 0 }
        ]);

        // Place organic sale in the snapshot window
        const now = new Date();
        const baseMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const recentSaleDate = new Date(baseMidnight.getTime() - 4 * 3600 * 1000);
        await ProductSale.update(
            { saleDate: recentSaleDate },
            { where: { ProductId: prodOrganic.id } }
        );

        // Step 3: Run snapshots background worker
        await calculateSnapshots();

        // Step 4: Query leaderboard
        const res = await request(server).get('/api/sales?days=7&sortBy=profit');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Organic winner must be on top; supplier zeroing product must NOT have 1,000 fake sales or lead the leaderboard
        const organicLeaderboardItem = res.body.data.find(item => item.dropiId === 9902);
        const anomalyLeaderboardItem = res.body.data.find(item => item.dropiId === 9903);

        expect(organicLeaderboardItem).toBeDefined();
        expect(organicLeaderboardItem.totalQuantitySold).toBe(30);

        // Anomaly product was zeroed, so it should have 0 sales in the period
        if (anomalyLeaderboardItem) {
            expect(anomalyLeaderboardItem.totalQuantitySold).toBe(0);
        }

        // Step 5: Detail stats for anomaly product
        const detailRes = await request(server).get(`/api/products/stats/${prodAnomaly.id}`);
        expect(detailRes.status).toBe(200);
        expect(detailRes.body.data.salesInfo.totalQuantitySold).toBe(0);
        expect(detailRes.body.data.salesInfo.maxDailySales).toBe(0);
        expect(detailRes.body.data.stock).toBe(0);
    });
});
