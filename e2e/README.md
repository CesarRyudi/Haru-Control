# 🧪 Testes Automatizados E2E — Haru Control

Ambiente de testes ponta a ponta (E2E) com **Playwright** e **TypeScript**, projetado com foco em **Mobile-First** e arquitetura **Page Object Model (POM)**.

---

## 🚀 Comandos Rápidos

| Comando | Descrição |
| :--- | :--- |
| `npm run test:e2e` | Roda todos os testes em segundo plano (Headless) no terminal |
| `npm run test:e2e:ui` | **(Recomendado para QA)** Abre a interface gráfica interativa do Playwright |
| `npm run test:e2e:headed` | Roda os testes com o navegador visível em tela cheia |
| `npm run test:e2e:codegen` | Abre o gerador automático de testes emulando um **Pixel 7** |

---

## 📱 Emulação Mobile-First

O Haru Control é uma aplicação mobile-first. Todos os testes são executados por padrão emulando um **Google Pixel 7**:
- Resolução: **412 x 915**
- Toque na tela ativado: `hasTouch: true`
- Suporte a eventos reais de toque (`touchstart`, `touchend`, gestos de `swipe`)

---

## 📁 Estrutura de Arquivos

```
e2e/
├── .auth/                   # Sessão salva (login reaproveitado automaticamente)
├── fixtures/
│   ├── auth.setup.ts        # Faz o login com PIN uma única vez e gera .auth/user.json
│   └── base-test.ts         # Injeta os Page Objects diretamente nos testes
├── page-objects/            # Classes que representam as telas do app
│   ├── LoginPage.ts         # Ações da tela de PIN
│   ├── OrderBoardPage.ts    # Ações do Kanban (abas, cards, avanço de status, swipe)
│   ├── OrderFormPage.ts     # Ações de criação de pedidos (itens, cliente, taxa)
│   └── OrderHistoryPage.ts  # Ações da tela de Histórico (filtros, busca, pedidos passados)
├── specs/                   # Arquivos de testes (suítes)
│   ├── 01-auth.spec.ts      # Testes de autenticação
│   ├── 02-order-lifecycle.spec.ts # Fluxo completo do pedido (criar -> avançar -> concluir)
│   ├── 03-mobile-gestures.spec.ts # Navegação e gestos de swipe mobile
│   └── 04-history-retroactive.spec.ts # Pedidos retroativos e filtros
└── playwright.config.ts     # Configuração principal
```

---

## 🐍 Guia Rápido: De Python para TypeScript no Playwright

Se você já conhece **Playwright em Python**, a transição para TypeScript é praticamente direta. Veja a comparação:

| Ação | Em Python (`pytest-playwright`) | Em TypeScript (`@playwright/test`) |
| :--- | :--- | :--- |
| **Navegar** | `page.goto("/")` | `await page.goto("/")` |
| **Clicar** | `page.locator("button").click()` | `await page.locator("button").click()` |
| **Preencher campo** | `page.locator("input").fill("texto")` | `await page.locator("input").fill("texto")` |
| **Asserção de visibilidade** | `expect(locator).to_be_visible()` | `await expect(locator).toBeVisible()` |
| **Asserção de texto** | `expect(locator).to_contain_text("Olá")` | `await expect(locator).toContainText("Olá")` |

> 💡 **Dica de Ouro:** Quase todas as chamadas no Playwright TypeScript usam `await` na frente. O VS Code oferece autocompletar completo para todos os métodos e localizadores!

---

## ✍️ Como Criar um Novo Teste

Para criar um novo teste, importe `test` e `expect` de `../fixtures/base-test`. Todos os Page Objects já chegam instanciados para você:

```typescript
import { test, expect } from "../fixtures/base-test";

test("meu novo teste de pedido", async ({ orderBoard, orderForm, page }) => {
  // 1. Ir para o Kanban
  await orderBoard.goto();

  // 2. Abrir formulário
  await orderBoard.clickNewOrder();

  // 3. Preencher e enviar
  await orderForm.fillAddress("Rua das Palmeiras, 120");
  await orderForm.addProduct("Cookie Red Velvet", 2);
  await orderForm.submit();

  // 4. Validar resultado
  const card = page.locator(".order-card", { hasText: "Rua das Palmeiras" });
  await expect(card).toBeVisible();
});
```
