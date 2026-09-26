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
| `BUG-005` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Chips de seleção de motivo do descarte sem feedback visual | `apps/mobile/src/pages/OrderForm.tsx` | 2026-09-18 |
| `BUG-006` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Vazamento de scroll da página ao mover drawer do carrinho, ausência de taxa de entrega e ícone incorreto | `apps/mobile/src/pages/OrderForm.tsx`, `apps/mobile/src/pages/OrderForm.css` | 2026-09-19 |
| `BUG-007` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Seleção de texto no long-press dos cards, overflow horizontal nas abas e altura excessiva do container no Kanban | `apps/mobile/src/pages/OrderBoard.tsx`, `apps/mobile/src/pages/OrderBoard.css` | 2026-09-19 |
| `BUG-008` | `[x]` Implementado | `⏳ Pendente` | `🔴 Alta` | Chave Pix de telefone rejeitada por ausência do padrão internacional E.164 (+55) | `libs/utils/src/lib/pix.ts`, `apps/mobile/src/pages/OrderBoard.tsx` | 2026-09-25 |
| `BUG-009` | `[x]` Resolvido | `✅ Validado` | `🟡 Média` | Erro ao carregar previsão de fornada no modal por endpoint incorreto | `apps/mobile/src/components/BakingSuggestionModal.tsx` | 2026-09-25 |
| `BUG-010` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Vazamento de scroll da página ao mover modal de sugestão de fornada no mobile | `apps/mobile/src/components/BakingSuggestionModal.tsx`, `BakingSuggestionModal.css` | 2026-09-25 |

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
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-18
- **Data de Implementação:** 2026-09-18
- **Data de Validação:** 2026-09-23
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

### [BUG-006] Vazamento de scroll da página ao mover drawer do carrinho, ausência de taxa de entrega e ícone incorreto
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-19
- **Data de Implementação:** 2026-09-19
- **Data de Validação:** 2026-09-23
- **Componentes / Arquivos Afetados:** `apps/mobile/src/pages/OrderForm.tsx`, `apps/mobile/src/pages/OrderForm.css`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- 1. Ao abrir o drawer do carrinho no `OrderForm`, dependendo da área tocada ou rolada no mobile (especialmente no overlay, cabeçalho, rodapé ou ao alcançar os limites da lista de itens), a página de pedidos ao fundo rola indevidamente (scroll chaining / vazamento de rolagem).
- 2. O rodapé do drawer exibia apenas o subtotal dos itens, sem discriminar o valor da taxa de entrega e sem somá-lo ao total consolidado do pedido.
- 3. O botão flutuante e cabeçalho exibiam um emoji de sacola de compras (`🛍️`) em vez de um ícone de carrinho de compras (`🛒`).
- **Passos para Reproduzir:**
  1. No formulário de novo pedido (`/orders/new`), adicionar 1 ou mais itens.
  2. Tocar no botão de ver carrinho para abrir o drawer.
  3. Deslizar o dedo sobre o backdrop, cabeçalho ou rodapé do drawer; a página ao fundo rola.
  4. Observar que o rodapé do drawer não inclui o valor da taxa de entrega nem no botão de finalização.
- **Comportamento Esperado:**
  - O scroll do corpo da página deve ficar estritamente bloqueado enquanto o drawer estiver aberto.
  - O rodapé do drawer deve discriminar Subtotal, Taxa de Entrega e Total final consolidado.
  - O ícone do botão e do drawer deve ser um carrinho de compras (`🛒`).
- **Logs / Erros de Console:** Nenhum erro de console reportado.

#### 2. Onde está o problema (Localização Técnica)
- Ausência de trava de overflow/touch no body (`overflow: hidden; touch-action: none;`) durante a montagem do drawer em `OrderForm.tsx`.
- Ausência de `overscroll-behavior: contain` e contenção de eventos `touchmove` nas camadas do drawer em `OrderForm.css`.
- Omissão da variável de estado `deliveryFee` no cálculo do resumo do drawer em `OrderForm.tsx`.
- Uso de `🛍️` em vez de `🛒` em `OrderForm.tsx`.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Na primeira versão da barra flutuante e do drawer, o foco foi na transição visual e no IntersectionObserver, sem aplicar os mecanismos de lock de scroll em touch devices e omitindo a taxa de entrega que estava presente apenas no formulário final.

