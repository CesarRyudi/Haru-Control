import { test, expect } from "../fixtures/base-test";

test.describe("Módulo de Descarte & Projeção Mensal nos Insights", () => {
  test("deve registrar um descarte de estoque com motivo e observação", async ({
    orderBoard,
    page,
  }) => {
    // 1. Acessa a aplicação e navega até Estoque pela barra inferior
    await orderBoard.goto();
    const navEstoque = page.locator("button.bottom-nav-item", { hasText: "Estoque" });
    await expect(navEstoque).toBeVisible();
    await navEstoque.click();
    await expect(page).toHaveURL(/.*stock/);

    // 2. Abre o Floating Action Button (FAB)
    const fabButton = page.locator("button.fab-button");
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // 3. Clica na opção "Registrar Descarte / Perda"
    const wasteOption = page.locator(".fab-menu-item", { hasText: "Registrar Descarte / Perda" });
    await expect(wasteOption).toBeVisible();
    await wasteOption.click();

    // 4. Valida exibição do modal de descarte
    const modal = page.locator(".modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("h2")).toContainText("Registrar Descarte / Perda");

    // 5. Seleciona o primeiro produto disponível
    const productSelect = modal.locator("select.form-select");
    await expect(productSelect).toBeVisible();
    // Seleciona a segunda opção (primeiro produto real)
    await productSelect.selectOption({ index: 1 });

    // 6. Seleciona motivo do descarte (ex: Falha de Forno / Preparo)
    const reasonChip = modal.locator(".waste-reason-chip", { hasText: "Falha de Forno / Preparo" });
    await expect(reasonChip).toBeVisible();
    await reasonChip.click();
    await expect(reasonChip).toHaveClass(/active/);

    // 7. Informa quantidade e observação
    const qtyInput = modal.locator(".number-input-container input");
    await qtyInput.fill("2");

    const notesTextarea = modal.locator("textarea.form-textarea");
    await notesTextarea.fill("Perda de teste E2E - Forno descalibrado");

    // 8. Submete o descarte
    const submitButton = modal.locator("button[type='submit']");
    await expect(submitButton).toContainText("Registrar Descarte");
    await submitButton.click();

    // 9. Valida que o modal fechou com sucesso
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("deve exibir o card de Projeção Mensal e a seção de Perdas e Descartes nos Insights", async ({
    orderBoard,
    page,
  }) => {
    // 1. Inicia na tela inicial e clica no botão de Insights no cabeçalho
    await orderBoard.goto();
    const insightsBtn = page.locator("button.insights-btn-header");
    await expect(insightsBtn).toBeVisible();
    await insightsBtn.click();
    await expect(page).toHaveURL(/.*insights/);

    // 2. Valida cabeçalho de Insights
    await expect(page.locator("h1.insights-title")).toContainText("Insights & Métricas");

    // 3. Valida que o filtro padrão é o Mês Atual
    const chipMesAtual = page.locator("button.insights-chip.active");
    await expect(chipMesAtual).toContainText("Mês Atual");

    // 4. Valida exibição do Card de Projeção Mensal (Run-Rate)
    const projectionCard = page.locator(".insights-projection-card");
    await expect(projectionCard).toBeVisible({ timeout: 10000 });
    await expect(projectionCard.locator(".projection-title")).toContainText("Projeção Mensal de Faturamento");
    await expect(projectionCard.locator(".projection-badge")).toContainText("Estimativa Run-Rate");

    // 5. Valida a seção de Perdas & Descartes Operacionais
    const wasteSection = page.locator(".insights-section-card", {
      hasText: "Perdas & Descartes Operacionais",
    });
    await expect(wasteSection).toBeVisible();

    // 6. Confere se o KPI de perdas ou breakdown está visível
    const wasteKpiSummary = wasteSection.locator(".waste-kpi-summary");
    await expect(wasteKpiSummary).toBeVisible();
    await expect(wasteSection.locator(".waste-kpi-val.loss-val")).toBeVisible();
  });
});
