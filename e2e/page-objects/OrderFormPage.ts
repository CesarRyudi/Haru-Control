import { Page, Locator, expect } from "@playwright/test";

export class OrderFormPage {
  readonly page: Page;
  readonly addressInput: Locator;
  readonly selectCustomerButton: Locator;
  readonly customerSearchInput: Locator;
  readonly deliveryFeeInput: Locator;
  readonly notifyCheckbox: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addressInput = page.locator("textarea#address");
    this.selectCustomerButton = page.locator("button.btn-select-customer");
    this.customerSearchInput = page.locator(".modal .address-input");
    this.deliveryFeeInput = page.locator("input#deliveryFee");
    this.notifyCheckbox = page.locator(".notify-section input[type='checkbox']");
    this.saveButton = page.locator("button.btn-save");
  }

  async goto() {
    await this.page.goto("/orders/new");
    await expect(this.saveButton).toBeVisible({ timeout: 10000 });
  }

  async selectCustomer(customerName: string) {
    await this.selectCustomerButton.click();
    await this.customerSearchInput.fill(customerName);
    const card = this.page.locator(".modal .customer-card", { hasText: customerName });
    await card.first().click();
  }

  async fillAddress(address: string) {
    await this.addressInput.fill(address);
  }

  async setDeliveryFee(fee: number) {
    await this.deliveryFeeInput.fill(fee.toString());
  }

  async setNotify(enabled: boolean) {
    const isChecked = await this.notifyCheckbox.isChecked();
    if (isChecked !== enabled) {
      await this.notifyCheckbox.click();
    }
  }

  async addProduct(productName: string, quantity: number = 1) {
    const productCard = this.page.locator(".product-card", { hasText: productName });
    await expect(productCard.first()).toBeVisible();

    // Se o produto ainda não foi adicionado ao carrinho, clica em "Adicionar"
    const addButton = productCard.first().locator("button.btn-add-wide");
    if (await addButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await addButton.click();
    }

    // Se a quantidade desejada for maior que 1, clica no '+' no cartão
    if (quantity > 1) {
      const plusButton = productCard.first().locator("button.btn-qty", { hasText: "+" });
      for (let i = 1; i < quantity; i++) {
        await plusButton.click();
      }
    }
  }

  async submit() {
    await this.saveButton.click();

    // Se aparecer modal de warning de estoque negativo, clica em continuar mesmo assim
    const warningButton = this.page.locator("button.btn-primary", { hasText: "Continuar Mesmo Assim" });
    if (await warningButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await warningButton.click();
    }

    // Redireciona para o Kanban após salvar
    await expect(this.page).toHaveURL(/.*\/(\?.*)?$/, { timeout: 10000 });
  }
}
