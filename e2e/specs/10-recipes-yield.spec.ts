import { test, expect } from "../fixtures/base-test";

test.describe("Edição de Receitas e Peso/Rendimento Equivalente (Massa 1600g -> Cookie 60g)", () => {
  test("deve definir peso de 1600g em uma Massa, usar 60g dela na receita de um Cookie e editar para 80g", async ({
    orderBoard,
    page,
  }) => {
    await orderBoard.goto();

    // 1. Navega para Produtos pela barra inferior
    const navProducts = page.locator("button.bottom-nav-item", { hasText: "Produtos" });
    await navProducts.click();
    await expect(page.locator(".products-page")).toBeVisible({ timeout: 10000 });

    const timestamp = Date.now();
    const massaName = `Massa Base E2E ${timestamp}`;
    const cookieName = `Cookie Recheado E2E ${timestamp}`;

    // 2. Cria o produto Massa (em 'un')
    const fabButton = page.locator("button.fab-button");
    await fabButton.click();
    await page.locator(".fab-menu-item", { hasText: "Novo Produto" }).click();

    const newProductModal = page.locator(".modal", { hasText: "Novo Produto" });
    await expect(newProductModal).toBeVisible();
    await newProductModal.locator('input[type="text"]').first().fill(massaName);
    await newProductModal.locator("button.btn-primary", { hasText: "Salvar" }).click();
    await expect(newProductModal).not.toBeVisible({ timeout: 5000 });

    // 3. Abre a Massa para ir para a tela de Receita e definir Peso = 1600g
    const massaCard = page.locator(".product-card", { hasText: massaName });
    await expect(massaCard).toBeVisible({ timeout: 5000 });
    await massaCard.click();

    const editProductModal = page.locator(".modal", { hasText: "Editar Produto" });
    await expect(editProductModal).toBeVisible();
    await editProductModal.locator("button.btn-info-outline", { hasText: "Receita" }).click();

    // 4. Na tela de Receita da Massa, define o Peso / Rendimento de 1600g
    await expect(page.locator(".page-header h1")).toContainText("Receita");
    const defineYieldBtn = page.locator("button", { hasText: "Definir Peso" });
    await expect(defineYieldBtn).toBeVisible();
    await defineYieldBtn.click();

    const yieldModal = page.locator(".modal", { hasText: "Peso / Rendimento da Receita" });
    await expect(yieldModal).toBeVisible();
    await yieldModal.locator("button", { hasText: "1600g" }).click();
    await yieldModal.locator("button.btn-primary", { hasText: "Salvar Rendimento" }).click();
    await expect(yieldModal).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(".products-page")).toContainText("1600 g");

    // 5. Volta para Produtos e cria o Cookie
    await page.locator(".page-header button").first().click();
    await expect(page.locator(".page-header h1")).toHaveText("Produtos");

    await fabButton.click();
    await page.locator(".fab-menu-item", { hasText: "Novo Produto" }).click();
    await expect(newProductModal).toBeVisible();
    await newProductModal.locator('input[type="text"]').first().fill(cookieName);
    await newProductModal.locator("button.btn-primary", { hasText: "Salvar" }).click();
    await expect(newProductModal).not.toBeVisible({ timeout: 5000 });

    // 6. Abre a Receita do Cookie
    const cookieCard = page.locator(".product-card", { hasText: cookieName });
    await expect(cookieCard).toBeVisible({ timeout: 5000 });
    await cookieCard.click();
    await expect(editProductModal).toBeVisible();
    await editProductModal.locator("button.btn-info-outline", { hasText: "Receita" }).click();

    // 7. Adiciona a Massa na receita do Cookie usando 60g
    await fabButton.click();
    await page.locator(".fab-menu-item", { hasText: "Adicionar Ingrediente" }).click();

    const addIngModal = page.locator(".modal", { hasText: "Adicionar Ingrediente" });
    await expect(addIngModal).toBeVisible();

    const ingSelect = addIngModal.locator("select.form-select").first();
    await ingSelect.selectOption({ label: `${massaName} (Estoque em un • 1 un = 1600g)` });

    // Seleciona o preset de 60g
    await addIngModal.locator("button", { hasText: "60g" }).click();
    await expect(addIngModal).toContainText("0.0375 un no estoque");

    await addIngModal.locator("button.btn-primary", { hasText: "Adicionar" }).click();
    await expect(addIngModal).not.toBeVisible({ timeout: 5000 });

    // 8. Valida que o card do ingrediente aparece com 60 g e a conversão (0.0375 un no estoque)
    const recipeItemCard = page.locator(".product-card", { hasText: massaName });
    await expect(recipeItemCard).toBeVisible();
    await expect(recipeItemCard).toContainText("60 g");
    await expect(recipeItemCard).toContainText("0.0375 un no estoque");

    // 9. Clica no card do ingrediente para EDITAR de 60g para 80g
    await recipeItemCard.click();
    const editIngModal = page.locator(".modal", { hasText: "Editar Ingrediente" });
    await expect(editIngModal).toBeVisible();

    await editIngModal.locator("button", { hasText: "80g" }).click();
    await expect(editIngModal).toContainText("0.05 un no estoque");

    await editIngModal.locator("button.btn-primary", { hasText: "Salvar Alterações" }).click();
    await expect(editIngModal).not.toBeVisible({ timeout: 5000 });

    // 10. Valida que a receita foi atualizada para 80 g (0.05 un no estoque)
    await expect(recipeItemCard).toContainText("80 g");
    await expect(recipeItemCard).toContainText("0.05 un no estoque");

    // 11. Limpeza: remove o ingrediente da receita
    page.once("dialog", (d) => d.accept());
    await recipeItemCard.locator('button[title="Remover ingrediente"]').click();
    await expect(recipeItemCard).not.toBeVisible({ timeout: 5000 });
  });

  test("deve dar entrada de 1600 gramas no estoque de forma simples com presets de rendimento", async ({
    orderBoard,
    page,
  }) => {
    await orderBoard.goto();

    const timestamp = Date.now();
    const massaName = `Massa Estoque E2E ${timestamp}`;

    // 1. Cria a Massa em Produtos com Rendimento de 1600g
    const navProducts = page.locator("button.bottom-nav-item", { hasText: "Produtos" });
    await navProducts.click();
    await expect(page.locator(".products-page")).toBeVisible({ timeout: 10000 });

    const fabButton = page.locator("button.fab-button");
    await fabButton.click();
    await page.locator(".fab-menu-item", { hasText: "Novo Produto" }).click();

    const newProductModal = page.locator(".modal", { hasText: "Novo Produto" });
    await expect(newProductModal).toBeVisible();
    await newProductModal.locator('input[type="text"]').first().fill(massaName);
    await newProductModal.locator('input[type="number"]').last().fill("1600");
    await newProductModal.locator("button.btn-primary", { hasText: "Salvar" }).click();
    await expect(newProductModal).not.toBeVisible({ timeout: 5000 });

    // 2. Navega para Estoque
    const navStock = page.locator("button.bottom-nav-item", { hasText: "Estoque" });
    await navStock.click();
    await expect(page.locator(".stock-page")).toBeVisible({ timeout: 10000 });

    // 3. Localiza o card da Massa no estoque e valida o badge
    const stockCard = page.locator(".product-card", { hasText: massaName });
    await expect(stockCard).toBeVisible({ timeout: 5000 });
    await expect(stockCard).toContainText("1600g");

    // 4. Clica no card para abrir o modal de Entrada de Estoque
    await stockCard.click();
    const stockModal = page.locator(".modal", { hasText: "Entrada de Estoque" });
    await expect(stockModal).toBeVisible();

    // 5. Valida que o modal abriu com 1600g preenchido e preset de 1 Receita ativo
    const yieldBox = stockModal.locator(".yield-preset-box");
    await expect(yieldBox).toBeVisible();
    await expect(yieldBox).toContainText("1600 g");

    const btn1Receita = yieldBox.locator("button", { hasText: "1 Receita (1600g)" });
    await expect(btn1Receita).toBeVisible();
    await expect(btn1Receita).toHaveClass(/active/);

    // Valida o label do campo indicando gramas
    await expect(stockModal).toContainText("Quantidade a adicionar (g)");
    const qtyInput = stockModal.locator(".number-input-container input");
    await expect(qtyInput).toHaveValue("1600");

    // Valida atalho de 2 receitas
    const btn2Receitas = yieldBox.locator("button", { hasText: "2 Receitas (3200g)" });
    await btn2Receitas.click();
    await expect(qtyInput).toHaveValue("3200");
    await expect(btn2Receitas).toHaveClass(/active/);

    // Retorna para 1 receita (1600g)
    await btn1Receita.click();
    await expect(qtyInput).toHaveValue("1600");

    // Valida o preview do novo saldo (+1 un (~1600 g))
    await expect(stockModal).toContainText("Novo saldo previsto:");
    await expect(stockModal).toContainText("1 un");
    await expect(stockModal).toContainText("(~1600 g)");

    // 6. Confirma a entrada de 1600g
    await stockModal.locator("button.btn-primary", { hasText: "Confirmar Entrada" }).click();
    await expect(stockModal).not.toBeVisible({ timeout: 5000 });

    // 7. Valida que o card no estoque foi atualizado para 1 un (~1600 g)
    await expect(stockCard).toContainText("1 un");
    await expect(stockCard).toContainText("(~1600 g)");
  });
});

