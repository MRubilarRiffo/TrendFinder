const {
    validators,
    validations,
    normalizeCountry,
    validatePositiveIntegerId,
    validateDateRange
} = require('../../src/helpers/validations');

describe('Validations Helper - Unit Tests (Strict)', () => {
    describe('normalizeCountry', () => {
        it('normalizes valid countries regardless of casing and accents', () => {
            expect(normalizeCountry('colombia')).toBe('Colombia');
            expect(normalizeCountry('CHILE')).toBe('Chile');
            expect(normalizeCountry('mexico')).toBe('México');
            expect(normalizeCountry('México')).toBe('México');
            expect(normalizeCountry('panama')).toBe('Panamá');
            expect(normalizeCountry('Perú')).toBe('Perú');
            expect(normalizeCountry('peru')).toBe('Perú');
            expect(normalizeCountry('Ecuador')).toBe('Ecuador');
            expect(normalizeCountry('España')).toBe('España');
        });

        it('returns null for unknown countries or empty values', () => {
            expect(normalizeCountry('Argentina')).toBeNull();
            expect(normalizeCountry('Atlantis')).toBeNull();
            expect(normalizeCountry('')).toBeNull();
            expect(normalizeCountry(null)).toBeNull();
            expect(normalizeCountry(undefined)).toBeNull();
        });
    });

    describe('validatePositiveIntegerId', () => {
        it('returns true for positive integers as numbers or numeric strings', () => {
            expect(validatePositiveIntegerId(1)).toBe(true);
            expect(validatePositiveIntegerId('42')).toBe(true);
            expect(validatePositiveIntegerId('1000')).toBe(true);
        });

        it('returns false for 0, negative numbers, decimals, non-numbers and empty values', () => {
            expect(validatePositiveIntegerId(0)).toBe(false);
            expect(validatePositiveIntegerId('0')).toBe(false);
            expect(validatePositiveIntegerId(-5)).toBe(false);
            expect(validatePositiveIntegerId('-10')).toBe(false);
            expect(validatePositiveIntegerId(3.14)).toBe(false);
            expect(validatePositiveIntegerId('3.14')).toBe(false);
            expect(validatePositiveIntegerId('abc')).toBe(false);
            expect(validatePositiveIntegerId(null)).toBe(false);
            expect(validatePositiveIntegerId(undefined)).toBe(false);
        });
    });

    describe('validateDateRange', () => {
        it('accepts undefined/null dates (optional)', () => {
            expect(validateDateRange()).toEqual({ valid: true });
            expect(validateDateRange(null, null)).toEqual({ valid: true });
        });

        it('validates correct ISO format and startDate <= endDate', () => {
            expect(validateDateRange('2026-01-01', '2026-01-31')).toEqual({ valid: true });
            expect(validateDateRange('2026-05-10', '2026-05-10')).toEqual({ valid: true });
        });

        it('rejects invalid date strings', () => {
            const res = validateDateRange('not-a-date', '2026-01-31');
            expect(res.valid).toBe(false);
            expect(res.error).toMatch(/formato YYYY-MM-DD/i);
        });

        it('rejects startDate later than endDate', () => {
            const res = validateDateRange('2026-02-15', '2026-01-10');
            expect(res.valid).toBe(false);
            expect(res.error).toMatch(/startDate no puede ser posterior/i);
        });
    });

    describe('validators and validations core engine', () => {
        it('validates rules and returns error map', () => {
            const rules = {
                name: { required: true, type: 'string' },
                age: { type: 'number', greaterThan: 18 }
            };

            const errors = validations({ name: '', age: 15 }, rules);
            expect(errors.name).toBeDefined();
            expect(errors.age).toBeDefined();
        });
    });
});
