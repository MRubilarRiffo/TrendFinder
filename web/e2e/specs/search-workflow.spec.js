import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { setupMockApi } from '../fixtures/mockApi';

test.describe('E2E: Flujo de Búsqueda y Filtros de Catálogo', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockApi(page);
    });

    test('el usuario busca un término, filtra por país y cierra los resultados', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // 1. Realizar búsqueda
        await homePage.searchProduct('auriculares');

        // 2. Verificar que se despliegan los resultados
        await expect(page.getByText('Resultados para “auriculares”')).toBeVisible();
        await expect(page.getByText('Producto E2E auriculares')).toBeVisible();

        // 3. Filtrar por Chile
        await homePage.filterByCountry('Chile');
        await expect(page.getByText('📍 Chile')).toBeVisible();

        // 4. Cerrar el panel de resultados
        await homePage.closeSearchResultsBtn.click();
        await expect(page.getByText('Resultados para “auriculares”')).not.toBeVisible();
    });
});
