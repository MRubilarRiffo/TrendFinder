jest.mock('../../src/repositories/ProductPerformanceRepository');

const { resolveEvaluationPeriod, getProductPerformance } = require('../../src/domain/ProductPerformance/ProductPerformanceService');
const { getProductPerformanceData } = require('../../src/repositories/ProductPerformanceRepository');

describe('ProductPerformanceService - Unit Tests (Strict)', () => {
    describe('resolveEvaluationPeriod', () => {
        it('calculates 30 days period by default when no dates provided', () => {
            const { start, end, daysEvaluated } = resolveEvaluationPeriod();
            expect(daysEvaluated).toBe(30);
            expect(end.getTime()).toBeGreaterThan(start.getTime());
        });

        it('calculates custom date range correctly', () => {
            const { start, end, daysEvaluated } = resolveEvaluationPeriod('2026-05-01', '2026-05-10');
            expect(daysEvaluated).toBe(10);
            expect(start.getUTCFullYear()).toBe(2026);
            expect(start.getUTCMonth()).toBe(4); // 0-indexed May in UTC
            expect(start.getUTCDate()).toBe(1);
            expect(end.getUTCDate()).toBe(10);
        });
    });

    describe('getProductPerformance - salesHistory date iteration', () => {
        it('generates continuous sequential days without duplicate or skipped dates in UTC', async () => {
            const mockProduct = {
                id: 1,
                name: 'Test Product',
                dropiId: 1001,
                country: 'Chile',
                sale_price: 15000,
                Stock: { quantity: 20 },
                ProductSales: [
                    {
                        quantitySold: 3,
                        saleDate: new Date('2026-06-02T12:00:00Z')
                    }
                ],
                createdAt: new Date('2026-05-01T00:00:00Z')
            };

            getProductPerformanceData.mockResolvedValue([mockProduct]);

            const result = await getProductPerformance(1, '2026-06-01', '2026-06-05', 'Chile');

            expect(result.salesHistory).toBeDefined();
            const dates = result.salesHistory.map(h => h.date);

            // Expect strictly 5 distinct consecutive days
            expect(dates).toEqual([
                '2026-06-01',
                '2026-06-02',
                '2026-06-03',
                '2026-06-04',
                '2026-06-05'
            ]);

            // Quantity on 2026-06-02 should be 3, others 0
            const day2 = result.salesHistory.find(h => h.date === '2026-06-02');
            expect(day2.quantity).toBe(3);
        });
    });
});
