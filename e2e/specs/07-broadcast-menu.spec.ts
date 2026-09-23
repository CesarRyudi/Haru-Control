import { test, expect } from "../fixtures/base-test";

test.describe("Divulgação de Cookies Disponíveis (WhatsApp Broadcast)", () => {
  test("deve abrir o modal pelo FAB de Estoque, permitir edição e copiar a mensagem formatada", async ({
    orderBoard,
    page,
    context,
  }) => {
    // 1. Concede permissões de clipboard para o browser de teste
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // 2. Inicia na tela inicial autenticada
    await orderBoard.goto();

    // 3. Navega para Estoque pela barra inferior
    const navStock = page.locator("button.bottom-nav-item", { hasText: "Estoque" });
    await navStock.click();

    // 4. Aguarda carregamento da página de estoque
    await expect(page.locator(".stock-page")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".page-header h1")).toHaveText("Estoque");

    // 5. Abre o FAB menu
    const fabButton = page.locator("button.fab-button");
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // 6. Localiza e clica na ação de divulgar cookies
    const broadcastBtn = page.locator(".fab-menu-item", { hasText: "Divulgar Cookies Disponíveis" });
    await expect(broadcastBtn).toBeVisible();
    await broadcastBtn.click();

    // 7. Valida que o modal de divulgação abriu
    const modal = page.locator(".broadcast-modal-container");
    await expect(modal).toBeVisible();
    await expect(modal.locator(".broadcast-modal-title h2")).toHaveText("Divulgar Cookies Disponíveis");

    // 8. Valida o campo de saudação inicial (pré-populado com Bom dia / Boa tarde / Boa noite)
    const greetingInput = modal.locator(".broadcast-input");
    await expect(greetingInput).toBeVisible();
    const currentGreeting = await greetingInput.inputValue();
    expect(["Bom dia", "Boa tarde", "Boa noite"]).toContain(currentGreeting);

    // Altera a saudação para validar reatividade
    await greetingInput.fill("Boa Tardee");

    // 9. Preenche o campo de mensagem contextual
    const contextTextarea = modal.locator(".broadcast-textarea");
    await expect(contextTextarea).toBeVisible();
    await contextTextarea.fill("Nesse friozinho, nada melhor que um cookie🌧️🥰");

    // 10. Valida a pré-visualização em tempo real da mensagem formatada
    const previewText = modal.locator(".broadcast-preview-text");
    await expect(previewText).toBeVisible();
    await expect(previewText).toContainText("🌟🌟 *Boa Tardee* 🌟🌟");
    await expect(previewText).toContainText("*Nesse friozinho, nada melhor que um cookie🌧️🥰*");
    await expect(previewText).toContainText("https://wa.me/c/5511976952264");

    // 11. Clica no botão de copiar mensagem
    const copyButton = modal.locator(".broadcast-btn-copy");
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // 12. Valida fechamento do modal e exibição do Toast de confirmação
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    const toast = page.locator(".toast", { hasText: "Cardápio copiado" });
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});
