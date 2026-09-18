# 🐛 Repositório Canônico de Bugs - Haru Control

> **AI Instruction:** Este é o repositório central de bugs do projeto **Haru Control**. Sempre que um bug for identificado ou reportado pelo usuário, use a skill **`report-bug`** para triagem e registro. Todo bug recebe um ID único sequencial (`BUG-001`, `BUG-002`, ...), é espelhado no topo de `docs/TASKS.md` e recebe prioridade máxima de trabalho.

---

## 📌 Índice de Bugs

| ID | Status | Validação Prática | Severidade | Título Curto | Componente Afetado | Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-000` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Exemplo de Bug de Demonstração (Template) | `src/example.ts` | 2026-09-02 |
| `BUG-001` | `[x]` Resolvido | `✅ Validado` | `🔴 Alta` | Erros de CORS nas requisições da API no frontend | `apps/api/src/main.ts`, `Dockerfile.mobile` | 2026-09-02 |
| `BUG-002` | `[x]` Resolvido | `✅ Validado` | `🟡 Média` | Quebra de layout e overflow no modal de pedidos históricos | `apps/mobile/src/pages/OrderHistory.tsx`, `apps/mobile/src/pages/OrderForm.tsx` | 2026-09-11 |
| `BUG-003` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Botão redundante de Histórico no cabeçalho e posição incorreta na BottomNavigation | `apps/mobile/src/pages/OrderBoard.tsx`, `apps/mobile/src/components/BottomNavigation.tsx` | 2026-09-17 |
| `BUG-004` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Limite de altura forçando rolagem interna nas categorias de produtos em OrderForm | `apps/mobile/src/pages/OrderForm.css` | 2026-09-17 |
| `BUG-005` | `[ ]` Aberto | `⏳ Pendente` | `🟢 Baixa` | Chips de seleção de motivo do descarte sem feedback visual | `apps/mobile/src/pages/OrderForm.tsx` | 2026-09-18 |

---

## 🔍 Registro Detalhado de Bugs

### [BUG-001] Erros de CORS nas requisições da API no frontend
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🔴 Alta`
- **Data de Registro:** 2026-09-02
- **Data de Implementação:** 2026-09-02
- **Data de Validação:** 2026-09-17
- **Componentes / Arquivos Afetados:** `apps/api/src/main.ts`, `Dockerfile.mobile`, `apps/mobile/src/services/api.ts`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Ao carregar as telas do aplicativo frontend no navegador/mobile (ex: board de pedidos, produtos, clientes), as chamadas para `/orders`, `/products` e `/customers` falham com status `CORS error`.
- **Passos para Reproduzir:**
  1. Acessar a aplicação frontend em produção/dev no Coolify.
  2. Abrir o DevTools (aba Network) ao carregar o dashboard/board.
  3. Observar chamadas HTTP falhando em vermelho com "CORS error".
- **Comportamento Esperado:** As requisições HTTP devem ser aceitas e respondidas com os headers CORS corretos (`Access-Control-Allow-Origin`, preflight `OPTIONS` respondido adequadamente) e direcionadas à URL correta da API.
- **Logs / Erros de Console:** `CORS error (xhr)` em `orders`, `products`, `customers`.

#### 2. Onde está o problema (Localização Técnica)
1. **NestJS CORS:** `app.enableCors()` em `apps/api/src/main.ts` estava utilizando a configuração padrão sem declaração explícita de `origin: true`, métodos HTTP permitidos e headers de preflight.
2. **Docker Build-time Args:** `Dockerfile.mobile` não possuía declaração de `ARG VITE_API_URL` e `ENV VITE_API_URL=$VITE_API_URL`. Como o Vite injeta variáveis em tempo de compilação (`nx build mobile --prod`), sem essa instrução o frontend compilava com fallback para `http://localhost:3000` em vez da URL da API remota.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Inicialização do deploy em ambiente multi-domínio (Coolify) onde o frontend roda em um subdomínio/porta e a API em outro, exigindo headers CORS permissivos dinâmicos e injeção de build arguments no Docker.

#### 4. Como foi resolvido (Solução Aplicada)
- `apps/api/src/main.ts`: Configurado `app.enableCors({ origin: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', credentials: true, allowedHeaders: '...' })`.
- `Dockerfile.mobile`: Inseridas as diretivas `ARG VITE_API_URL` e `ENV VITE_API_URL=$VITE_API_URL` antes do comando de build do Vite.

