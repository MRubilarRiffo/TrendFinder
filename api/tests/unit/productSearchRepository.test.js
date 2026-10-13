const { extractSearchTokens, ORDER_MAP } = require('../../src/repositories/ProductSearchRepository');

describe('ProductSearchRepository - Unit Tests (Strict)', () => {
    describe('extractSearchTokens', () => {
        it('extracts word tokens and strips percentage signs (%) to prevent wildcard injection', () => {
            expect(extractSearchTokens('100% original')).toEqual(['100', 'original']);
        });

        it('extracts word tokens and strips underscores (_) to prevent single-character wildcard injection', () => {
            expect(extractSearchTokens('product_name_test')).toEqual(['product', 'name', 'test']);
        });

        it('extracts word tokens and strips backslashes (\\)', () => {
            expect(extractSearchTokens('path\\to\\item')).toEqual(['path', 'to', 'item']);
        });

        it('handles combined special characters safely', () => {
            expect(extractSearchTokens('50%_discount\\offer')).toEqual(['50', 'discount', 'offer']);
        });

        it('returns regular words correctly', () => {
            expect(extractSearchTokens('Cepillo Alisador Pro')).toEqual(['Cepillo', 'Alisador', 'Pro']);
        });

        it('returns empty array when input is only wildcards or empty', () => {
            expect(extractSearchTokens('%%%%%')).toEqual([]);
            expect(extractSearchTokens('___')).toEqual([]);
            expect(extractSearchTokens('')).toEqual([]);
            expect(extractSearchTokens(null)).toEqual([]);
        });
    });

    describe('ORDER_MAP', () => {
        it('defines all required sort keys with deterministic tie-breakers', () => {
            const expectedKeys = ['recent', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'];
            expectedKeys.forEach(key => {
                expect(ORDER_MAP[key]).toBeDefined();
                expect(Array.isArray(ORDER_MAP[key])).toBe(true);
                expect(ORDER_MAP[key].length).toBe(2); // primary order + tie-breaker
            });
        });
    });
});
