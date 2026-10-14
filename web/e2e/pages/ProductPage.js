export class ProductPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.backBtn = page.getByRole('link', { name: /Inicio/i });
        this.providerLink = page.getByRole('link', { name: /Ver en Proveedor/i });
    }

    async goto(productId) {
        await this.page.goto(`/product/${productId}`);
    }
}
