import { Page, Locator, expect } from "@playwright/test";

export class OrderHistoryPage {
  readonly page: Page;
  readonly newHistoricalOrderButton: Locator;
  readonly searchInput: Locator;
  readonly statusSelect: Locator;
  readonly filterButton: Locator;
  readonly clearFilterButton: Locator;
  readonly orderCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newHistoricalOrderButton = page.locator("button.btn-new-retroactive");
    this.searchInput = page.locator("input.filter-input[placeholder*='Ex: Maria']");
    this.statusSelect = page.locator(".filter-group select.filter-select");
    this.filterButton = page.locator(".filter-actions button.btn-primary");
    this.clearFilterButton = page.locator("button.btn-clear-filter");
    this.orderCards = page.locator(".history-order-card");
  }

  async goto() {
    await this.page.goto("/orders/history");
    await expect(this.newHistoricalOrderButton).toBeVisible({ timeout: 10000 });
  }

  async filterBySearch(text: string) {
    await this.searchInput.fill(text);
    await this.filterButton.click();
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string) {
    await this.statusSelect.selectOption(status);
    await this.filterButton.click();
    await this.page.waitForTimeout(500);
  }

  async clearFilters() {
    await this.clearFilterButton.click();
    await this.page.waitForTimeout(500);
  }

  getOrderCards() {
    return this.orderCards;
  }

  async openNewHistoricalOrder() {
    await this.newHistoricalOrderButton.click();
    await expect(this.page).toHaveURL(/.*orders\/new\?retroactive=true/, { timeout: 10000 });
    await expect(this.page.locator(".order-form h1")).toContainText("Novo Pedido Histórico");
  }

  async createHistoricalOrder(options: {
    address?: string;
    deliveryFee?: number;
  } = {}) {
    await this.openNewHistoricalOrder();

    if (options.address) {
      await this.page.locator("textarea#address").fill(options.address);
    }

    if (options.deliveryFee !== undefined) {
      await this.page.locator("input#deliveryFee").fill(options.deliveryFee.toString());
    }

    // Adiciona o primeiro produto da lista
    const addBtn = this.page.locator("button.btn-add-wide").first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Salva o pedido histórico
    const saveBtn = this.page.locator("button.btn-save");
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Aguarda retorno para a listagem do histórico
    await expect(this.page).toHaveURL(/.*orders\/history/, { timeout: 10000 });
    await expect(this.newHistoricalOrderButton).toBeVisible({ timeout: 10000 });
  }
}
