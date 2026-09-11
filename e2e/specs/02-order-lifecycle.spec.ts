import { test, expect } from "../fixtures/base-test";

test.describe("Ciclo de Vida do Pedido (Mobile)", () => {
  test("deve criar um novo pedido e avançar de fases no Kanban até concluir", async ({
    orderBoard,
    orderForm,
    page,
  }) => {
    // 1. Acessa o quadro de pedidos
    await orderBoard.goto();

    // 2. Clica no FAB '＋' para abrir o formulário de novo pedido
    await orderBoard.clickNewOrder();

    // 3. Preenche os dados do pedido
    const testAddress = `Apto ${Math.floor(Math.random() * 900) + 100} - Teste E2E`;
    await orderForm.fillAddress(testAddress);
    await orderForm.setDeliveryFee(3);
    await orderForm.setNotify(false); // Desativa alarme celular no teste

    // Adiciona o primeiro produto vendível encontrado
    const firstProduct = page.locator(".product-card h3").first();
    const productName = (await firstProduct.textContent()) || "";
    expect(productName).toBeTruthy();
    await orderForm.addProduct(productName, 1);

    // 4. Submete o pedido
    await orderForm.submit();

    // 5. Verifica se o pedido aparece na aba Rascunho
    await orderBoard.changeTab("Rascunho");
    const orderCard = page.locator(".order-card", { hasText: testAddress });
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // 6. Avança de Rascunho para Em Produção
    await orderCard.locator("button.btn-advance").click();

    // 7. Acessa a aba Produção e valida confirmação (ACK)
    await orderBoard.changeTab("Produção");
    const producingCard = page.locator(".order-card", { hasText: testAddress });
    await expect(producingCard).toBeVisible({ timeout: 10000 });

    // Testa confirmação interna de recebimento (ACK) se estiver pendente
    const ackButton = producingCard.locator("button.ack-pending");
    if (await ackButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ackButton.click();
      await expect(producingCard.locator(".ack-confirmed")).toBeVisible();
    }

    // 8. Avança para Em Entrega
    await producingCard.locator("button.btn-advance").click();

    // 9. Acessa a aba Em Entrega
    await orderBoard.changeTab("Em Entrega");
    const deliveringCard = page.locator(".order-card", { hasText: testAddress });
    await expect(deliveringCard).toBeVisible({ timeout: 10000 });

    // 10. Conclui o pedido
    await deliveringCard.locator("button.btn-advance", { hasText: "Concluir" }).click();

    // 11. Valida que o pedido foi para Concluídos
    await orderBoard.changeTab("Concluídos");
    const completedCard = page.locator(".order-card", { hasText: testAddress });
    await expect(completedCard).toBeVisible({ timeout: 10000 });
  });
});