#### 4. Como foi resolvido (Solução Aplicada)
- **Bloqueio de Scroll no Body:** Adicionado `useEffect` em `OrderForm.tsx` que aplica `document.body.style.overflow = "hidden"` e `document.body.style.touchAction = "none"` enquanto `isCartDrawerOpen` estiver ativo, restaurando os valores originais ao fechar.
- **Prevenção de Eventos Touch e Overscroll:** Adicionados `onTouchMove` com `preventDefault` condicional no overlay e `stopPropagation` no sheet. Em `OrderForm.css`, inseridas propriedades `overscroll-behavior: contain; touch-action: none;` no overlay, cabeçalho e rodapé, e `touch-action: pan-y; -webkit-overflow-scrolling: touch;` na lista de itens.
- **Discriminação da Taxa de Entrega e Total Consolidado:** Inserido bloco `.cart-drawer-pricing-summary` exibindo Subtotal, Taxa de Entrega e Total (`totalCartPrice + deliveryFee`), atualizando também o valor exibido no botão `btn-drawer-checkout`.
- **Ícone Autêntico de Carrinho:** Substituído o emoji `🛍️` por `🛒` no botão flutuante e no título do drawer.
- **Validação:** Compilação do monorepo (`npm run build`) e 10 testes E2E Playwright executados com 100% de sucesso.

#### 5. Lições Aprendidas & Prevenção Futura
- Sempre aplicar lock no body (`document.body.style.overflow = "hidden"`) e `overscroll-behavior: contain` com bloqueio de eventos de toque em modais e bottom sheets mobile.

---

### [BUG-007] Seleção de texto no long-press dos cards, overflow horizontal nas abas e altura excessiva do container no Kanban
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-19
- **Data de Implementação:** 2026-09-19
- **Data de Validação:** 2026-09-23
- **Componentes / Arquivos Afetados:** `apps/mobile/src/pages/OrderBoard.tsx`, `apps/mobile/src/pages/OrderBoard.css`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- 1. Ao realizar o gesto de long-press (500ms) em um card de pedido para acionar a seleção no mobile, o navegador dispara a seleção nativa de texto / lupa sobre os textos do card.
- 2. A barra de abas (`Rascunho`, `Em Preparo`, `Concluídos`) exibe um scroll horizontal indesejado em telas mobile, mesmo havendo espaço suficiente para acomodar as 3 abas uniformemente na largura da tela.
- 3. O container da coluna do Kanban ultrapassa a altura da tela mesmo com zero pedidos, gerando scroll vertical desnecessário contra a barra de navegação inferior (`BottomNavigation`).
- 4. A barra flutuante de ações em lote (`.batch-action-bar`) colidia visualmente atrás do botão flutuante de adicionar pedido (FAB).
- **Passos para Reproduzir:**
  1. Acessar o Quadro de Pedidos (`/orders`).
  2. Pressionar e segurar um card por mais de 500ms; notar a caixa de seleção nativa de texto.
  3. Observar a rolagem horizontal na barra de abas em telas menores.
  4. Observar que a tela rola verticalmente mesmo sem pedidos na coluna.
- **Comportamento Esperado:**
  - O texto do card de pedidos não deve ser selecionável via long-press (`user-select: none`).
  - As 3 abas devem preencher proporcionalmente 100% da largura da tela sem scroll lateral (`flex: 1`).
  - O container da coluna deve se ajustar naturalmente à altura da tela e expandir apenas quando o conteúdo de pedidos demandar.
  - A seleção e transição em lote de pedidos deve ser controlada diretamente no cabeçalho da coluna (checkbox na esquerda e botões na direita), eliminando a barra flutuante conflitante.

#### 2. Onde está o problema (Localização Técnica)
- Falta de `user-select: none; -webkit-user-select: none;` na classe `.order-card`.
- Padding fixo e ausência de `flex: 1` nas classes `.board-tabs` e `.tab-btn`.
- Regra rígida de `height: 100vh` em `.order-board` somada ao `paddingBottom: 80px` do `AppLayout`.
- Posição flutuante fixa de `.batch-action-bar` sobrepondo o `FloatingActionButton`.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Primeira iteração da feature de seleção em lote que utilizou long-press padrão sem supressão de seleção do browser e uma barra flutuante inferior sem prever a sobreposição com o botão flutuante de novo pedido.

