import { describe, it, expect, vi } from 'vitest';
import { 
    getTrendingProducts, 
    getLatestProducts, 
    getProductStats, 
    searchProducts 
} from '../trendFinder';

describe('trendFinder API Service (Real Network Lifecycle via MSW)', () => {
    it('getTrendingProducts obtiene la lista paginada y productos en tendencia', async () => {
        const response = await getTrendingProducts(7, 'Colombia', 'profit', null, {
            desiredProfitCod: 25000,
            deliveryRatePctCod: 0.8
        });

        expect(response.success).toBe(true);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.nextCursor).toBe('next-cursor-token');
    });

    it('getLatestProducts obtiene los productos más recientes', async () => {
        const response = await getLatestProducts();

        expect(response.success).toBe(true);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0].name).toBe('Humidificador Ultrasónico LED');
    });

    it('getProductStats obtiene estadísticas detalladas de un producto por ID', async () => {
        const response = await getProductStats('prod-101', '2026-03-01', '2026-03-07', 'Colombia');

        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data.name).toBe('Depiladora Láser IPL');
        expect(response.data.salesInfo.totalQuantitySold).toBe(120);
        expect(response.data.salesHistory).toHaveLength(7);
    });

    it('getProductStats retorna fallback controlado { success: false, data: null } ante error de red', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const response = await getProductStats('error-id', '2026-03-01', '2026-03-07');

        expect(response.success).toBe(false);
        expect(response.data).toBeNull();
        consoleSpy.mockRestore();
    });

    it('searchProducts busca productos con parámetros de consulta y paginación', async () => {
        const response = await searchProducts('reloj', {
            country: 'Chile',
            page: 1,
            limit: 12,
            sortBy: 'recent'
        });

        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].country).toBe('Chile');
        expect(response.pagination.totalMatches).toBe(1);
    });
});
