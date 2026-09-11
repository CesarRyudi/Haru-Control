import { Page, Locator, expect } from "@playwright/test";

export type OrderTab = "Rascunho" | "Produção" | "Em Entrega" | "Concluídos";

export class OrderBoardPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly historyButton: Locator;
  readonly insightsButton: Locator;
  readonly tabs: Locator;
  readonly boardContent: Locator;
  readonly fabButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.locator(".board-header h1");
    this.historyButton = page.locator("button.history-btn-header");
    this.insightsButton = page.locator("button.insights-btn-header");
    this.tabs = page.locator(".tab-btn");
    this.boardContent = page.locator(".board-content");
    this.fabButton = page.locator("button.fab-button");
  }

  async goto() {
    await this.page.goto("/");
    await expect(this.boardContent).toBeVisible({ timeout: 10000 });
  }

  async changeTab(tabName: OrderTab) {
    const tab = this.page.locator(".tab-btn", { hasText: tabName });
    await tab.click();
    await expect(tab).toHaveClass(/active/);
  }

  async getActiveTab(): Promise<string> {
    const activeTab = this.page.locator(".tab-btn.active");
    return (await activeTab.textContent()) || "";
  }

  getOrderCards() {
    return this.page.locator(".board-column.active-column .order-card");
  }

  getOrderCard(orderIdPrefix: string) {
    return this.page.locator(".order-card", { hasText: orderIdPrefix });
  }

  async advanceOrder(orderIdPrefix: string) {
    const card = this.getOrderCard(orderIdPrefix);
    await card.locator("button.btn-advance").click();
  }

  async acknowledgeOrder(orderIdPrefix: string) {
    const card = this.getOrderCard(orderIdPrefix);
    await card.locator("button.ack-pending").click();
  }

  async clickNewOrder() {
    await this.fabButton.click();
    await expect(this.page).toHaveURL(/.*\/orders\/new/);
  }

  async goToHistory() {
    await this.historyButton.click();
    await expect(this.page).toHaveURL(/.*\/orders\/history/);
  }

  /**
   * Simula um swipe (deslizar) horizontal com touch na tela
   */
  async swipeLeft() {
    const box = await this.boardContent.boundingBox();
    if (!box) return;

    const startX = box.x + box.width * 0.8;
    const endX = box.x + box.width * 0.2;
    const y = box.y + box.height * 0.5;

    await this.page.touchscreen.tap(startX, y);
    // Emular movimento touch: touchstart -> touchmove -> touchend
    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, y, { steps: 10 });
    await this.page.mouse.up();
  }

  async swipeRight() {
    const box = await this.boardContent.boundingBox();
    if (!box) return;

    const startX = box.x + box.width * 0.2;
    const endX = box.x + box.width * 0.8;
    const y = box.y + box.height * 0.5;

    await this.page.touchscreen.tap(startX, y);
    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, y, { steps: 10 });
    await this.page.mouse.up();
  }
}