#### 4. Como foi resolvido (Solução Aplicada)
- **Supressão de Seleção de Texto:** Aplicado `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;` em `.order-card` e filhos no `OrderBoard.css`, impedindo que o long-press dispare a lupa/seleção de texto nativa do sistema operacional.
- **Abas 100% Responsivas sem Scroll Lateral:** Redefinidas `.board-tabs` e `.tab-btn` com `width: 100%; overflow-x: hidden;` e `flex: 1; min-width: 0;`, distribuindo uniformemente as 3 abas em qualquer largura de tela mobile sem barra de rolagem lateral.
- **Ajuste de Altura e Eliminação do Scroll Desnecessário:** Substituído `height: 100vh; overflow: hidden;` por `min-height: calc(100vh - 80px); box-sizing: border-box;` em `.order-board` e `.board-column` com `height: fit-content;`. O container agora fica contido na tela quando vazio e só expande conforme a quantidade de pedidos adicionados.
- **Ações em Lote Integradas no Cabeçalho:**
  - Eliminada a `.batch-action-bar` flutuante inferior.
  - No cabeçalho da coluna (`.column-header`): adicionado checkbox "Selecionar Todos" à esquerda do título, e botões dinâmicos de transição de status em massa à direita (`🍳 Em Preparo`, `✅ Concluir` e `✕ Cancelar`) quando há pedidos selecionados.
- **Validação:** Compilação com 100% de sucesso (`npm run build`) e suíte Playwright E2E 100% verde (10 passed).

#### 5. Lições Aprendidas & Prevenção Futura
- Sempre aplicar `user-select: none` em elementos com manipuladores de gestos touch/long-press.
- Integrar ações contextuais de listas diretamente no cabeçalho da seção quando já existirem outros elementos flutuantes na tela.

### [BUG-008] Chave Pix de telefone rejeitada pelos bancos por ausência do prefixo internacional E.164 (+55)
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🔴 Alta`
- **Data de Registro:** 2026-09-25
- **Data de Implementação:** 2026-09-25
- **Data de Validação:** 2026-09-25
- **Componentes / Arquivos Afetados:** `libs/utils/src/lib/pix.ts`, `apps/mobile/src/pages/OrderBoard.tsx`, `libs/utils/src/lib/pix.spec.ts`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Ao copiar o código Pix Copia e Cola gerado pelo Haru Control ou escanear o QR Code gerado nos aplicativos bancários (Nubank, Itaú, Inter, etc.), o banco rejeita a transação exibindo erro de que a chave Pix não foi encontrada, que os dados do recebedor não puderam ser identificados ou que o código é inválido. A captura de tela do app bancário fica totalmente preta devido à proteção `FLAG_SECURE` do Android em telas de transação bancária.
- **Passos para Reproduzir:**
  1. No Haru Control, abrir um pedido com valor definido e copiar o código Pix Copia e Cola.
  2. Abrir qualquer aplicativo bancário no celular e selecionar "Pix Copia e Cola".
  3. Colar o código gerado.
  4. O banco retorna erro de consulta de chave ou chave não localizada no DICT.
- **Comportamento Esperado:** O banco deve reconhecer o recebedor (Haru Cookies), o valor monetário exato e permitir a confirmação imediata da transferência Pix.
- **Logs / Erros de Console:** Aplicativo bancário rejeita o payload com erro de dados do destinatário/chave não encontrada.

#### 2. Onde está o problema (Localização Técnica)
- No arquivo `apps/mobile/src/pages/OrderBoard.tsx`, o valor padrão de `pixKey` foi definido como `"11976952264"` (apenas DDD + número, sem `+55`).
- Na especificação técnica do Banco Central do Brasil para o Diretório de Identificadores de Contas Transacionais (DICT), chaves Pix do tipo telefone celular **obrigatoriamente** seguem o formato internacional **E.164** (`+55` seguido do DDD e dos 9 dígitos, totalizando 14 caracteres com o prefixo `+`).
- Quando um número com 11 dígitos sem `+55` é inserido na subtag `01` do EMVCo BR Code, os sistemas bancários tentam interpretá-lo como um CPF (já que CPFs possuem 11 dígitos numéricos). Como o número não possui os dígitos verificadores de um CPF nem corresponde a um CPF cadastrado, o banco falha na busca e rejeita o pagamento.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- O número de telefone celular de contato da Haru Cookies (`11976952264`) foi inserido como chave sem o prefixo internacional `+55` exigido pelo padrão DICT do BACEN para números telefônicos.

#### 4. Como foi resolvido (Solução Aplicada)
- **Normalização Automática de Chaves E.164 (`normalizePixKey`):** Criada função utilitária em `libs/utils/src/lib/pix.ts` com validação matemática de CPF (módulo 11). Se a chave possuir 10 ou 11 dígitos e não for um CPF válido, ou se começar com `55` sem o prefixo `+`, o sistema adiciona automaticamente o prefixo internacional `+55` (ex: `11976952264` ➔ `+5511976952264`), garantindo que o banco reconheça imediatamente como telefone celular no DICT. Chaves de e-mail, EVP (UUID), CPF válido e CNPJ são preservadas.
- **Fallback Seguro em `OrderBoard.tsx`:** Atualizado o valor padrão de `pixKey` para `+5511976952264`.
- **Validação por Testes:** Testes unitários adicionados em `pix.spec.ts` cobrindo normalização com/sem formatação, e-mails, UUIDs, CNPJs e geração do payload canônico.

#### 5. Lições Aprendidas & Prevenção Futura
- Chaves Pix de telefone no Brasil devem sempre seguir rigorosamente a norma internacional E.164 (`+55XXXXXXXXXXX`).
- Adicionar sanitização e normalização inteligente na biblioteca `generatePixPayload`: se uma chave de 10 ou 11 dígitos for informada e não for um CPF válido com algoritmo oficial, prefixar automaticamente com `+55` para garantir conformidade estrita e prevenir erros humanos de configuração em variáveis de ambiente.

---

### [BUG-009] Erro ao carregar previsão de fornada no modal por endpoint incorreto (/analytics/demand-forecast)
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟡 Média`
- **Data de Registro:** 2026-09-25
- **Data de Implementação:** 2026-09-25
- **Data de Validação:** 2026-09-25
- **Componentes / Arquivos Afetados:** `apps/mobile/src/components/BakingSuggestionModal.tsx`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Ao abrir o modal de Sugestão de Fornada através do menu flutuante na tela de Estoque (`/stock`), o aplicativo exibe um toast de erro vermelho com o texto: `"Erro ao carregar previsão de fornada."`. A tela modal permanece vazia sem exibir a lista de cookies e quantidades a assar.
- **Passos para Reproduzir:**
  1. Acessar a tela de Estoque (`/stock`).
  2. Clicar no botão flutuante (FAB) e selecionar "Sugestão de Fornada" (ou abrir o modal diretamente).
  3. Observar o toast de erro imediato `"Erro ao carregar previsão de fornada."`.
