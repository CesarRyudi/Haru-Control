import { test, expect } from "../fixtures/base-test";

test.describe("Integração de Pix Copia e Cola com Valor Exato", () => {
  test("deve colapsar Pix por default, exibir QR Code ao tocar, remover cópia do card e copiar mensagem de confirmação no modal", async ({
    orderBoard,
    page,
    context,
  }) => {
    // 1. Concede permissões de clipboard para o browser de teste
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // 2. Inicia na tela inicial autenticada
    await orderBoard.goto();

    // 3. Localiza o primeiro card de pedido com total > 0
    const card = page.locator(".order-card").first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // 4. Valida ausência de botões de cópia no card (ações de cópia ficam centralizadas no modal)
    await expect(card.locator(".btn-copy")).not.toBeVisible();
    await expect(card.locator(".btn-copy-pix")).not.toBeVisible();

    // 5. Clica no card para abrir o modal de detalhes do pedido
    await card.click();

    const modal = page.locator(".order-modal-content");
    await expect(modal).toBeVisible();

    // 6. Valida que a seção Pix inicia colapsada por default (sem QR Code visível)
    const pixSection = modal.locator(".order-modal-pix-section");
    await expect(pixSection).toBeVisible();
    await expect(pixSection.locator(".pix-section-title")).toContainText("Pix Copia e Cola");
    await expect(pixSection.locator(".pix-toggle-indicator")).toContainText("▼ QR Code");
    await expect(pixSection.locator(".pix-qr-container")).not.toBeVisible();
    await expect(pixSection.locator(".pix-code-preview")).not.toBeVisible();

    // 7. Clica no botão "Copiar Código" diretamente na linha do Pix colapsada
    const modalCopyPixBtn = pixSection.locator(".btn-pix-modal-copy");
    await expect(modalCopyPixBtn).toBeVisible();
    await modalCopyPixBtn.click();

    // Valida Toast de confirmação do Pix
    const toastPix = page.locator(".toast");
    await expect(toastPix).toBeVisible({ timeout: 5000 });
    await expect(toastPix).toContainText("Pix Copia e Cola copiado!");

    // Lê o conteúdo da área de transferência e valida formato EMVCo BR Code do Banco Central
    const pixClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(pixClipboard).toContain("000201");
    expect(pixClipboard).toContain("br.gov.bcb.pix");
    expect(pixClipboard).toContain("HARU COOKIES");

    // Aguarda o toast sumir para o próximo teste
    await toastPix.click().catch(() => {});

    // 8. Toca no cabeçalho do Pix para expandir e exibir o QR Code
    await pixSection.locator(".pix-section-header").click();
    await expect(pixSection.locator(".pix-toggle-indicator")).toContainText("▲ Fechar QR");
    await expect(pixSection.locator(".pix-qr-container")).toBeVisible();
    await expect(pixSection.locator(".pix-qr-image")).toBeVisible();
    await expect(pixSection.locator(".pix-code-preview code")).toContainText("000201");

    // 9. Clica no botão de copiar mensagem de confirmação para WhatsApp dentro do modal
    const btnCopyConfirmation = modal.locator(".btn-modal-copy-confirmation");
    await expect(btnCopyConfirmation).toBeVisible();
    await btnCopyConfirmation.click();

    // Valida Toast de confirmação da comanda
    const toastOrder = page.locator(".toast");
    await expect(toastOrder).toBeVisible({ timeout: 5000 });
    await expect(toastOrder).toContainText("Mensagem de confirmação copiada!");

    // Lê a mensagem e valida formato original (sem embutir o Pix no texto, enviado à parte)
    const orderClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(orderClipboard).toContain("Então são:");
    expect(orderClipboard).toContain("Valor total:");
    expect(orderClipboard).not.toContain("🔑 *Pix Copia e Cola");
    expect(orderClipboard).toContain("Certo?");

    // 10. Fecha o modal
    await modal.locator(".btn-close-modal").click();
    await expect(modal).not.toBeVisible();
  });
});
