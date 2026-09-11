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

  async openNewHistoricalOrderModal() {
    await this.newHistoricalOrderButton.click();
    await expect(this.page.locator(".history-modal")).toBeVisible();
  }

  async createHistoricalOrder(options: {
    address?: string;
    deliveryFee?: number;
    productIndex?: number;
  } = {}) {
    await this.openNewHistoricalOrderModal();

    if (options.address) {
      await this.page.locator(".history-modal input[placeholder*='Rua']").fill(options.address);
    }

    if (options.deliveryFee !== undefined) {
      await this.page.locator(".history-modal input[type='number']").first().fill(options.deliveryFee.toString());
    }

    // Adiciona o primeiro produto da lista
    await this.page.locator(".modal-items-section button.btn-add-item").click();

    // Salva o pedido histórico
    await this.page.locator(".history-modal-footer button.btn-primary").click();
    await expect(this.page.locator(".history-modal")).toBeHidden({ timeout: 10000 });
  }
}
