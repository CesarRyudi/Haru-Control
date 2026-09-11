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
});