#### 5. Lições Aprendidas & Prevenção Futura
- Sempre configurar `enableCors({ origin: true, credentials: true, methods: [...] })` em APIs NestJS desacopladas de SPA.
- Declarar explicitamente `ARG` e `ENV` em Dockerfiles de SPAs (Vite/React) para variáveis de build time.

### [BUG-002] Quebra de layout e overflow no modal de pedidos históricos
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟡 Média`
- **Data de Registro:** 2026-09-11
- **Data de Implementação:** 2026-09-11
- **Data de Validação:** 2026-09-17
- **Componentes / Arquivos Afetados:** `apps/mobile/src/pages/OrderHistory.tsx`, `apps/mobile/src/pages/OrderHistory.css`, `apps/mobile/src/pages/OrderForm.tsx`, `e2e/page-objects/OrderHistoryPage.ts`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Ao abrir o modal de "Novo Pedido Histórico" ou "Editar Pedido" na tela de histórico (`/orders/history`), o conteúdo dos itens e campos transborda para o lado direito da tela (horizontal overflow), cortando elementos e tornando o uso em dispositivos móveis visualmente quebrado e desconfortável.
- **Passos para Reproduzir:**
  1. Acessar `/orders/history` no mobile ou tela com largura restrita.
  2. Clicar em "＋ Pedido Histórico" ou "✏️ Editar Pedido".
  3. Observar que a seção de itens e campos do formulário ultrapassa a largura máxima do modal, forçando scroll horizontal indesejado e cortando botões.
- **Comportamento Esperado:** Formulário com layout responsivo, espaçoso e consistente, idealmente reaproveitando a tela canônica já existente de pedidos (`OrderForm`).
- **Logs / Erros de Console:** Nenhum erro de console reportado (falha de layout/CSS e duplicação de responsabilidade de UI).

#### 2. Onde está o problema (Localização Técnica)
- O modal inline em `OrderHistory.tsx` e `OrderHistory.css` tentava recriar um formulário completo de pedido (seleção de produtos, inputs de quantidade, preço unitário, datas, cliente e totais) em uma janela modal com restrições de largura fixa (`max-width: 600px`, grids de múltiplas colunas e tabelas de itens comprimidas).
- Além do problema visual de CSS, havia uma duplicidade arquitetural: já existe a tela completa e validada de pedidos (`OrderForm.tsx` em `/orders/new` e `/orders/:id/edit`), que já suporta seleção de categorias, busca de clientes com modal dedicado, controle de estoque e avisos.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Implementação inicial da feature de histórico onde optou-se por um modal local rápido para cadastrar pedidos históricos, em vez de estender a tela canônica `OrderForm` para aceitar parâmetros de pedidos retroativos (datas customizadas e status concluído).

#### 4. Como foi resolvido (Solução Aplicada)
- Unificação arquitetural: os modais duplicados e quebrados em `OrderHistory.tsx` e `OrderHistory.css` foram completamente eliminados (~700 linhas de código removidas).
- "＋ Pedido Histórico" agora redireciona diretamente para `/orders/new?retroactive=true`.
- "✏️ Editar Pedido" nos cards agora redireciona para `/orders/${order.id}/edit`.
- `OrderForm.tsx` foi aprimorado para suportar data retroativa (`createdAt`), data de conclusão (`completedAt`) e `status` customizado via um card dedicado e limpo, desativando o alerta Pushover por padrão em pedidos históricos e redirecionando de volta ao histórico ao salvar.
- A suíte E2E (`OrderHistoryPage.ts` e `04-history-retroactive.spec.ts`) foi adaptada e executada com 100% de sucesso.

#### 5. Lições Aprendidas & Prevenção Futura
- Evitar duplicar fluxos complexos de criação/edição em modais comprimidos quando já existe uma tela canônica de página inteira (Full Page Form) testada e adaptada para mobile. Reaproveitar a rota existente com suporte a parâmetros retroativos reduz manutenção e padroniza a UX.

---

### [BUG-000] Exemplo de Bug de Demonstração (Template)
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-02
- **Data de Implementação:** 2026-09-02
- **Data de Validação:** 2026-09-02
- **Componentes / Arquivos Afetados:** `src/example.ts`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Demonstração do padrão estruturado de registro e triagem de bugs para o Haru Control.
- **Passos para Reproduzir:**
  1. Passo 1 de exemplo.
  2. Passo 2 de exemplo.
- **Comportamento Esperado:** Funcionamento regular de acordo com as especificações.
- **Logs / Erros de Console:** `Nenhum erro de console reportado`

#### 2. Onde está o problema (Localização Técnica)
- Diagnóstico técnico do componente, função ou query com problema.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Análise da causa raiz (ex: falta de validação de nulo, concorrência, tipagem frouxa).

#### 4. Como foi resolvido (Solução Aplicada)
- Explicação clara da correção aplicada no código.

#### 5. Lições Aprendidas & Prevenção Futura
- Medidas de blindagem preventiva adotadas para evitar regressões futuras.

---

### [BUG-003] Botão redundante de Histórico no cabeçalho e posição incorreta na BottomNavigation
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-17
- **Data de Implementação:** 2026-09-17
- **Data de Validação:** 2026-09-17
- **Componentes / Arquivos Afetados:** `apps/mobile/src/pages/OrderBoard.tsx`, `apps/mobile/src/components/BottomNavigation.tsx`, `e2e/page-objects/OrderBoardPage.ts`, `e2e/specs/04-history-retroactive.spec.ts`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- O botão de "Histórico" continuava visível no topo da tela do quadro de pedidos (`OrderBoard.tsx`), ao lado do botão de "Insights", mesmo após a criação da rota dedicada e entrada na barra de navegação inferior. Além disso, a aba correspondente na barra inferior (`BottomNavigation`) estava posicionada logo no início da lista (segunda posição, rotulada provisoriamente como "Pedidos"), em vez de ocupar a última posição como aba de histórico.
- **Passos para Reproduzir:**
  1. Acessar a tela inicial do aplicativo (`/`).
  2. Observar a presença simultânea do botão "Histórico" no cabeçalho superior direito e de um item na barra de navegação inferior.
  3. Observar a ordem dos ícones na barra inferior (`Início`, `Pedidos`, `Clientes`, `Produtos`, `Produção`, `Estoque`).
- **Comportamento Esperado:**
  - O cabeçalho deve conter apenas os botões auxiliares pertinentes ("Insights" e "Ajuda").
  - A barra inferior (`BottomNavigation`) deve exibir a aba `📜 Histórico` posicionada como o último item da navegação (`Início`, `Clientes`, `Produtos`, `Produção`, `Estoque`, `Histórico`).
- **Logs / Erros de Console:** Nenhum erro de console. Problema de consistência de navegação e UI/UX.

#### 2. Onde está o problema (Localização Técnica)
- `apps/mobile/src/pages/OrderBoard.tsx`: Botão `<button className="history-btn-header">` no cabeçalho `<header className="board-header">`.
- `apps/mobile/src/components/BottomNavigation.tsx`: Array `navItems` com o item `/orders/history` na segunda posição com label "Pedidos".

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Durante a introdução da funcionalidade de histórico de pedidos retroativos (Fase 2), o botão de atalho de topo foi implementado temporariamente para acesso rápido. Na sequência, quando o item foi inserido no `BottomNavigation`, o botão do cabeçalho não havia sido removido e a ordenação final das abas ficou no início da barra em vez de ao final.

#### 4. Como foi resolvido (Solução Aplicada)
- Removido o botão redundante `history-btn-header` do cabeçalho em `OrderBoard.tsx`.
- Reordenado o array `navItems` em `BottomNavigation.tsx`, reposicionando `{ path: "/orders/history", icon: "📜", label: "Histórico" }` como o sexto e último item.
- Atualizados os Page Objects (`OrderBoardPage.ts`) e a suíte de testes E2E (`04-history-retroactive.spec.ts`) para interagir com a aba "Histórico" da `BottomNavigation`.

#### 5. Lições Aprendidas & Prevenção Futura
- Ao promover um botão de ação de topo a entidade primária na navegação persistente inferior (Bottom Navigation), garantir a remoção imediata dos atalhos transitórios para manter a interface limpa e prevenir duplicação de pontos de entrada.

---

### [BUG-004] Limite de altura forçando rolagem interna nas categorias de produtos em OrderForm
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-17
- **Data de Implementação:** 2026-09-17
- **Data de Validação:** 2026-09-17
- **Componentes / Arquivos Afetados:** `apps/mobile/src/pages/OrderForm.css`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Na tela de criação/edição de pedidos (`OrderForm`), cada categoria agrupa seus produtos dentro de um contêiner `.products-grid`. Quando uma categoria possui mais de 6 produtos, era acionado um limite fixo de altura (`max-height: 70vh`) com `overflow-y: auto`, forçando uma barra de rolagem interna minúscula e desconfortável em vez de expandir a caixa verticalmente no fluxo natural da página.
- **Passos para Reproduzir:**
  1. Acessar a tela de novo pedido (`/orders/new`).
  2. Localizar uma categoria que contenha mais de 6 itens cadastrados.
  3. Observar a presença de barra de rolagem interna na grade dessa categoria.
- **Comportamento Esperado:** O container da categoria deve crescer dinamicamente para comportar todos os produtos de forma contínua, permitindo que a rolagem principal da página gerencie toda a visualização sem aninhamento de barras de rolagem.
- **Logs / Erros de Console:** Nenhum erro de console reportado/observado.

#### 2. Onde está o problema (Localização Técnica)
- Regra CSS `.order-form .products-grid` em `apps/mobile/src/pages/OrderForm.css`, que impunha `max-height: 70vh;` e `overflow-y: auto;`.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Foi introduzida uma trava rígida de altura durante o desenvolvimento inicial para evitar listas longas em resoluções de desktop, desconsiderando o padrão mobile-first onde a rolagem nativa de página é muito mais ergonômica.

#### 4. Como foi resolvido (Solução Aplicada)
- Removidas as propriedades `max-height: 70vh;` e `overflow-y: auto;` da classe `.order-form .products-grid` em `apps/mobile/src/pages/OrderForm.css`.
- As caixas de categoria de produtos agora crescem organicamente para comportar qualquer quantidade de itens cadastrados, delegando o scroll à viewport vertical da aplicação.
- Validado via compilação completa do mobile app com 100% de sucesso.

---

### [BUG-005] Chips de seleção de motivo do descarte sem feedback visual
- **Status:** `[x]` Implementado
- **Validação Prática:** `⏳ Pendente`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-18
- **Data de Implementação:** 2026-09-18
- **Data de Validação:** N/A
- **Componentes / Arquivos Afetados:** `apps/mobile/src/pages/OrderForm.tsx`, `apps/mobile/src/pages/OrderForm.css`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Na tela de criação no modo Descarte (`OrderForm`), ao tocar nos chips de motivo do descarte ("Validade Vencida", "Quebra / Avaria", "Falha de Forno / Preparo", "Teste / Degustação", "Outro Motivo"), a interface não refletia o estado selecionado (não aplicava o fundo vermelho, texto branco ou sombra ativa), aparentando que a seleção não estava funcionando.
- **Passos para Reproduzir:**
  1. Acessar `/orders/new?mode=waste` ou alternar para o modo "Descarte de Estoque".
  2. Rolar até a seção "Motivo do Descarte".
  3. Clicar em qualquer chip de motivo (ex: "Falha de Forno / Preparo").
  4. Observar que o botão não assume o estilo de ativo.
- **Comportamento Esperado:** O chip selecionado deve receber imediatamente o destaque visual ativo (`.active`) com fundo vermelho, texto em branco e contraste definido.
- **Logs / Erros de Console:** Nenhum erro de console reportado.

#### 2. Onde está o problema (Localização Técnica)
- Incompatibilidade de nomenclatura de classes CSS entre `OrderForm.css` (que declarava `.waste-reason-chip` e `.waste-reason-chip.active`) e `OrderForm.tsx` (que renderizava os botões com a classe `.waste-chip-btn`).

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Durante a criação do formulário unificado, a classe CSS definida no arquivo de estilos divergiu ligeiramente da classe aplicada no componente JSX, impedindo a aplicação das regras de estilo e da pseudo-classe de seleção ativa.

#### 4. Como foi resolvido (Solução Aplicada)
- Unificados os seletores CSS em `OrderForm.css` aplicando regras conjuntas para `.waste-reason-chip, .waste-chip-btn` e `.waste-reason-chip.active, .waste-chip-btn.active`.
- Atualizado o JSX em `OrderForm.tsx` para passar ambas as classes (`waste-reason-chip waste-chip-btn`) e renderizar a lista via `Object.values(WasteReason)`.
- Validado em compilação completa com 100% de sucesso.

#### 5. Lições Aprendidas & Prevenção Futura
- Padronizar seletores de classes de componentes ou usar aliasing em CSS para classes variantes (`.waste-reason-chip, .waste-chip-btn`) prevenindo divergências entre estilização e JSX.

---