- **Comportamento Esperado:** O modal deve carregar a previsão de demanda e o cálculo de fornadas calculados pelo backend (`/stock/baking-suggestion`) de forma transparente e exibir os cookies necessários para o período.
- **Logs / Erros de Console:** `GET http://<host>:3000/analytics/demand-forecast?startDate=...&targetDate=... 404 (Not Found)`. `Erro ao carregar sugestão de fornada: AxiosError: Request failed with status code 404`.

#### 2. Onde está o problema (Localização Técnica)
- No arquivo `apps/mobile/src/components/BakingSuggestionModal.tsx`, a função `loadSuggestions` realizava a chamada HTTP via `api.get("/analytics/demand-forecast", ...)`.
- No backend NestJS (`apps/api`), não existe nenhum módulo ou rota `/analytics/demand-forecast`. O endpoint canônico implementado em `StockController` (`apps/api/src/modules/stock/stock.controller.ts`) é `@Get("baking-suggestion")`, acessível via `GET /stock/baking-suggestion`.

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- Durante a extração da funcionalidade de sugestão de fornada de um card estático para o novo modal responsivo (`BakingSuggestionModal.tsx`), o caminho do endpoint foi escrito incorretamente como `/analytics/demand-forecast` em vez de `/stock/baking-suggestion`. Além disso, o estado inicial `selectedOptionValue` começava como string vazia `""`, o que podia disparar requisições prematuras antes da seleção do período padrão.

#### 4. Como foi resolvido (Solução Aplicada)
- **Correção da Rota:** Alterada a chamada em `BakingSuggestionModal.tsx` para `api.get("/stock/baking-suggestion", ...)`, alinhando perfeitamente com os parâmetros `startDate` e `targetDate` esperados pelo `StockController` e `BakingSuggestionService`.
- **Inicialização Síncrona do Período Padrão:** Extraída a função geradora de opções dinâmicas `getDynamicBakingOptions` e inicializado `selectedOptionValue` diretamente com o valor da primeira opção padrão válida, eliminando disparos duplicados ou inconsistentes na montagem inicial do modal.
- **Validação Prática:** Validado no ambiente Dev (`haru-control.dev.com.br`) pelo usuário ao abrir o modal e visualizar os dados de previsão sem erros.

#### 5. Lições Aprendidas & Prevenção Futura
- Sempre verificar e validar os decorators de rota dos controllers NestJS ao criar ou refatorar serviços e componentes no frontend.
- Tipar as URLs das rotas da API em constantes ou clientes de serviço centralizados para garantir checagem estática em tempo de compilação.

---

