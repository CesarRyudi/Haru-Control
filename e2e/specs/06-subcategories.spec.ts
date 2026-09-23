import { test, expect } from "../fixtures/base-test";

test.describe("Módulo de Subcategorias (Mobile)", () => {
  test("deve criar, exibir e excluir uma subcategoria com sucesso", async ({ orderBoard, page }) => {
    // 1. Inicia na tela inicial autenticada
    await orderBoard.goto();

    // 2. Navega para Produtos pela barra inferior
    const navProducts = page.locator("button.bottom-nav-item", { hasText: "Produtos" });
    await navProducts.click();

    // 3. Aguarda carregamento da página de produtos
    await expect(page.locator(".products-page")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".page-header h1")).toHaveText("Produtos");

    // 4. Abre o FAB menu e clica em 'Nova Subcategoria'
    const fabButton = page.locator("button.fab-button");
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    const newSubcatBtn = page.locator(".fab-menu-item", { hasText: "Nova Subcategoria" });
    await expect(newSubcatBtn).toBeVisible();
    await newSubcatBtn.click();

    // 5. Preenche o formulário de subcategoria
    const modal = page.locator(".modal", { hasText: "Nova Subcategoria" });
    await expect(modal).toBeVisible();

    // Seleciona a primeira categoria disponível no select
    const categorySelect = modal.locator("select.form-select");
    const optionCount = await categorySelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(1);
    await categorySelect.selectOption({ index: 1 });

    const subcategoryName = `Subcat E2E ${Date.now()}`;
    await modal.locator('input[placeholder*="Clássicos"]').fill(subcategoryName);

    // Salva a nova subcategoria
    await modal.locator("button.btn-primary", { hasText: "Salvar" }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // 6. Valida que a subcategoria recém-criada é exibida na tela
    const createdSubcatTitle = page.locator(".subcategory-title", { hasText: subcategoryName });
    await expect(createdSubcatTitle).toBeVisible({ timeout: 5000 });

    // 7. Clica no botão de editar da subcategoria
    const subcatGroup = page.locator(".subcategory-group", { hasText: subcategoryName });
    await subcatGroup.locator("button.btn-edit-subcat").click();

    const editModal = page.locator(".modal", { hasText: "Editar Subcategoria" });
    await expect(editModal).toBeVisible();

    // 8. Configura o listener para aceitar o prompt/alert de exclusão
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    // 9. Clica em Excluir Subcategoria
    await editModal.locator("button.btn-danger-outline", { hasText: "Excluir Subcategoria" }).click();
    await expect(editModal).not.toBeVisible({ timeout: 5000 });

    // 10. Valida que a subcategoria foi removida
    await expect(createdSubcatTitle).not.toBeVisible({ timeout: 5000 });
  });
});
