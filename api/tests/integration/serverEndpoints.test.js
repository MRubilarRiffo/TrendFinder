const request = require('supertest');
const server = require('../../src/config/server');

describe('Server & Middleware Integration Tests (Strict)', () => {
    describe('404 Not Found JSON Handler', () => {
        it('returns JSON error response with status 404 for undefined routes instead of HTML', async () => {
            const res = await request(server).get('/api/ruta-inexistente-123');

            expect(res.status).toBe(404);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toEqual({
                success: false,
                error: 'Ruta no encontrada'
            });
        });

        it('returns JSON 404 for non-API routes', async () => {
            const res = await request(server).get('/unhandled-root-route');

            expect(res.status).toBe(404);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toEqual({
                success: false,
                error: 'Ruta no encontrada'
            });
        });
    });
});
