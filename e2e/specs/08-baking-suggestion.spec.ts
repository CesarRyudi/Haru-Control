import { test, expect } from "../fixtures/base-test";

test.describe("Previsão de Demanda e Sugestão de Fornada Multi-Dias", () => {
  test("deve renderizar o painel no estoque, permitir alternância de início (hoje/amanhã) e presets, exibir equação e copiar resumo", async ({
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

    // 5. Abre o menu flutuante (FAB) e clica em "Sugestão de Fornada"
    const fabButton = page.locator("button.fab-button");
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    const bakingMenuItem = page.locator(".fab-menu-item", { hasText: "Sugestão de Fornada" });
    await expect(bakingMenuItem).toBeVisible();
    await bakingMenuItem.click();

    // 6. Aguarda abertura do modal de fornada
    await expect(page.locator(".baking-modal-container")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".baking-suggestion-title h2")).toContainText("Sugestão de Fornada & Planejamento");

    // 5. Valida os controles de início (Hoje vs Amanhã)
    const btnToday = page.locator(".horizon-chip", { hasText: "De Hoje" });
    const btnTomorrow = page.locator(".horizon-chip", { hasText: "A partir de Amanhã" });
    await expect(btnToday).toBeVisible();
    await expect(btnTomorrow).toBeVisible();
    await expect(btnToday).toHaveClass(/active/);

    // 6. Alterna para "A partir de Amanhã"
    await btnTomorrow.click();
    await expect(btnTomorrow).toHaveClass(/active/);
    await expect(btnToday).not.toHaveClass(/active/);

    // Retorna para "De Hoje"
    await btnToday.click();
    await expect(btnToday).toHaveClass(/active/);

    // 7. Testa seleção no dropdown dinâmico de término (padrão Insights)
    const periodSelect = page.locator("select.baking-period-select");
    await expect(periodSelect).toBeVisible();
    const options = await periodSelect.locator("option").all();
    expect(options.length).toBeGreaterThan(1);
    const targetVal = await options[1].getAttribute("value");
    if (targetVal) {
      await periodSelect.selectOption(targetVal);
    }

    // Valida que o texto resumo de período foi atualizado
    const summaryText = page.locator(".horizon-summary-text");
    await expect(summaryText).toBeVisible();
    await expect(summaryText).toContainText("Período:");
    await expect(summaryText).toContainText("+10% margem de segurança");

    // 8. Marca "Mostrar todos os cookies" para validar a visualização de produtos
    const showAllCheckbox = page.locator("input[type='checkbox']").first();
    await expect(showAllCheckbox).toBeVisible();
    await showAllCheckbox.check();

    // 9. Valida que os cards de cookies exibem a equação individual (Demanda - Estoque = Assar)
    const productCard = page.locator(".baking-product-card").first();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    const equationBox = productCard.locator(".baking-equation-box");
    await expect(equationBox).toBeVisible();
    await expect(equationBox).toContainText("Demanda:");
    await expect(equationBox).toContainText("Estoque:");

    // 10. Testa a expansão do accordion com a discriminação dia a dia
    const expandBtn = productCard.locator(".btn-expand-breakdown");
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();

    const breakdownDetails = productCard.locator(".baking-breakdown-details");
    await expect(breakdownDetails).toBeVisible();
    await expect(breakdownDetails.locator(".breakdown-grid")).toBeVisible();

    // 11. Testa botão de copiar resumo para WhatsApp/clipboard
    const copySummaryBtn = page.locator(".btn-baking-copy");
    await expect(copySummaryBtn).toBeVisible();
    await copySummaryBtn.click();

    // Valida que o Toast confirmou a cópia
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText("copiado");

    // 12. Se houver botão de Fornar Sugestão visível, testa abertura e cancelamento do modal
    const bakeAllBtn = page.locator(".btn-baking-bake-all");
    const isBakeVisible = await bakeAllBtn.isVisible();
    if (isBakeVisible) {
      await bakeAllBtn.click();
      const bakeModal = page.locator(".bake-modal-sheet");
      await expect(bakeModal).toBeVisible();
      await expect(bakeModal.locator("h3")).toContainText("Registrar Fornada");

      // Fecha o modal pelo botão cancelar
      const cancelBtn = bakeModal.locator(".btn-bake-cancel");
      await cancelBtn.click();
      await expect(bakeModal).not.toBeVisible();
    }
  });
});
