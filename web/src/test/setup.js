import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import axios from 'axios';
import { server } from './server';

// Ensure Axios uses fetch in tests so MSW intercepts it cleanly in jsdom
axios.defaults.adapter = 'fetch';

// Stub scroll methods not implemented in jsdom
if (typeof window !== 'undefined') {
    window.scrollTo = () => {};
    if (window.HTMLElement) {
        window.HTMLElement.prototype.scrollIntoView = function() {};
    }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => {
    cleanup();
    server.resetHandlers();
});

afterAll(() => server.close());
