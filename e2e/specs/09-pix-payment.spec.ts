import { test, expect } from "../fixtures/base-test";

test.describe("Integração de Pix Copia e Cola com Valor Exato", () => {
  test("deve exibir botão de Pix no card, incluir Pix na comanda e renderizar QR Code no modal", async ({
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

    // 4. Valida a presença dos botões de cópia da comanda (📋) e do Pix (🔑)
    const btnCopyOrder = card.locator(".btn-copy");
    const btnCopyPix = card.locator(".btn-copy-pix");
    await expect(btnCopyOrder).toBeVisible();
    await expect(btnCopyPix).toBeVisible();

    // 5. Clica no botão 🔑 para copiar apenas o Pix Copia e Cola
    await btnCopyPix.click();

    // Valida Toast de confirmação
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

    // 6. Clica no botão 📋 para copiar a comanda completa do WhatsApp
    await btnCopyOrder.click();

    // Valida Toast de confirmação da comanda
    const toastOrder = page.locator(".toast");
    await expect(toastOrder).toBeVisible({ timeout: 5000 });
    await expect(toastOrder).toContainText("Pedido copiado!");

    // Lê a mensagem da comanda e valida que contém os itens, valores e o bloco Pix Copia e Cola
    const orderClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(orderClipboard).toContain("Então são:");
    expect(orderClipboard).toContain("Valor total:");
    expect(orderClipboard).toContain("🔑 *Pix Copia e Cola");
    expect(orderClipboard).toContain("000201");
    expect(orderClipboard).toContain("Certo?");

    // 7. Clica no card para abrir o modal de detalhes do pedido
    await card.click();

    const modal = page.locator(".order-modal-content");
    await expect(modal).toBeVisible();

    // 8. Valida a seção Pix dentro do modal
    const pixSection = modal.locator(".order-modal-pix-section");
    await expect(pixSection).toBeVisible();
    await expect(pixSection.locator(".pix-section-title")).toContainText("Pix Copia e Cola");

    // Valida caixa de código com monospace
    const codePreview = pixSection.locator(".pix-code-preview code");
    await expect(codePreview).toBeVisible();
    await expect(codePreview).toContainText("000201");

    // Valida imagem do QR Code
    const qrImage = pixSection.locator(".pix-qr-image");
    await expect(qrImage).toBeVisible();

    // Valida botão de cópia dentro do modal
    const modalCopyPixBtn = pixSection.locator(".btn-pix-modal-copy");
    await expect(modalCopyPixBtn).toBeVisible();
    await modalCopyPixBtn.click();

    const toastModal = page.locator(".toast");
    await expect(toastModal).toBeVisible({ timeout: 5000 });
    await expect(toastModal).toContainText("Pix Copia e Cola copiado!");

    // Fecha o modal
    await modal.locator(".btn-close-modal").click();
    await expect(modal).not.toBeVisible();
  });
});
