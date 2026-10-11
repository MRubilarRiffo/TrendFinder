const { formatPrice } = require('../../src/functions/formatPrice');

describe('Format Price - Unit Tests (Strict)', () => {
    it('formats price correctly for Colombia (COP, 0 decimals)', () => {
        const formatted = formatPrice(15000, 'Colombia');
        expect(formatted).toMatch(/15\.000/);
        expect(formatted).not.toMatch(/,00/);
    });

    it('formats price correctly for Chile (CLP, 0 decimals)', () => {
        const formatted = formatPrice(12990, 'Chile');
        expect(formatted).toMatch(/12\.990/);
        expect(formatted).not.toMatch(/,00/);
    });

    it('formats price correctly for México (MXN, 2 decimals)', () => {
        const formatted = formatPrice(250.5, 'México');
        expect(formatted).toMatch(/250[.,]50/);
    });

    it('formats price correctly for Panamá (PAB / USD, 2 decimals)', () => {
        const formatted = formatPrice(19.99, 'Panamá');
        expect(formatted).toMatch(/19[.,]99/);
    });

    it('formats price correctly when passed as a numeric string (Sequelize DECIMAL)', () => {
        const formatted = formatPrice('15000', 'Colombia');
        expect(formatted).toMatch(/15\.000/);

        const formattedDec = formatPrice('250.50', 'México');
        expect(formattedDec).toMatch(/250[.,]50/);
    });

    it('returns undefined safely when input price is not a valid number or country is missing', () => {
        expect(formatPrice('invalid_string', 'Colombia')).toBeUndefined();
        expect(formatPrice(null, 'Colombia')).toBeUndefined();
        expect(formatPrice(undefined, 'Colombia')).toBeUndefined();
        expect(formatPrice(15000, null)).toBeUndefined();
        expect(formatPrice(15000, '')).toBeUndefined();
    });
});
