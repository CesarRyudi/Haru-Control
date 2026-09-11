import { test, expect } from "../fixtures/base-test";

test.describe("Autenticação por PIN (Mobile)", () => {
  test.beforeEach(async ({ loginPage }) => {
    // Garante que o teste inicie sem sessão prévia
    await loginPage.goto();
    await loginPage.page.evaluate(() => localStorage.clear());
    await loginPage.goto();
  });

  test("deve exibir erro ao digitar PIN incorreto", async ({ loginPage }) => {
    await loginPage.fillPin("9999");
    await loginPage.submit();

    const error = await loginPage.getErrorMessage();
    expect(error).toContain("PIN inválido");
  });

  test("deve autenticar com sucesso ao digitar PIN correto", async ({ loginPage, page }) => {
    await loginPage.fillPin("1234");
    await loginPage.submit();

    // Se houver prompt de biometria, pula
    try {
      await loginPage.skipBiometricsButton.waitFor({ state: "visible", timeout: 5000 });
      await loginPage.skipBiometricsButton.click();
    } catch {
      // Prompt não apareceu, prossegue
    }

    // Deve carregar o cabeçalho do Kanban
    await expect(page.locator(".board-header h1")).toHaveText("Pedidos", { timeout: 15000 });
  });
});
