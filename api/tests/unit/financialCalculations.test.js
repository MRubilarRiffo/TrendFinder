const {
    calculateSuggestedPrices,
    parseFinancialParams,
    DEFAULT_FINANCIAL_PARAMS
} = require('../../src/functions/financialCalculations');

describe('Financial Calculations - Unit Tests (Strict)', () => {
    describe('Default Parameters', () => {
        it('has correct production default values', () => {
            expect(DEFAULT_FINANCIAL_PARAMS.shippingCostPrepaid).toBe(5000);
            expect(DEFAULT_FINANCIAL_PARAMS.cpaPrepaid).toBe(8000);
            expect(DEFAULT_FINANCIAL_PARAMS.desiredProfitPrepaid).toBe(8000);
            expect(DEFAULT_FINANCIAL_PARAMS.commissionPctPrepaid).toBe(0.06);

            expect(DEFAULT_FINANCIAL_PARAMS.shippingCostCod).toBe(8000);
            expect(DEFAULT_FINANCIAL_PARAMS.cpaCod).toBe(4000);
            expect(DEFAULT_FINANCIAL_PARAMS.desiredProfitCod).toBe(8000);
            expect(DEFAULT_FINANCIAL_PARAMS.deliveryRatePctCod).toBe(0.70);
            expect(DEFAULT_FINANCIAL_PARAMS.failedShippingCostCod).toBe(8000);
        });

        it('parses fallback parameters correctly when input is empty or invalid', () => {
            const parsed = parseFinancialParams({});
            expect(parsed).toEqual(DEFAULT_FINANCIAL_PARAMS);

            const parsedInvalid = parseFinancialParams({ shippingCostPrepaid: 'invalid_number' });
            expect(parsedInvalid.shippingCostPrepaid).toBe(DEFAULT_FINANCIAL_PARAMS.shippingCostPrepaid);
        });

        it('supports generic fallback parameters for cpa and desiredProfit', () => {
            const parsed = parseFinancialParams({ cpa: 6000, desiredProfit: 10000 });
            expect(parsed.cpaPrepaid).toBe(6000);
            expect(parsed.cpaCod).toBe(6000);
            expect(parsed.desiredProfitPrepaid).toBe(10000);
            expect(parsed.desiredProfitCod).toBe(10000);
        });
    });

    describe('Prepaid Model (E-commerce Tradicional)', () => {
        it('calculates suggested price and guarantees exact net profit with standard cost (10,000)', () => {
            const result = calculateSuggestedPrices(10000);

            // Subtotal = 10000 + 5000 + 8000 + 8000 = 31000
            // Denom = 1 - 0.06 = 0.94
            // Expected SuggestedPrice = 31000 / 0.94 = 32978.72
            // Expected NetProfit = exactly 8000
            expect(result.prepaid.suggestedPrice).toBe(32978.72);
            expect(result.prepaid.commissionAmount).toBe(1978.72);
            expect(result.prepaid.netProfit).toBe(8000);
        });

        it('calculates prepaid model with 0 cost price', () => {
            const result = calculateSuggestedPrices(0);

            // Subtotal = 0 + 5000 + 8000 + 8000 = 21000
            // Expected SuggestedPrice = 21000 / 0.94 = 22340.43
            expect(result.prepaid.suggestedPrice).toBe(22340.43);
            expect(result.prepaid.netProfit).toBe(8000);
        });

        it('calculates prepaid model with 0% commission', () => {
            const result = calculateSuggestedPrices(10000, { commissionPctPrepaid: 0 });

            // Subtotal = 10000 + 5000 + 8000 + 8000 = 31000
            expect(result.prepaid.suggestedPrice).toBe(31000);
            expect(result.prepaid.commissionAmount).toBe(0);
            expect(result.prepaid.netProfit).toBe(8000);
        });
    });

    describe('COD Model (Cash on Delivery / Dropi)', () => {
        it('calculates suggested price and guarantees exact weighted profit with standard cost (10,000)', () => {
            const result = calculateSuggestedPrices(10000);

            // Cost: 10000, Ship: 8000, CPA: 4000, Desired: 8000, Rate: 70%, FailShip: 8000
            // Loss = 8000 + 4000 = 12000. WeightedLoss = 12000 * 0.30 = 3600
            // RequiredDeliveredProfit = (8000 + 3600) / 0.70 = 16571.43
            // SuggestedPrice = 10000 + 8000 + 4000 + 16571.43 = 38571.43
            expect(result.cod.suggestedPrice).toBe(38571.43);
            expect(result.cod.deliveredProfit).toBe(16571.43);
            expect(result.cod.weightedProfit).toBe(8000); // EXACT desired profit
        });

        it('handles 100% delivery rate (0 failures)', () => {
            const result = calculateSuggestedPrices(10000, { deliveryRatePctCod: 1.0 });

            // Loss = 0. RequiredDeliveredProfit = 8000
            // SuggestedPrice = 10000 + 8000 + 4000 + 8000 = 30000
            expect(result.cod.suggestedPrice).toBe(30000);
            expect(result.cod.deliveredProfit).toBe(8000);
            expect(result.cod.weightedProfit).toBe(8000);
        });

        it('handles custom desired profit and CPA', () => {
            const result = calculateSuggestedPrices(15000, {
                cpaCod: 5000,
                desiredProfitCod: 12000,
                shippingCostCod: 6000,
                failedShippingCostCod: 6000,
                deliveryRatePctCod: 0.80
            });

            // Loss = 6000 + 5000 = 11000
            // WeightedLoss = 11000 * 0.20 = 2200
            // RequiredDelivered = (12000 + 2200) / 0.80 = 17750
            // SuggestedPrice = 15000 + 6000 + 5000 + 17750 = 43750
            expect(result.cod.suggestedPrice).toBe(43750);
            expect(result.cod.deliveredProfit).toBe(17750);
            expect(result.cod.weightedProfit).toBe(12000);
        });

        it('handles edge case when deliveryRatePct is 0 without dividing by zero', () => {
            const result = calculateSuggestedPrices(10000, { deliveryRatePctCod: 0 });
            expect(Number.isFinite(result.cod.suggestedPrice)).toBe(true);
        });
    });
});