### [BUG-010] Vazamento de scroll da página ao mover modal de sugestão de fornada no mobile
- **Status:** `[x]` Resolvido
- **Validação Prática:** `✅ Validado`
- **Severidade:** `🟢 Baixa`
- **Data de Registro:** 2026-09-25
- **Data de Implementação:** 2026-09-25
- **Data de Validação:** 2026-09-25
- **Componentes / Arquivos Afetados:** `apps/mobile/src/components/BakingSuggestionModal.tsx`, `apps/mobile/src/components/BakingSuggestionModal.css`

#### 1. O que acontece (Sintomas & Comportamento Observado)
- Ao abrir o modal de Sugestão de Fornada em telas móveis/touch na tela de Estoque (`/stock`) e arrastar o dedo para navegar na lista de cookies sugeridos, a página de estoque ao fundo rola indevidamente (scroll chaining / vazamento de rolagem), tornando a rolagem interna do modal truncada e confusa.
- **Passos para Reproduzir:**
  1. Acessar `/stock` no smartphone ou DevTools touch mode.
  2. Abrir o modal de Sugestão de Fornada pelo menu flutuante.
  3. Deslizar o dedo verticalmente na área de itens ou cabeçalho do modal.
  4. Observar que a página ao fundo rola simultaneamente ou bloqueia a rolagem interna do modal.
- **Comportamento Esperado:** O fundo da página deve permanecer perfeitamente fixo (`overflow: hidden; touch-action: none;`), e o scroll touch deve operar única e exclusivamente no corpo interno do modal com inércia nativa (`-webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain;`).
- **Logs / Erros de Console:** Nenhum erro de console reportado (comportamento de scroll chaining em touch screens).

#### 2. Onde está o problema (Localização Técnica)
1. **Conflito de Classes CSS e Sobrescrita de Overflow:** O elemento rolável em `BakingSuggestionModal.tsx` recebia duas classes: `<div className="baking-modal-body baking-suggestion-panel">`. Em `BakingSuggestionModal.css`, a classe `.baking-suggestion-panel` declarava `overflow: visible;` após a definição de `.baking-modal-body { overflow-y: auto; }`. Como ambas tinham mesma especificidade, `overflow: visible` sobrescreveu a rolagem, desativando o contêiner de scroll.
2. **Restrição de Flexbox (`min-height: 0`):** Em contêineres `flex-direction: column` (`.baking-modal-container`), os filhos possuem `min-height: auto` por especificação. Sem `min-height: 0;`, o corpo interno não encolhia para caber nos `90vh`, expandindo todo o conteúdo e sendo cortado pelo `overflow: hidden` do pai sem ativar a barra de rolagem.
3. **Supressão Global de Gestos Touch:** A atribuição de `document.body.style.touchAction = "none"` e o uso de `onTouchMove={(e) => e.stopPropagation()}` no contêiner do modal bloqueavam os gestos nativos de arrasto (`pan-y`) em navegadores móveis (Chrome/WebKit).

#### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
- O modal de sugestão de fornada herdou o seletor `.baking-suggestion-panel` da época em que era um painel estático em `Stock.tsx` com `overflow: visible`. Na primeira tentativa de corrigir o vazamento de scroll, a inclusão de `touchAction: "none"` no body e no container acabou bloqueando os gestos de toque no próprio modal.

#### 4. Como foi resolvido (Solução Aplicada)
- **Eliminação do Conflito de Overflow:** Removida a classe e a propriedade conflitante `overflow: visible;` de `.baking-suggestion-panel`. O contêiner de conteúdo agora é puramente `<div className="baking-modal-body">`.
- **Habilitação de Encolhimento Flex (`min-height: 0`):** Aplicados `flex: 1 1 auto; min-height: 0; overflow-y: auto;` em `.baking-modal-body`, `.bake-modal-body` e `.broadcast-modal-body`, garantindo que os corpos roláveis encolham perfeitamente dentro dos limites da viewport móvel.
- **Liberação dos Gestos de Toque:**
  - O lock do body agora altera estritamente `document.body.style.overflow = "hidden"`, sem travar o `touchAction` global do documento.
  - Removido `onTouchMove stopPropagation` dos contêineres, permitindo que o navegador reconheça livremente os gestos verticais de `pan-y`.
  - Mantido `onTouchMove` condicional (`if (e.target === e.currentTarget) e.preventDefault()`) no overlay para impedir scroll ao tocar no fundo.

#### 5. Lições Aprendidas & Prevenção Futura
- Em contêineres Flexbox verticais com modais/drawers, sempre declarar `min-height: 0;` no elemento rolável (`overflow-y: auto`), caso contrário o flex item se expande além do contêiner e o scroll quebra.
- Nunca aplicar `touch-action: none` globalmente em `document.body`, pois isso desativa os gestos de arrasto em todos os elementos filhos que precisem de `pan-y`.

---




