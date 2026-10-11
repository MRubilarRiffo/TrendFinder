const { resetTestDb, Product, Stock, ProductSale, Category } = require('../helpers/setupTestDb');
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

        it('distributes sales retroactively when bot was offline for > 25 hours', async () => {
            const p = await Product.create({
                dropiId: 1003,
                name: 'Reloj Smartwatch',
                country: 'Chile',
                sale_price: 25000
            });
            const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000);
            const stockRecord = await Stock.create({ ProductId: p.id, quantity: 60 });
            // Simulate last update was 72 hours ago
            const { conn } = require('../helpers/setupTestDb');
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

            // 72h / 24h = 3 days offline -> should generate 3 distributed sales
            expect(sales.length).toBe(3);
            const totalSoldInDb = sales.reduce((acc, curr) => acc + curr.quantitySold, 0);
            expect(totalSoldInDb).toBe(30);
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
