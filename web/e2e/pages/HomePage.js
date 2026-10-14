export class HomePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.searchInput = page.getByRole('searchbox', { name: /Término de búsqueda/i });
        this.searchSubmitBtn = page.getByRole('button', { name: /Buscar/i });
        this.countrySelect = page.locator('#search-country-select');
        this.closeSearchResultsBtn = page.getByRole('button', { name: /Cerrar Resultados/i });
        this.recalculatePricesBtn = page.getByRole('button', { name: /Recalcular Precios/i });
        this.deliveryRateInput = page.locator('input[name="deliveryRatePctCod"]');
    }

    async goto() {
        await this.page.goto('/');
    }

    async searchProduct(query) {
        await this.searchInput.fill(query);
        await this.searchSubmitBtn.click();
    }

    async filterByCountry(countryName) {
        await this.countrySelect.selectOption(countryName);
    }
}
