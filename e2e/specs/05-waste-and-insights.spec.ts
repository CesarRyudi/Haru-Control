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

    // 4. Valida navegação para a tela unificada no modo descarte
    await expect(page).toHaveURL(/.*orders\/new\?mode=waste/);
    const modeSelect = page.locator("select.form-mode-select");
    await expect(modeSelect).toHaveValue("waste");

    // 5. Adiciona o primeiro produto da lista
    const addBtn = page.locator(".products-grid .btn-add-wide").first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 6. Seleciona motivo do descarte (ex: Falha de Forno / Preparo)
    const reasonChip = page.locator(".waste-chip-btn", { hasText: "Falha de Forno / Preparo" });
    await expect(reasonChip).toBeVisible();
    await reasonChip.click();
    await expect(reasonChip).toHaveClass(/active/);

    // 7. Informa observação
    const notesTextarea = page.locator("textarea#wasteNotes");
    await notesTextarea.fill("Perda de teste E2E - Forno descalibrado");

    // 8. Submete o descarte
    const submitButton = page.locator("button.btn-save-waste");
    await expect(submitButton).toContainText("Registrar Descarte");
    await submitButton.click();

    // 9. Valida que retornou para a tela de estoque
    await expect(page).toHaveURL(/.*stock/, { timeout: 10000 });
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
    const periodSelect = page.locator("select.insights-period-select");
    await expect(periodSelect).toHaveValue("this_month");

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
