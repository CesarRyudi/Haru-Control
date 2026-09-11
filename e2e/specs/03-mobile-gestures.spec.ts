import { test, expect } from "../fixtures/base-test";

test.describe("Navegação Mobile & Gestos de Swipe", () => {
  test("deve alternar entre as abas ao clicar diretamente nos botões superiores", async ({
    orderBoard,
    page,
  }) => {
    await orderBoard.goto();

    await orderBoard.changeTab("Produção");
    await expect(page.locator(".tab-btn", { hasText: "Produção" })).toHaveClass(/active/);

    await orderBoard.changeTab("Em Entrega");
    await expect(page.locator(".tab-btn", { hasText: "Em Entrega" })).toHaveClass(/active/);

    await orderBoard.changeTab("Concluídos");
    await expect(page.locator(".tab-btn", { hasText: "Concluídos" })).toHaveClass(/active/);

    await orderBoard.changeTab("Rascunho");
    await expect(page.locator(".tab-btn", { hasText: "Rascunho" })).toHaveClass(/active/);
  });

  test("deve avançar e retroceder de abas via gesto de swipe horizontal (touch)", async ({
    orderBoard,
    page,
  }) => {
    await orderBoard.goto();
    await orderBoard.changeTab("Rascunho");

    const boardContent = page.locator(".board-content");

    // 1. Deslizar para a esquerda (swipe left: deltaX < 0) -> Deve avançar para 'Produção'
    await boardContent.dispatchEvent("touchstart", {
      touches: [{ identifier: 0, clientX: 300, clientY: 300 }],
    });
    await boardContent.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 0, clientX: 100, clientY: 300 }],
    });

    await expect(page.locator(".tab-btn", { hasText: "Produção" })).toHaveClass(/active/, { timeout: 3000 });

    // 2. Deslizar para a direita (swipe right: deltaX > 0) -> Deve retroceder para 'Rascunho'
    await boardContent.dispatchEvent("touchstart", {
      touches: [{ identifier: 0, clientX: 100, clientY: 300 }],
    });
    await boardContent.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 0, clientX: 300, clientY: 300 }],
    });

    await expect(page.locator(".tab-btn", { hasText: "Rascunho" })).toHaveClass(/active/, { timeout: 3000 });
  });
});
