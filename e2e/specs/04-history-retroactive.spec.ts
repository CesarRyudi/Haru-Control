import { test, expect } from "../fixtures/base-test";

test.describe("Histórico de Pedidos & Lançamento Retroativo", () => {
  test("deve acessar a tela de histórico, cadastrar um pedido retroativo e filtrar", async ({
    orderBoard,
    orderHistory,
    page,
  }) => {
    // 1. Navega do Kanban até o Histórico pelo botão do cabeçalho
    await orderBoard.goto();
    await orderBoard.goToHistory();

    // 2. Valida elementos da página
    await expect(page.locator(".history-header h1")).toContainText("Histórico");
    await expect(orderHistory.newHistoricalOrderButton).toBeVisible();

    // 3. Cadastra um pedido histórico retroativo
    const uniqueAddress = `Casa ${Math.floor(Math.random() * 900) + 100} Retroativo E2E`;
    await orderHistory.createHistoricalOrder({
      address: uniqueAddress,
      deliveryFee: 4,
    });

    // 4. Filtra pelo endereço específico do pedido
    await orderHistory.filterBySearch(uniqueAddress);

    // 5. Valida que o pedido recém-criado aparece na lista filtrada
    const foundCard = page.locator(".history-order-card", { hasText: uniqueAddress });
    await expect(foundCard).toBeVisible({ timeout: 5000 });
  });

  test("deve acessar Pedidos pela barra de navegação inferior e utilizar filtros rápidos de data", async ({
    orderBoard,
    page,
  }) => {
    // 1. Inicia na tela inicial
    await orderBoard.goto();

    // 2. Clica no item "Pedidos" da barra inferior de navegação
    const navPedidosButton = page.locator("button.bottom-nav-item", { hasText: "Pedidos" });
    await expect(navPedidosButton).toBeVisible();
    await navPedidosButton.click();

    // 3. Valida que navegou para o histórico de pedidos e a aba inferior está ativa
    await expect(page).toHaveURL(/.*orders\/history/);
    await expect(navPedidosButton).toHaveClass(/active/);

    // 4. Testa os chips de filtros rápidos de data
    const chipHoje = page.locator("button.quick-filter-chip", { hasText: "Hoje" });
    const chip7Dias = page.locator("button.quick-filter-chip", { hasText: "Últimos 7 dias" });
    const chipEsteMes = page.locator("button.quick-filter-chip", { hasText: "Este Mês" });
    const chipTodos = page.locator("button.quick-filter-chip", { hasText: "Todos" });

    await expect(chipHoje).toBeVisible();
    await chipHoje.click();
    await expect(chipHoje).toHaveClass(/active/);

    await chip7Dias.click();
    await expect(chip7Dias).toHaveClass(/active/);
    await expect(chipHoje).not.toHaveClass(/active/);

    await chipEsteMes.click();
    await expect(chipEsteMes).toHaveClass(/active/);

    await chipTodos.click();
    await expect(chipTodos).toHaveClass(/active/);
  });
});
