const {
    encodeCursor,
    decodeCursor,
    buildPaginationCursors
} = require('../../src/helpers/cursorPagination');

describe('Cursor Pagination Helper - Unit Tests (Strict)', () => {
    describe('encodeCursor and decodeCursor', () => {
        it('encodes and decodes cursor object to and from base64 string accurately', () => {
            const original = { value: 25000, id: 14, dir: 'next' };
            const encoded = encodeCursor(original);

            expect(typeof encoded).toBe('string');
            expect(encoded).not.toBe('');

            const decoded = decodeCursor(encoded);
            expect(decoded).toEqual(original);
        });

        it('returns null when decodeCursor receives null, undefined or empty string', () => {
            expect(decodeCursor(null)).toBeNull();
            expect(decodeCursor(undefined)).toBeNull();
            expect(decodeCursor('')).toBeNull();
        });

        it('throws an error with statusCode 400 when cursor is invalid base64 or corrupted json', () => {
            expect(() => decodeCursor('not-a-valid-base64-json@@@')).toThrow();
            try {
                decodeCursor('not-a-valid-base64-json@@@');
            } catch (err) {
                expect(err.statusCode).toBe(400);
                expect(err.message).toMatch(/Cursor inválido/i);
            }
        });

        it('throws an error with statusCode 400 when decoded JSON lacks required fields', () => {
            const incompleteCursor = Buffer.from(JSON.stringify({ someField: 'foo' })).toString('base64');
            try {
                decodeCursor(incompleteCursor);
                throw new Error('Should have failed');
            } catch (err) {
                expect(err.statusCode).toBe(400);
                expect(err.message).toMatch(/Cursor inválido/i);
            }
        });
    });

    describe('buildPaginationCursors', () => {
        const orderColumn = 'totalProfit';

        it('builds nextCursor when hasMore is true on forward pagination', () => {
            const results = [
                { id: 1, totalProfit: 50000 },
                { id: 2, totalProfit: 40000 }
            ];

            const pagination = buildPaginationCursors({
                results,
                orderColumn,
                hasMore: true,
                isPrev: false,
                currentCursor: null
            });

            expect(pagination.prevCursor).toBeNull();
            expect(pagination.nextCursor).toBeDefined();

            const decodedNext = decodeCursor(pagination.nextCursor);
            expect(decodedNext).toEqual({ value: 40000, id: 2, dir: 'next' });
        });

        it('builds prevCursor and nextCursor when navigating pages', () => {
            const results = [
                { id: 3, totalProfit: 30000 },
                { id: 4, totalProfit: 20000 }
            ];

            const pagination = buildPaginationCursors({
                results,
                orderColumn,
                hasMore: true,
                isPrev: false,
                currentCursor: 'someExistingCursor'
            });

            expect(pagination.prevCursor).toBeDefined();
            expect(pagination.nextCursor).toBeDefined();

            const decodedPrev = decodeCursor(pagination.prevCursor);
            expect(decodedPrev).toEqual({ value: 30000, id: 3, dir: 'prev' });
        });

        it('handles backward pagination (isPrev: true)', () => {
            const results = [
                { id: 1, totalProfit: 50000 },
                { id: 2, totalProfit: 40000 }
            ];

            const pagination = buildPaginationCursors({
                results,
                orderColumn,
                hasMore: false, // Reached start
                isPrev: true,
                currentCursor: 'somePrevCursor'
            });

            expect(pagination.prevCursor).toBeNull(); // No more previous records
            expect(pagination.nextCursor).toBeDefined();
        });
    });
});
