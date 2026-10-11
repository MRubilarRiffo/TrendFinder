const {
    calculateSalesAverage,
    calculateTrendGrowth,
    calculateBreakoutMetrics,
    calculateDropScore,
    winsorizeDailySales
} = require('../../src/functions/salesCalculations');

describe('Sales Calculations - Unit Tests (Strict)', () => {
    describe('calculateSalesAverage', () => {
        it('returns 0 when totalQuantitySold is 0 or negative', () => {
            expect(calculateSalesAverage({ totalQuantitySold: 0, daysEvaluated: 30 })).toBe(0);
            expect(calculateSalesAverage({ totalQuantitySold: -5, daysEvaluated: 30 })).toBe(0);
        });

        it('calculates standard daily average over evaluated period', () => {
            const start = new Date('2026-01-01T00:00:00Z');
            const end = new Date('2026-01-31T00:00:00Z');
            const avg = calculateSalesAverage({
                totalQuantitySold: 60,
                daysEvaluated: 30,
                start,
                end
            });
            expect(avg).toBe(2.0); // 60 / 30
        });

        it('clamps evaluated days to effective life if first sale occurred after period start', () => {
            const start = new Date('2026-01-01T00:00:00.000Z');
            const end = new Date('2026-01-31T00:00:00.000Z');
            // First sale was on Jan 21 (10 days remaining until end)
            const firstSaleDate = new Date('2026-01-21T00:00:00.000Z');

            const avg = calculateSalesAverage({
                totalQuantitySold: 20,
                daysEvaluated: 30,
                productSales: [{ saleDate: firstSaleDate, quantitySold: 20 }],
                start,
                end
            });

            // 10 effective days -> 20 / 10 = 2.0 (instead of 20 / 30 = 0.67)
            expect(avg).toBe(2.0);
        });

        it('uses createdAt as fallback when product has no sales history yet', () => {
            const start = new Date('2026-01-01T00:00:00.000Z');
            const end = new Date('2026-01-31T00:00:00.000Z');
            const createdAt = new Date('2026-01-16T00:00:00.000Z'); // 15 days before end

            const avg = calculateSalesAverage({
                totalQuantitySold: 30,
                daysEvaluated: 30,
                productSales: [],
                createdAt,
                start,
                end
            });

            expect(avg).toBe(2.0); // 30 / 15 days
        });
    });

    describe('calculateTrendGrowth', () => {
        it('returns 0 when there are no sales in either half', () => {
            expect(calculateTrendGrowth(0, 0)).toBe(0);
        });

        it('calculates standard positive growth percentage', () => {
            // 20 recent vs 10 old = +100%
            expect(calculateTrendGrowth(20, 10)).toBe(100.0);
            // 30 recent vs 20 old = +50%
            expect(calculateTrendGrowth(30, 20)).toBe(50.0);
        });

        it('calculates negative decline percentage', () => {
            // 2 recent vs 10 old = -80%
            expect(calculateTrendGrowth(2, 10)).toBe(-80.0);
            // 0 recent vs 10 old = -100%
            expect(calculateTrendGrowth(0, 10)).toBe(-100.0);
        });

        it('applies logarithmic acceleration scaling for breakout products (0 old sales)', () => {
            // 1 sale from 0 = 100 * (1 + log10(1)) = 100%
            expect(calculateTrendGrowth(1, 0)).toBe(100.0);
            // 10 sales from 0 = 100 * (1 + log10(10)) = 100 * (1 + 1) = 200%
            expect(calculateTrendGrowth(10, 0)).toBe(200.0);
            // 100 sales from 0 = 100 * (1 + log10(100)) = 100 * 3 = 300%
            expect(calculateTrendGrowth(100, 0)).toBe(300.0);
        });

        it('caps extreme growth percentages within [-99999.99, 99999.99]', () => {
            const extreme = calculateTrendGrowth(10000000, 1);
            expect(extreme).toBeLessThanOrEqual(99999.99);
        });
    });

    describe('calculateBreakoutMetrics', () => {
        it('returns isBreakout: false if recent sales is below threshold (< 2)', () => {
            const result = calculateBreakoutMetrics(1, 0, 15);
            expect(result.isBreakout).toBe(false);
            expect(result.breakoutScore).toBe(0);
        });

        it('returns isBreakout: false if oldSales > 0 (not a breakout from 0)', () => {
            const result = calculateBreakoutMetrics(50, 5, 15);
            expect(result.isBreakout).toBe(false);
            expect(result.breakoutScore).toBe(0);
        });

        it('detects breakout and calculates weighted score with days inactive', () => {
            // 10 recent sales, 0 old sales, 10 days inactive
            // inactivityFactor = 1 + log10(10) = 2
            // breakoutScore = 10 * 2 = 20
            const result = calculateBreakoutMetrics(10, 0, 10);
            expect(result.isBreakout).toBe(true);
            expect(result.breakoutScore).toBe(20.0);
        });
    });

    describe('calculateDropScore', () => {
        it('returns a score bounded strictly between 0 and 100', () => {
            const minScore = calculateDropScore({
                salePrice: 100000,
                suggestedPriceCod: 100000, // 0 margin
                trendGrowth: -100,
                totalQuantitySold: 0,
                periodDays: 7,
                isBreakout: false
            });
            expect(minScore).toBe(0);

            const maxScore = calculateDropScore({
                salePrice: 10000,
                suggestedPriceCod: 50000, // Huge margin (80%)
                trendGrowth: 500, // Huge growth
                totalQuantitySold: 500, // Massive volume
                periodDays: 7,
                isBreakout: true
            });
            expect(maxScore).toBe(100);
            expect(maxScore).toBeLessThanOrEqual(100);
        });

        it('adds 15 points breakout bonus for emerging products', () => {
            const baseParams = {
                salePrice: 20000,
                suggestedPriceCod: 35000,
                trendGrowth: 50,
                totalQuantitySold: 14,
                periodDays: 7
            };

            const regular = calculateDropScore({ ...baseParams, isBreakout: false });
            const breakout = calculateDropScore({ ...baseParams, isBreakout: true });

            expect(breakout).toBe(Math.min(100, regular + 15));
        });
    });

    describe('winsorizeDailySales', () => {
        it('returns empty array or identical array if input has fewer than 4 elements or is empty', () => {
            expect(winsorizeDailySales([])).toEqual([]);
            expect(winsorizeDailySales([5])).toEqual([5]);
            expect(winsorizeDailySales([5, 10, 15])).toEqual([5, 10, 15]);
        });

        it('does NOT cap organic winner products with consistently high volume', () => {
            const organicWinner = [300, 350, 320, 290, 310, 340, 330];
            const winsorized = winsorizeDailySales(organicWinner);
            expect(winsorized).toEqual(organicWinner);
        });

        it('caps an extreme isolated spike (e.g. 897 among 0-2 sales) to protect downstream metrics', () => {
            const spikeSeries = [0, 0, 2, 1, 897, 0, 0];
            const winsorized = winsorizeDailySales(spikeSeries);

            // 897 must be capped to a realistic statistical ceiling (e.g. <= 15)
            expect(winsorized[4]).toBeLessThanOrEqual(15);
            expect(winsorized[0]).toBe(0);
            expect(winsorized[2]).toBe(2);
        });

        it('handles all-zeros or near-zero series gracefully', () => {
            const zeros = [0, 0, 0, 0, 0, 0, 0];
            expect(winsorizeDailySales(zeros)).toEqual(zeros);
        });
    });
});
