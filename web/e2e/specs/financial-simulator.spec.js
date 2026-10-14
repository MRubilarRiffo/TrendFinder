import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { setupMockApi } from '../fixtures/mockApi';

test.describe('E2E: Simulador Financiero en Tiempo Real', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockApi(page);
    });

    test('el usuario modifica la tasa de entrega y envía los nuevos parámetros al servidor', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        await expect(page.getByText('Depiladora Láser E2E').first()).toBeVisible();

        // Escuchar la petición de red con los nuevos parámetros
        const salesRequestPromise = page.waitForRequest(req => 
            req.url().includes('/api/sales') && req.url().includes('deliveryRatePctCod=0.85')
        );

        // Modificar input de tasa de entrega a 85
        await homePage.deliveryRateInput.fill('85');

        // Hacer clic en Recalcular Precios
        await homePage.recalculatePricesBtn.click();

        // Validar que la petición salió con el porcentaje normalizado
        const request = await salesRequestPromise;
        expect(request.url()).toContain('deliveryRatePctCod=0.85');
    });
});
