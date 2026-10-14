import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { setupMockApi } from '../fixtures/mockApi';

test.describe('E2E: Exploración de Catálogo y Navegación a Detalle', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockApi(page);
    });

    test('el usuario navega desde el catálogo a la ficha técnica del producto', async ({ page }) => {
        const homePage = new HomePage(page);
        const productPage = new ProductPage(page);

        // 1. Cargar la Home
        await homePage.goto();

        // 2. Verificar que se renderiza el producto en tendencia
        await expect(page.getByText('Depiladora Láser E2E').first()).toBeVisible();
        await expect(page.getByText('🔥 GANADOR')).toBeVisible();

        // 3. Hacer clic en "Ver Detalles"
        const detailsBtn = page.getByRole('link', { name: 'Ver Detalles' });
        await detailsBtn.click();

        // 4. Validar redirección a la ruta /product/e2e-prod-1
        await expect(page).toHaveURL(/\/product\/e2e-prod-1/);

        // 5. Verificar métricas clave en la ficha técnica
        await expect(page.getByRole('heading', { level: 1, name: 'Depiladora Láser E2E' })).toBeVisible();
        await expect(page.getByText('$ 89.900').first()).toBeVisible();
        await expect(productPage.providerLink).toHaveAttribute('href', 'https://dropi.co/products/e2e-1');

        // 6. Volver a la Home
        await productPage.backBtn.click();
        await expect(page).toHaveURL('/');
    });
});
