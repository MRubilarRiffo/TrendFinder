const { resetTestDb, Product, ProductSale, SalesSnapshot } = require('../helpers/setupTestDb');
const { calculateSnapshots } = require('../../src/workers/snapshots/salesSnapshotRunner');

describe('SalesSnapshotRunner - Integration Tests (Strict)', () => {
    beforeEach(async () => {
        await resetTestDb();
    });

    it('calculates and stores snapshots accurately for 1, 7, and 30 day periods with sparklines', async () => {
        const prod = await Product.create({
            name: 'Reloj Cronógrafo',
            country: 'Chile',
            sale_price: 20000,
            suggested_price: 35000 // Unit profit = 15,000
        });

        const now = new Date();
        const baseMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // Sale 1: Yesterday (1 unit)
        const saleYesterday = new Date(baseMidnight.getTime() - 12 * 3600 * 1000); // 12 hours before midnight
        await ProductSale.create({ ProductId: prod.id, quantitySold: 2, saleDate: saleYesterday });

        // Sale 2: 4 days ago (3 units)
        const sale4DaysAgo = new Date(baseMidnight.getTime() - 4 * 24 * 3600 * 1000);
        await ProductSale.create({ ProductId: prod.id, quantitySold: 3, saleDate: sale4DaysAgo });

        // Sale 3: 15 days ago (5 units)
        const sale15DaysAgo = new Date(baseMidnight.getTime() - 15 * 24 * 3600 * 1000);
        await ProductSale.create({ ProductId: prod.id, quantitySold: 5, saleDate: sale15DaysAgo });

        // Execute snapshot runner
        await calculateSnapshots();

        // 1. Snapshot Period = 1 day (should include saleYesterday only -> 2 units)
        const snap1 = await SalesSnapshot.findOne({ where: { ProductId: prod.id, periodDays: 1 } });
        expect(snap1).toBeDefined();
        expect(snap1.totalQuantitySold).toBe(2);
        expect(parseFloat(snap1.totalProfit)).toBe(30000); // 2 * 15,000
        expect(parseFloat(snap1.totalRevenue)).toBe(40000); // 2 * 20,000
        expect(Array.isArray(snap1.dailySales)).toBe(true);
        expect(snap1.dailySales.length).toBe(1);

        // 2. Snapshot Period = 7 days (should include saleYesterday + sale4DaysAgo -> 5 units)
        const snap7 = await SalesSnapshot.findOne({ where: { ProductId: prod.id, periodDays: 7 } });
        expect(snap7).toBeDefined();
        expect(snap7.totalQuantitySold).toBe(5);
        expect(parseFloat(snap7.totalProfit)).toBe(75000); // 5 * 15,000
        expect(parseFloat(snap7.totalRevenue)).toBe(100000); // 5 * 20,000
        expect(snap7.dailySales.length).toBe(7);

        // 3. Snapshot Period = 30 days (should include all 3 sales -> 10 units)
        const snap30 = await SalesSnapshot.findOne({ where: { ProductId: prod.id, periodDays: 30 } });
        expect(snap30).toBeDefined();
        expect(snap30.totalQuantitySold).toBe(10);
        expect(parseFloat(snap30.totalProfit)).toBe(150000); // 10 * 15,000
        expect(parseFloat(snap30.totalRevenue)).toBe(200000); // 10 * 20,000
        expect(snap30.dailySales.length).toBe(30);
    });

    it('overwrites previous snapshots on rerun without creating duplicate rows', async () => {
        const prod = await Product.create({
            name: 'Mochila Urbana',
            country: 'Chile',
            sale_price: 10000,
            suggested_price: 20000
        });

        const now = new Date();
        const baseMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const saleDate = new Date(baseMidnight.getTime() - 6 * 3600 * 1000); // 6 hours before midnight
        await ProductSale.create({ ProductId: prod.id, quantitySold: 4, saleDate });

        // Run twice
        await calculateSnapshots();
        await calculateSnapshots();

        const allSnapshots = await SalesSnapshot.findAll({ where: { ProductId: prod.id } });
        // Should only have 3 rows total (one for each period: 1, 7, 30)
        expect(allSnapshots.length).toBe(3);
    });
});
