const errorMiddleware = require('../../src/middleware/errorMiddleware');

describe('errorMiddleware - Unit Tests (Security & Sanitization)', () => {
    let req;
    let res;
    let next;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('sanitizes 500 errors in production to avoid leaking database internals', () => {
        process.env.NODE_ENV = 'production';

        const rawDbError = new Error('SQLSTATE[HY000]: Table "dropi_db.secret_table" does not exist');
        // No statusCode set -> defaults to 500

        errorMiddleware(rawDbError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Error interno del servidor'
        });
    });

    it('preserves client errors (e.g. 400 Bad Request) even in production', () => {
        process.env.NODE_ENV = 'production';

        const clientError = new Error('ID de producto debe ser un entero positivo');
        clientError.statusCode = 400;

        errorMiddleware(clientError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'ID de producto debe ser un entero positivo'
        });
    });

    it('exposes detailed message when NOT in production for debugging', () => {
        process.env.NODE_ENV = 'development';

        const rawError = new Error('Syntax error in SQL query');

        errorMiddleware(rawError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Syntax error in SQL query'
        });
    });

    it('returns validationErrors when attached to the error object', () => {
        const validationError = new Error('Parámetros inválidos');
        validationError.statusCode = 400;
        validationError.validationErrors = { days: 'Debe ser 1, 7 o 30' };

        errorMiddleware(validationError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Parámetros inválidos',
            validationErrors: { days: 'Debe ser 1, 7 o 30' }
        });
    });
});
