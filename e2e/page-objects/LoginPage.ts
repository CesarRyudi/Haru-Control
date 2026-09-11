import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly pinInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly skipBiometricsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pinInput = page.locator("input.pin-input");
    this.submitButton = page.locator("button.btn-pin-submit");
    this.errorMessage = page.locator("p.error");
    this.skipBiometricsButton = page.getByRole("button", { name: "Agora não" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async fillPin(pin: string) {
    await this.pinInput.fill(pin);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(pin: string = "1234") {
    await this.goto();
    // Se já estiver logado (redirecionou ou não mostrou input), retorna
    const isPinVisible = await this.pinInput.isVisible();
    if (!isPinVisible) {
      return;
    }

    await this.fillPin(pin);
    await this.submit();

    // Aguarda o prompt opcional de biometria aparecer e clica em 'Agora não'
    try {
      await this.skipBiometricsButton.waitFor({ state: "visible", timeout: 5000 });
      await this.skipBiometricsButton.click();
    } catch {
      // Se não exibiu biometria, prossegue normalmente
    }
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible();
    return (await this.errorMessage.textContent()) || "";
  }
}
