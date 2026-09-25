# 📜 Histórico Técnico de Desenvolvimento - Haru Control

> **AI Instruction (Token Diet):** Este arquivo contém estritamente o histórico de desenvolvimento da **FASE ATUAL** (ativa). 
> Quando uma fase for concluída, todo o conteúdo correspondente deve ser movido para `docs/HISTORY_ARCHIVE.md`, mantendo este arquivo enxuto para poupar tokens de contexto.

---

## 📍 Fase 2: Expansão Operacional, Automações & Relatórios

### [2026-09-09] Refinamento de Backlog e Catalogação de Novas Features

- **Contexto:** Mapeamento estruturado de melhorias operacionais, de inteligência de dados e de usabilidade para o ciclo imediato e futuro do Haru Control.
- **Funcionalidades Mapeadas & Planejadas:**
  - **Navegação Mobile:** Alternância rápida entre abas do Quadro de Pedidos por gesto de deslizar horizontal (swipe) na zona inferior da tela.
  - **Comanda WhatsApp:** Simplificação do texto copiado para o formato enxuto original (remoção do nome do cliente e opcional de endereço).
  - **Integração Pix:** Geração dinâmica de código Copia e Cola / QR Code com valor exato e gestão de status (Mercado Pago / Ton).
  - **Histórico & Pedidos Retroativos:** Endpoint `POST /orders/batch` para importação/carga em lote com datas customizadas, nova tela de histórico geral e edição total de pedidos.
  - **Confirmação Interna & Controle de Alarme:** Checkbox com default marcado para envio opcional de notificação emergencial Pushover e confirmação de ciência (ACK) direto na UI do app.
  - **Insights & Projeção:** Cálculo de projeção mensal linear de faturamento (*run-rate*) nos Insights.
  - **Inteligência Preditiva:** Previsão estatística de demanda por dia da semana e sugestão automática de fornada/produção diária cruzada com estoque.
  - **Gestão de Perdas:** Módulo contábil de descarte de produtos/insumos por validade ou quebra vinculado ao Ledger (`WASTE`) e análises nos Insights.
### [2026-09-09] Implementação das Melhorias 1, 2 e 5 (Swipe, Comanda WhatsApp e ACK/Notificação)

- **Contexto:** Execução das três primeiras melhorias prioritárias para otimização da experiência diária do atendimento e gestão de pedidos.
- **Implementações Realizadas:**
  - **1. Navegação por Swipe nas Abas (`OrderBoard.tsx`):**
    - Adicionado suporte a gestos de deslizar (touch swipe left/right) na tela com tolerância mínima de 50px e proporção `deltaX > 1.5 * deltaY`, permitindo trocar de abas (`Rascunho` ↔ `Produção` ↔ `Entrega` ↔ `Concluídos`) com o dedão na parte inferior sem travar a rolagem vertical.
    - Ignorados toques iniciados em botões, campos de texto ou modais para evitar conflitos de interação.
  - **2. Simplificação da Comanda Copiada para WhatsApp (`OrderBoard.tsx`):**
    - Removido o campo `Cliente: ${nome}` da comanda gerada no botão 📋 de cópia rápida.
    - Mantido apenas o endereço de entrega (caso preenchido), preservando o formato enxuto e direto ao ponto.
  - **3. Confirmação no App (ACK) e Checkbox de Notificação (`OrderForm.tsx`, `OrderBoard.tsx`, API e Prisma):**
    - `schema.prisma`: Adicionado campo `notify Boolean @default(true) @map("notify")` no modelo `Order`, aplicado via migration `20260909132237_add_order_notify_field`.
    - `OrderForm.tsx`: Adicionado checkbox com valor padrão marcado (`true`) permitindo desativar o alerta sonoro no celular para pedidos presenciais de balcão.
    - `OrderBoard.tsx`: Liberado o botão de confirmação (`⏱️ Confirmar`) e badge (`✅ Confirmado`) no card e no modal de detalhes mesmo para pedidos sem `pushoverReceipt`.
    - `orders.service.ts`: API verifica o campo `notify` antes de invocar o `pushoverService.sendOrderAlert`.
- **Validação:** Compilação dos pacotes `types`, `api` e `mobile` concluída com 100% de sucesso.
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-10] Implementação de Pedidos Retroativos, Tela de Histórico Geral e Edição Flexível

- **Contexto:** Necessidade de registrar pedidos passados/históricos diretamente pelo app ou em lote (batch), consultar todo o histórico com filtros avançados e permitir editar metadados e itens de pedidos já concluídos ou cancelados.
- **Implementações Realizadas:**
  - **1. Banco de Dados & Prisma (`schema.prisma`):**
    - Adicionado campo `completedAt DateTime? @map("completed_at")` no modelo `Order`.
    - Gerada e aplicada com sucesso a migration `20260910025657_add_order_completed_at` no banco de dados.
    - Sincronizados tipos compartilhados em `libs/types/src/lib/types.ts`.
  - **2. API NestJS (`orders.controller.ts` & `orders.service.ts`):**
    - **Endpoint Batch:** Implementado `@Post("batch")` para criação em lote de pedidos com suporte a datas (`createdAt`, `completedAt`), status customizado, cliente, endereço e itens com preços unitários específicos.
    - **Filtros no `findAll`:** Adicionados filtros opcionais por `startDate`, `endDate`, `customerId` e busca textual `search` (case-insensitive em ID, cliente, endereço e produtos).
    - **Edição Flexível (`update`):** Removida a trava rígida que impedia edição de pedidos já concluídos/cancelados. Agora é possível retificar datas (`createdAt`, `completedAt`), cliente, endereço, taxa de entrega, status e itens, sincronizando automaticamente os lançamentos contábeis de estoque (Ledger) e o registro de faturamento em `Sale`.
    - **Conclusão (`complete`):** Atualização automática de `completedAt` e upsert atômico na tabela `Sale`.
  - **3. Frontend Mobile (`OrderHistory.tsx`, `OrderHistory.css` & `OrderBoard.tsx`):**
    - **Nova Tela `/orders/history`:** Criada página dedicada com cabeçalho, KPIs de faturamento e volume de pedidos concluídos, e cards detalhados com badges coloridos de status.
    - **Filtros Avançados:** Barra de filtros com busca textual em tempo real, seletor de status (`TODOS`, `COMPLETED`, `CANCELLED`, `PENDING`, `READY`, `DRAFT`), intervalo de datas (`startDate` a `endDate`) e botão de limpeza.
    - **Modal "Novo Pedido Histórico":** Formulário completo para inclusão retroativa de pedidos passados, permitindo definir data/hora de criação e conclusão, cliente, endereço, taxa de entrega, seleção de múltiplos produtos com quantidade e preço unitário customizável, cálculo de total dinâmico e controle de notificação Pushover (desmarcado por padrão para histórico).
    - **Modal "Editar Pedido":** Modal direto no card para edição flexível de qualquer pedido listado no histórico.
    - **Navegação:** Adicionado botão de atalho `📜 Histórico` no cabeçalho do `OrderBoard` e rota `/orders/history` registrada em `App.tsx` com o `AppLayout`.
- **Validação:** Compilação de todos os projetos (`types`, `api`, `mobile`) concluída com 100% de sucesso.
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-10] Implantação da Infraestrutura de Testes Automatizados E2E com Playwright

- **Contexto:** Necessidade de instituir uma suíte de testes de ponta a ponta (E2E) robusta, confiável e automatizada para prevenir regressões e comprovar o funcionamento de novas features na aplicação mobile-first Haru Control.
- **Implementações Realizadas:**
  - **1. Arquitetura & Configuração Playwright (`playwright.config.ts`, `e2e/tsconfig.json`):**
    - Configurado ambiente Playwright com suporte nativo a TypeScript, emulação mobile-first (`Pixel 7`, viewport 412x915, `hasTouch: true`).
    - Integração de `webServer` no config para subida e checagem automática dos serviços de backend (`:3000/products`) e frontend mobile (`:4200`).
    - Adicionados scripts no `package.json`: `test:e2e`, `test:e2e:ui`, `test:e2e:headed` e `test:e2e:codegen`.
    - Configurado `.gitignore` para pastas de relatórios, traces e `.auth`.
  - **2. Sessão Rápida & Fixtures (`auth.setup.ts`, `base-test.ts`):**
    - Implementado setup global que executa login por PIN uma única vez e persiste o estado em `e2e/.auth/user.json`, reaproveitando o login instantaneamente nos demais testes.
    - Criada fixture customizada `test` que injeta automaticamente todos os Page Objects prontos para uso.
  - **3. Page Object Model (POM) (`e2e/page-objects/`):**
    - `LoginPage.ts`: Ações e seletores da tela de PIN e descarte de biometria.
    - `OrderBoardPage.ts`: Ações das abas, cards, avanço de status no Kanban, modal e gestos de swipe.
    - `OrderFormPage.ts`: Ações de seleção de cliente, adição de produtos, taxa de entrega e submissão.
    - `OrderHistoryPage.ts`: Ações da tela de histórico, filtros de busca, modal de pedido retroativo e cards.
  - **4. Suíte de Testes Críticos (`e2e/specs/`):**
    - `01-auth.spec.ts`: Validação de login com PIN incorreto (exibe erro) e PIN correto (carrega Kanban).
    - `02-order-lifecycle.spec.ts`: Fluxo completo do pedido (criar novo no formulário -> validar no Kanban -> avançar para Produção com confirmação ACK -> avançar para Entrega -> concluir).
    - `03-mobile-gestures.spec.ts`: Navegação direta entre abas e teste de gestos de swipe horizontal por toque em tela sensível.
    - `04-history-retroactive.spec.ts`: Acesso ao Histórico, cadastro de pedido retroativo e filtros de busca.
  - **5. Correção de Bug Descoberto nos Testes (`orders.service.ts`):**
    - Identificado e corrigido bug de timezone (offset UTC-3) no filtro por data da API (`date`, `startDate`, `endDate`), garantindo que buscas por pedidos do dia atual considerem o fuso horário local e o campo `completedAt`.
  - **6. Documentação para QA (`e2e/README.md`):**
    - Criado guia completo de onboarding para o novo QA com tabela de equivalência Python (`pytest-playwright`) vs TypeScript (`@playwright/test`), comandos úteis e tutorial de novos testes.
- **Validação:** 7 testes E2E executados e aprovados com 100% de sucesso (21.6s). Workspace completo (`types`, `utils`, `api`, `mobile`) compilado com sucesso.
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-11] Resolução do BUG-002: Unificação da Criação e Edição de Pedidos Históricos no OrderForm

- **Contexto:** Relatado pelo usuário que o modal de pedidos históricos na tela de histórico (`/orders/history`) apresentava quebra de layout com overflow horizontal de itens em telas menores/mobile. Questionada e acordada a oportunidade de reaproveitar a tela canônica `OrderForm` (`/orders/new` e `/orders/:id/edit`), já amplamente testada, validada e familiar para o operador, eliminando duplicação de lógica e componentes.
- **Implementações Realizadas:**
  - **1. Eliminação dos Modais Duplicados em `OrderHistory.tsx` & `OrderHistory.css`:**
    - Removidos completamente os modais inline de criação retroativa e edição de pedidos, estados redundantes (`products`, `customers`, `draftItems`) e classes de CSS associadas (~700 linhas de código removidas).
    - O botão "＋ Pedido Histórico" agora navega diretamente para `/orders/new?retroactive=true`.
    - O botão "✏️ Editar Pedido" nos cards agora navega diretamente para `/orders/${order.id}/edit`.
  - **2. Extensão e Suporte a Pedidos Retroativos e Edição em `OrderForm.tsx`:**
    - Detecta `isRetroactive` via query string `?retroactive=true` e `isEdit` via parâmetro de rota.
    - Seção visual dedicada e responsiva "📅 Data & Status do Pedido", preenchida por padrão para pedidos retroativos (status `COMPLETED`, notificação Pushover desmarcada por padrão) e disponível para edição.
    - Suporte a retificação de datas de criação (`createdAt`) e conclusão (`completedAt`), sincronizadas com o backend no formato ISO 8601.
    - Redirecionamento inteligente: ao salvar ou continuar com avisos em pedidos históricos, retorna diretamente para `/orders/history`.
  - **3. Atualização dos Testes Automatizados E2E (`OrderHistoryPage.ts` & `04-history-retroactive.spec.ts`):**
    - Atualizado o Page Object `OrderHistoryPage` para interagir com o fluxo da tela cheia `OrderForm`.
    - Execução da suíte completa de testes E2E do Playwright (`npx playwright test`): 7/7 testes aprovados com sucesso.
- **Validação:** Workspace compilado com sucesso (`npx nx run-many -t build`) e suíte Playwright verde (7 passed).
### [2026-09-11] Bloqueio Rigoroso de Alertas de Emergência para Pedidos Históricos

- **Contexto:** Solicitação explícita para garantir que pedidos históricos/retroativos NUNCA gerem alertas ou notificações sonoras de emergência (Pushover) no celular sob nenhuma hipótese.
- **Implementações Realizadas:**
  - **1. Backend (`orders.service.ts`):**
    - `create()`: Determina se o pedido é histórico (status `COMPLETED` ou data `createdAt` no passado). Caso seja, força `notify = false`, impedindo qualquer registro de alerta.
    - `createBatch()`: Força `notify: false` explicitamente para todos os pedidos importados em lote.
    - `update()`: Impede disparos de `sendOrderAlert()` se o pedido já estava concluído, se está sendo concluído ou se sua data de criação é anterior ao momento atual (passado). Força `updateData.notify = false`.
  - **2. Frontend Mobile (`OrderForm.tsx`):**
    - Adicionado memo `isHistorical` verificando `isRetroactive`, status `COMPLETED` ou data no passado.
    - Ocultado o checkbox de notificação Pushover quando em contexto histórico, substituindo-o por um indicativo visual informativo (`🔕 Alertas desativados: Pedidos históricos nunca geram notificações de emergência no celular`).
    - No payload de submissão e no `loadOrder()`, `notify` é estritamente garantido como `false`.
- **Validação:** Workspace compilado com sucesso (`npx nx run-many -t build`) e todos os 7 testes E2E do Playwright validados com sucesso.
- **Documentação Atualizada:** [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-11] Promoção de Pedidos para a Barra de Navegação Inferior & Filtros Rápidos de Data

- **Contexto:** Solicitação do usuário para transformar a tela de Pedidos em uma entidade de primeira classe (como Clientes, Produtos, etc.), integrando-a diretamente à barra de navegação inferior (`BottomNavigation`) e adicionando atalhos rápidos de filtro de período (Hoje, Ontem, Últimos 7 dias, Este Mês, Mês Passado, Todos).
- **Implementações Realizadas:**
  - **1. Barra Inferior (`BottomNavigation.tsx`):**
    - Adicionado o item `{ path: "/orders/history", icon: "🧾", label: "Pedidos" }` logo após "Início".
    - Ajustada a detecção de item ativo para rotas com prefixo (`startsWith`), garantindo que o botão fique destacado ao navegar pelo histórico.
  - **2. Filtros Rápidos de Data (`OrderHistory.tsx` & `OrderHistory.css`):**
    - Adicionada barra com chips de filtro rápido: `Hoje`, `Ontem`, `Últimos 7 dias`, `Este Mês`, `Mês Passado`, `Todos`.
    - Ao tocar em um chip, os campos `startDate` e `endDate` são preenchidos e a listagem é filtrada instantaneamente.
    - Estilização responsiva em linha com scroll horizontal suave (`.quick-filters-scroll`) sem quebra em telas compactas.
    - O cabeçalho foi padronizado com as demais páginas de entidades (`🧾 Histórico de Pedidos` sem botão redundante de voltar, uma vez que a barra inferior está sempre presente).
  - **3. Backend (`orders.service.ts`):**
    - Ajustado o filtro de data para pedidos com status `COMPLETED` com `startDate` e `endDate`, filtrando por `completedAt` (ou `createdAt` caso `completedAt` seja nulo) para máxima precisão nos relatórios contábeis.
  - **4. Testes Automatizados E2E (`04-history-retroactive.spec.ts`):**
    - Adicionado teste específico validando acesso a Pedidos via clique no ícone da barra de navegação inferior e alternância entre chips de filtros rápidos de data.
- **Validação:** Workspace compilado com sucesso (`npx nx run-many -t build`) e 8/8 testes E2E do Playwright aprovados com sucesso (23.0s).
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-17] Implementação da Projeção de Faturamento e Módulo de Descarte de Estoque

- **Contexto:** Necessidade operacional de prever o faturamento mensal (run-rate) para planejamento financeiro e compras, além de registrar formalmente perdas de produtos e insumos (quebras, falhas de forno, validade vencida, degustações) no Ledger Contábil (ADR-01) sem corrupção ou apagamento de dados.
- **Implementações Realizadas:**
  - **1. Banco de Dados & Prisma (`schema.prisma`):**
    - Adicionado enum `WasteReason` (`EXPIRED`, `DAMAGE`, `BAKING_FAILURE`, `TASTING`, `OTHER`).
    - Adicionada operação `WASTE` ao enum `LedgerOperationType`.
    - Estendido `LedgerEntry` com os campos `wasteReason WasteReason? @map("waste_reason")` e `notes String? @map("notes")`.
    - Criada e aplicada com sucesso a migration `20260917193214_add_stock_waste_fields`.
  - **2. Tipos Compartilhados (`libs/types`):**
    - Exportados `WasteReason`, `WASTE_REASON_LABELS`, `WASTE_REASON_ICONS`, `StockWasteDto`, `MonthlyProjection` e `WasteMetrics`.
  - **3. Backend NestJS (`apps/api`):**
    - `StockService`:
      - `recordWaste(productId, quantity, reason, notes)`: validação estrita e lançamento negativo imutável no Ledger (`LedgerOperationType.WASTE`).
      - `calculateProductCost(product)`: computa custo real a partir da Ficha Técnica (BOM) ou preço cadastrado.
      - `getWasteHistory(startDate, endDate)` e `getWasteMetrics(startDate, endDate)`: agregação de volume e custo financeiro estimado de perdas, distribuição percentual por motivo e ranking de produtos com maior desperdício.
    - `StockController`: endpoints `@Post("waste")`, `@Get("waste/history")` e `@Get("waste/metrics")`.
    - `OrdersService.getMetrics`: adicionados cálculo da **Projeção Mensal linear (Run-Rate)** e consolidação das métricas de descarte no payload de `/orders/metrics`.
  - **4. Frontend Mobile (`apps/mobile`):**
    - `Stock.tsx` & `Stock.css`:
      - Adicionada opção `🗑️ Registrar Descarte / Perda` no `FloatingActionButton`.
      - Modal intuitivo de descarte com seleção de produto, indicador de estoque atual, seletor de motivos em chips coloridos com ícones e campo de observação.
    - `Insights.tsx` & `Insights.css`:
      - **Card de Projeção Mensal:** exibido dinamicamente no mês atual com valor projetado em destaque, média diária realizada, dias decorridos/restantes e barra de progresso.
      - **Seção de Perdas & Descartes Operacionais:** KPIs de custo total e volume perdido, distribuição por motivo com barras percentuais e ranking dos produtos mais descartados.
  - **5. Testes E2E com Playwright:**
    - Criado spec `e2e/specs/05-waste-and-insights.spec.ts` cobrindo o fluxo de descarte via FAB e conferência da projeção e seção de perdas nos Insights.
- **Validação:** Monorepo compilado com 100% de sucesso (`nx run-many -t build` para `types`, `utils`, `api`, `mobile`).
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-17] Resolução de BUG-003: Higienização do Cabeçalho e Reposicionamento da Aba de Histórico

- **Contexto:** Remoção de botão transitório de Histórico mantido no topo do quadro de pedidos e reorganização da ordem dos itens na barra de navegação inferior (`BottomNavigation`).
- **Implementações Realizadas:**
  - **1. Cabeçalho de Pedidos (`OrderBoard.tsx`):**
    - Removido o botão `<button className="history-btn-header">` ao lado do botão de Insights.
    - Mantidos no topo apenas os botões contextuais de `📊 Insights` e `📖 Ajuda`.
  - **2. Barra Inferior de Navegação (`BottomNavigation.tsx`):**
    - Reposicionada a aba de histórico para a última posição da barra inferior: `Início` (📋), `Clientes` (👥), `Produtos` (📦), `Produção` (🏭), `Estoque` (📊) e `Histórico` (📜).
    - Ajustado o rótulo de `"Pedidos"` para `"Histórico"` para distinguir claramente do quadro Kanban ativo na tela inicial.
  - **3. Suíte de Testes E2E (`OrderBoardPage.ts` e `04-history-retroactive.spec.ts`):**
    - Atualizado o método `goToHistory()` do Page Object para navegar pela barra inferior.
    - Atualizados os seletores dos testes Playwright correspondentes.
- **Validação:** Build do projeto `mobile` concluído com 100% de sucesso (`nx build mobile`).
- **Documentação Atualizada:** [docs/BUGS.md](docs/BUGS.md), [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-17] Refinamento de UI/UX nos Insights: Dropdown de Período e Limpeza Visual

- **Contexto:** Substituição do seletor horizontal de chips por um seletor dropdown (`<select>`) responsivo e higienização visual do card de Projeção Mensal de Faturamento, removendo emojis gráficos excessivos.
- **Implementações Realizadas:**
  - **1. Seletor de Período (`Insights.tsx` e `Insights.css`):**
    - Substituídos os botões/chips com scroll horizontal por um elemento `<select className="insights-period-select">` completo com opções de período (`Mês Atual`, `Hoje`, `Últimos 7 dias`, `Últimos 30 dias`, `Mês Anterior` e `Personalizado (definir datas)`).
    - Estilização moderna com ícone de seta customizado via SVG, preenchimento confortável ao toque mobile e foco com anel lilás.
    - Preservada a área expansível de datas personalizadas (`Data Início`, `Data Fim` e botão `Aplicar`) quando a opção `Personalizado` é selecionada.
  - **2. Card de Projeção Mensal (`Insights.tsx` e `Insights.css`):**
    - Removido o emoji `🔮` e o wrapper `.projection-icon`.
    - O título e a badge de "Estimativa Run-Rate" agora alinham de maneira limpa e profissional com o valor em destaque.

### [2026-09-17] Resolução de BUG-004 e Unificação de Pedidos, Histórico e Descartes no OrderForm

- **Contexto:** Solicitação do usuário para unificar a operação de descarte de estoque no mesmo formulário de página inteira do `OrderForm`, permitindo alternar de modo ("Pedido Normal", "Pedido Histórico", "Descarte de Estoque") por um dropdown no topo esquerdo com pré-seleção por rota (`/orders/new`, `?mode=historical`, `?mode=waste`). Além disso, correção do bug de layout `BUG-004` onde as categorias de produtos limitavam a altura com rolagem interna ao conter mais de 6 produtos.
- **Implementações Realizadas:**
  - **1. Resolução do BUG-004 (`OrderForm.css`):**
    - Removidas as propriedades `max-height: 70vh;` e `overflow-y: auto;` de `.order-form .products-grid`.
    - As categorias agora expandem naturalmente no fluxo da página conforme a quantidade de produtos disponíveis.
  - **2. Backend: Endpoint de Descarte em Lote (`apps/api`):**
    - `StockController`: Adicionados DTOs `StockWasteBatchItemDto`, `StockWasteBatchDto` e o endpoint `@Post("waste/batch")`.
    - `StockService`: Implementado método `recordWasteBatch` executando transação atômica (`prisma.$transaction`), registrando todas as movimentações `LedgerOperationType.WASTE` no Ledger imutável.
  - **3. Frontend: Unificação e Modo Descarte no `OrderForm` (`OrderForm.tsx` & `OrderForm.css`):**
    - Seletor de Modo no Cabeçalho: Dropdown no topo esquerdo alternando entre "Pedido Normal", "Pedido Histórico" e "Descarte de Estoque", inicializado dinamicamente via parâmetros da URL (`?mode=historical`, `?mode=waste`, `?retroactive=true`).
    - Modal de Confirmação de Rascunho: Prevenção de perda acidental de dados ao trocar de modo com itens no carrinho.
    - Exibição Completa de Produtos: No modo descarte, a lista passa a exibir todos os produtos do inventário (insumos, bases, embalagens), e oculta os preços em R$, destacando as unidades de medida (`un`, `kg`).
    - Checkout Simplificado de Descarte: Ocultados cliente, endereço, notificação Pushover, taxa de entrega e totais financeiros. Inserido seletor de motivos (`WasteReason`) em chips interativos, campo de observações e resumo quantitativo de itens a descartar.
    - Submissão em Lote: Disparo atômico para `POST /stock/waste/batch` com feedback e redirecionamento de volta ao Estoque.
  - **4. Integração no Estoque (`Stock.tsx`):**
    - Atualizado o item `🗑️ Registrar Descarte / Perda` do `FloatingActionButton` para navegar diretamente para `/orders/new?mode=waste`.
    - Removidos modais, estados e lógica duplicada de descarte em `Stock.tsx`.
  - **5. Atualização da Suíte de Testes E2E (`05-waste-and-insights.spec.ts`):**
    - Adaptado o teste de ponta a ponta de descarte para seguir o novo fluxo unificado (FAB -> `/orders/new?mode=waste` -> seleção de produto e motivo -> submissão -> retorno a `/stock`).
- **Validação:** Compilação completa de `api` e `mobile` com 100% de sucesso (`npm run build`).
- **Documentação Atualizada:** [docs/BUGS.md](docs/BUGS.md), [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-18] Resolução de BUG-005 e Refinamentos de UX no OrderForm e Histórico

- **Contexto:** Solicitação do usuário para refinamentos de ergonomia e fluxo: alternância fluida entre Pedido Normal e Pedido Histórico sem limpar o carrinho nem exigir confirmação; remoção do atalho de configuração retroativa redundante; reposicionamento do dropdown de modo abaixo do título da página; resolução do bug `BUG-005` (chips de motivo do descarte sem feedback visual); migração do botão de "Novo Pedido Histórico" para botão flutuante (`FloatingActionButton`) e aplicação do mesmo padrão de seletor dropdown de período dos Insights na tela de Histórico de Pedidos.
- **Implementações Realizadas:**
  - **1. Resolução do BUG-005 (`OrderForm.tsx` & `OrderForm.css`):**
    - Unificada a nomenclatura das classes CSS (`.waste-reason-chip, .waste-chip-btn` e `.active`), restaurando o feedback visual imediato ao tocar em qualquer motivo de descarte.
  - **2. Transição Sem Perdas entre Normal e Histórico (`OrderForm.tsx`):**
    - `handleModeChange` agora detecta trocas diretas entre `normal` e `historical`, aplicando o novo modo sem acionar o modal de confirmação e preservando todos os itens adicionados no carrinho.
  - **3. Higienização e Reposicionamento do Cabeçalho (`OrderForm.tsx` & `OrderForm.css`):**
    - Removido o link `⚙️ Definir data retroativa ou status inicial` e o botão `✕ Ocultar`, visto que o modo do formulário já é controlado pelo seletor de topo.
    - O dropdown de tipo de registro agora se posiciona diretamente abaixo do título da tela (`<h1>Novo Pedido / Novo Pedido Histórico / Descarte`), melhorando a hierarquia visual.
  - **4. Botão Flutuante (FAB) no Histórico de Pedidos (`OrderHistory.tsx`):**
    - Removido o botão estático `btn-new-retroactive` do cabeçalho superior.
    - Adicionado o `FloatingActionButton` com ícone `＋` para criação de pedidos históricos na parte inferior direita da tela.
  - **5. Dropdown de Período Padronizado no Histórico (`OrderHistory.tsx` & `OrderHistory.css`):**
    - Substituídos os botões de chip com rolagem horizontal pelo seletor dropdown `<select className="history-period-select">` com opções: `Todos os Pedidos (Todo o Período)`, `Mês Atual`, `Hoje`, `Ontem`, `Últimos 7 dias`, `Mês Passado` e `Personalizado (definir datas)`.
    - Quando selecionado `Personalizado`, são exibidos inputs de data início e fim dedicados.
  - **6. Atualização de Page Objects e Testes E2E:**
    - `OrderHistoryPage.ts`: Atualizado seletor `newHistoricalOrderButton` para apontar para `.fab-button`.
    - `04-history-retroactive.spec.ts`: Adaptado para validar o novo dropdown `history-period-select`.
- **Validação:** Compilação dos pacotes com 100% de sucesso (`npm run build`).
- **Documentação Atualizada:** [docs/BUGS.md](docs/BUGS.md), [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-18] Suporte a Acesso Mobile em Rede Local (Wi-Fi)

- **Contexto:** Necessidade de rodar e testar o aplicativo diretamente no smartphone conectado na mesma rede Wi-Fi da máquina de desenvolvimento.
- **Implementações Realizadas:**
  - **1. Frontend Mobile (`apps/mobile/src/services/api.ts`):**
    - Atualizada a função de resolução da `baseURL` do Axios para detectar dinamicamente `window.location.hostname`.
    - Ao abrir a aplicação no celular via IP da máquina (ex: `http://192.168.15.7:4200`), as requisições para a API agora apontam automaticamente para `http://192.168.15.7:3000` em vez de falharem no `localhost` interno do celular.
  - **2. Subida dos Serviços em Segundo Plano:**
    - Servidores ativos e escutando em `0.0.0.0`: API NestJS na porta `3000` e Vite Mobile na porta `4200`.
    - Acesso disponível em `http://192.168.15.7:4200`.
- **Documentação Atualizada:** [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-19] Planejamento e Catalogação de Novas Demandas Operacionais

- **Contexto:** Alinhamento estratégico com o usuário para otimizações operacionais de alto impacto no fluxo da cozinha e atendimento:
- **Funcionalidades Mapeadas e Adicionadas ao Backlog Ativo ([docs/TASKS.md](docs/TASKS.md)):**
  - **1. Remoção da Página de Produção:** Simplificação do fluxo operacional eliminando `/manufacturing` e a aba na barra inferior, transferindo o registro de fabricação para a entrada de estoque de produto acabado.
  - **2. Barra Flutuante de Carrinho no `OrderForm`:** Indicador inferior flutuante com resumo de itens e total ao adicionar produtos ao carrinho, acelerando a visualização antes do checkout.
  - **3. Entrada de Estoque via Modal do Item (`Stock.tsx`):** Redirecionamento do modal de toque rápido no card de estoque para registrar primariamente entrada/produção de produtos no Ledger, deixando o ajuste manual apenas para conferências pontuais de inventário.
  - **4. Ocultação do Estágio "Em Entrega" e Renomeação para "Em Preparo":** Simplificação do fluxo visual do Kanban (avançando direto de Em Preparo para Concluído) mantendo compatibilidade do enum no backend.
  - **5. Movimentação de Pedidos em Lote no Kanban:** Suporte a seleção múltipla de cards (via checkbox/long-press), opção "Selecionar Todos" e barra flutuante de ações para transição em massa de status.
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-19] Implementação das 5 Otimizações Operacionais (Remoção Produção, Drawer Carrinho, Entrada Estoque, Coluna Preparo e Ações em Lote)

- **Contexto:** Execução das demandas operacionais alinhadas com o usuário para dinamizar o atendimento e a gestão da cozinha no Haru Control: eliminação de telas desnecessárias, agilização na montagem de pedidos, facilidade na entrada de fornadas no estoque e movimentação em lote de comandas.
- **Implementações Realizadas:**
  - **1. Remoção da Página de Produção e Redirecionamento (`BottomNavigation.tsx`, `App.tsx`):**
    - Removida a aba `/manufacturing` da barra de navegação inferior, mantendo 5 abas equilibradas (`Início`, `Clientes`, `Produtos`, `Estoque`, `Histórico`).
    - Configurado redirecionamento transparente de `/manufacturing` para `/stock` no React Router.
  - **2. Barra Flutuante de Carrinho e Gaveta Deslizante no OrderForm (`OrderForm.tsx` & `OrderForm.css`):**
    - Barra inferior flutuante (`.floating-cart-bar`) exibindo total de itens e valor acumulado (ou unidades no modo descarte).
    - Gaveta inferior deslizante (Drawer Bottom Sheet) interativa com lista detalhada de itens, botões rápidos de incremento/decremento (`-`, `+`), remoção e avanço direto para o checkout.
    - Ocultação automática (fade out) via `IntersectionObserver` quando a seção de finalização/checkout entra no viewport.
  - **3. Entrada Rápida de Estoque por Toque no Card (`Stock.tsx` & `Stock.css`):**
    - Modal ao clicar no card de estoque agora abre primariamente no modo de Entrada (`IN` / Produção) no Ledger contábil.
    - Botões rápidos de incremento (`+1`, `+5`, `+10`, `+20`) e previsão do novo saldo em tempo real.
    - Link secundário para ajuste manual / inventário caso seja necessária retificação de balanço.
  - **4. Simplificação do Kanban - "Em Preparo" e Avanço Direto (`OrderBoard.tsx` & `OrderBoard.css`):**
    - Renomeada a aba e coluna de "Produção" para **"Em Preparo"**.
    - Ocultada a coluna "Em Entrega", mantendo pedidos com status `READY` agrupados na coluna "Em Preparo" para não sumirem da visualização.
    - Transição direta: pedidos em "Em Preparo" avançam imediatamente para "Concluído" com 1 toque.
  - **5. Seleção Múltipla e Transição de Pedidos em Lote (`OrderBoard.tsx`, `orders.service.ts`, `orders.controller.ts`):**
    - Backend: Implementado endpoint `@Patch("batch/status")` com transação atômica (`updateBatchStatus`), aplicando baixas e vendas caso o status de destino seja `COMPLETED`.
    - Frontend: Suporte a seleção individual via checkbox, long-press de 500ms no card e botão "Selecionar Todos" no cabeçalho da coluna ativa.
    - Barra flutuante de ações em lote (`.batch-action-bar`) com contador e botões dedicados de avanço coletivo de status.
  - **6. Atualização da Suíte de Testes E2E (`e2e/`):**
    - Adaptados Page Objects e testes Playwright (`OrderBoardPage.ts`, `02-order-lifecycle.spec.ts`, `03-mobile-gestures.spec.ts`) para a nova estrutura de 3 abas e transição direta.
- **Validação:** Compilação completa do monorepo com 100% de sucesso (`npm run build`) e suíte Playwright E2E 100% verde (10 passed).
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-19] Resolução do BUG-006: Contenção de Scroll no Drawer do Carrinho, Taxa de Entrega e Ícone 🛒

- **Contexto:** Relatado pelo usuário que, ao interagir com o drawer do carrinho no `OrderForm`, o fundo da página de pedidos se movia; faltava a exibição da taxa de entrega e o total no drawer; e o ícone utilizado no botão era uma sacola de compras (`🛍️`) em vez de um carrinho (`🛒`).
- **Implementações Realizadas:**
  - **1. Bloqueio Estrito de Scroll no Body (`OrderForm.tsx`):**
    - Adicionado `useEffect` vinculado a `isCartDrawerOpen` que aplica `document.body.style.overflow = "hidden"` e `document.body.style.touchAction = "none"`, restaurando o comportamento padrão ao desmontar ou fechar o drawer.
  - **2. Contenção de Eventos Touch e Overscroll (`OrderForm.tsx` & `OrderForm.css`):**
    - Adicionado `onTouchMove` no overlay e `stopPropagation` no container do drawer.
    - Aplicadas as regras CSS `overscroll-behavior: contain; touch-action: none;` no overlay, cabeçalho e rodapé, e `touch-action: pan-y; -webkit-overflow-scrolling: touch;` na lista de itens para isolar o scroll internamente.
  - **3. Exibição da Taxa de Entrega e Total Consolidado (`OrderForm.tsx` & `OrderForm.css`):**
    - Adicionado bloco `.cart-drawer-pricing-summary` discriminando Subtotal, Taxa de Entrega (`deliveryFee`) e Total consolidado.
    - Atualizado o rótulo do botão de finalização para exibir o valor total com a entrega inclusa: `Finalizar Pedido (${formatCurrency(totalCartPrice + deliveryFee)}) ↓`.
  - **4. Padronização de Ícone para Carrinho de Compras (`OrderForm.tsx`):**
    - Substituído o emoji `🛍️` por `🛒` no botão flutuante e no título do drawer.
- **Validação:** Compilação do monorepo (`npm run build`) com 100% de sucesso e suíte Playwright E2E 100% verde (10 passed).
- **Documentação Atualizada:** [docs/BUGS.md](docs/BUGS.md), [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-19] Resolução do BUG-007 e Refinamento do Carrinho e Seleção em Lote

- **Contexto:** Solicitação de refinamentos ergonômicos e correção de comportamento no Quadro de Pedidos e no formulário de pedidos:
  - No carrinho (`OrderForm`): adição de controle interativo com botões `+`/`-` e input numérico para ajuste dinâmico da taxa de entrega diretamente no drawer, e campo de observações para o modo descarte.
  - No Quadro de Pedidos (`OrderBoard`): eliminação da seleção nativa de texto no long-press (`user-select: none`); abas ocupando 100% da tela sem rolagem horizontal; remoção da barra flutuante inferior (`.batch-action-bar`) que cobria o FAB; inclusão de checkbox de seleção no cabeçalho e nos cards; e botões contextuais de avanço em lote no cabeçalho da coluna (`🍳 Em Preparo` e `✅ Concluir`).
  - Ajuste de altura do container do Kanban para `min-height: calc(100vh - 80px)` e `.board-column` com `height: fit-content;`, eliminando o overflow e rolagem fantasma contra o `BottomNavigation`.
- **Implementações Realizadas:**
  - **1. Edição da Taxa de Entrega no Drawer (`OrderForm.tsx` & `OrderForm.css`):**
    - Adicionado seletor numérico com botões `-` e `+` de incremento (`0.50`) e input direto no drawer, mantendo o total consolidado sincronizado em tempo real.
    - Adicionado campo de observação de linha única no modo descarte no drawer (`wasteNotes`).
  - **2. Desativação de Seleção de Texto em Cards (`OrderBoard.css`):**
    - Inserido `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;` na classe `.order-card` e seus filhos, prevenindo ativação acidental da lupa e seleção de texto no long-press touch.
  - **3. Abas do Kanban sem Rolagem Lateral (`OrderBoard.css`):**
    - `.board-tabs` e `.tab-btn` atualizados com `width: 100%; flex: 1; min-width: 0;`, garantindo que as 3 abas caibam perfeitamente na viewport em qualquer dispositivo mobile sem scrollbar horizontal.
  - **4. Ajuste de Altura e Fim da Rolagem Excessiva (`OrderBoard.css`):**
    - Substituído `height: 100vh; overflow: hidden;` por `min-height: calc(100vh - 80px); box-sizing: border-box;` e `.board-column` com `height: fit-content;`.
    - Quando vazia, a coluna ocupa apenas o espaço do empty-state sem ultrapassar a tela; quando contém pedidos, expande naturalmente acompanhando o scroll da página.
  - **5. Ações em Lote no Cabeçalho da Coluna (`OrderBoard.tsx` & `OrderBoard.css`):**
    - Checkboxes contextuais: ocultos no estado padrão para manter a interface limpa, surgindo nos cards e no cabeçalho somente quando o modo de seleção é ativado via long-press (500ms).
    - Botões de lote no topo direito: `🍳 Em Preparo`, `✅ Concluir` e `✕ Cancelar`.
    - Remoção completa da barra flutuante inferior que colidia com o FAB de novos pedidos.
- **Validação:** Compilação de todos os pacotes com 100% de sucesso (`npm run build`) e suíte Playwright E2E 100% verde (10 passed).
- **Documentação Atualizada:** [docs/BUGS.md](docs/BUGS.md), [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-19] Refinamento dos Botões de Transição e Criação Direta de Pedido via Drawer

- **Contexto:** Solicitação do usuário para:
  1. Remover emojis dos botões de mover pedidos para outras etapas no cabeçalho das colunas do Kanban.
  2. Transformar o botão principal da gaveta deslizante (Drawer do carrinho em `OrderForm`) em um disparador direto para salvar/criar o pedido, eliminando o comportamento intermediário de apenas rolar a página para o formulário no rodapé.
- **Implementações Realizadas:**
  - **1. Limpeza Tipográfica nos Botões de Ação em Lote (`OrderBoard.tsx`):**
    - Removidos os emojis decorativos `🍳`, `✅` e `📝` dos botões de transição em massa no cabeçalho da coluna (`Em Preparo (N)`, `Concluir (N)` e `Rascunho (N)`).
  - **2. Criação Imediata e Ações no Drawer (`OrderForm.tsx` & `OrderForm.css`):**
    - Botão `.btn-drawer-checkout` agora invoca diretamente `handleSave()`, criando o pedido ou registrando o descarte imediatamente com feedback de carregamento (`Salvando...`).
    - Exibe o valor total consolidado no próprio botão: `Criar Pedido (${formatCurrency(totalCartPrice + deliveryFee)})`.
    - **Cor Verde Padronizada:** O botão de criar pedido no drawer agora utiliza o mesmo verde padrão da finalização do pedido (`#2ecc71`, hover `#27ae60`), mantendo a identidade visual familiar.
    - **Botão Limpar Pedido no Drawer:** Inserido o botão `.btn-drawer-clear` ("Limpar Pedido" ou "Limpar Descarte"), executando `handleClearOrder()` e fechando o drawer após confirmação.
    - Fechamento suave do drawer em caso de sucesso (`setIsCartDrawerOpen(false)`) e redirecionamento de tela; caso ocorram warnings de estoque, fecha a gaveta e foca nos avisos para confirmação.
    - Estilização adicionada no CSS para `.cart-drawer-actions`, `.btn-drawer-clear`, `.btn-drawer-checkout:disabled` e variante `.btn-drawer-waste` para modo descarte.
### [2026-09-19] Implementação de Subcategorias Hierárquicas nos Produtos, Estoque e Pedidos

- **Contexto:** Com o cadastramento de ingredientes, insumos e embalagens como produtos no inventário interno, tornou-se fundamental organizar o catálogo em uma hierarquia de dois níveis (**Categoria Macro ➔ Subcategoria Opcional**). As categorias atuam como grandes agrupadores (ex: `Cookies`, `Insumos & Matérias-Primas`, `Bebidas`, `Embalagens`), enquanto as subcategorias organizam famílias de produtos (ex: dentro de `Cookies`: `Clássicos`, `Especiais & Recheados`, `Sazonais`).
- **Implementações Realizadas:**
  - **1. Banco de Dados & Prisma (`apps/api/prisma/schema.prisma`):**
    - Criado o modelo `Subcategory` com campos: `id`, `name`, `price` (preço padrão sugerido opcional), `observation`, `categoryId`, `createdAt` e `updatedAt`.
    - Estabelecido relacionamento 1:N entre `Category` e `Subcategory` com `onDelete: Cascade`.
    - Adicionada chave estrangeira opcional `subcategoryId` no modelo `Product` com `onDelete: SetNull`.
    - Gerada e aplicada com sucesso a migration `20260919155355_add_subcategories` no banco de dados.
    - Atualizado o script de seed (`seed.ts`) vinculando subcategorias realistas aos insumos e aos cookies vendíveis.
  - **2. Tipos Compartilhados (`libs/types/src/lib/types.ts`):**
    - Criadas as interfaces `Category` e `Subcategory` (com relacionamento de lista de subcategorias).
    - Criados os DTOs `CreateSubcategoryDto`, `UpdateSubcategoryDto`, `CreateCategoryDto`, `UpdateCategoryDto`.
    - Atualizado o modelo `Product` e seus DTOs (`CreateProductDto`, `UpdateProductDto`) para incluir `subcategoryId` e relação com `Subcategory`.
  - **3. Backend API NestJS (`apps/api/src/`):**
    - **Novo Módulo `SubcategoriesModule` (`subcategories.controller.ts`, `subcategories.service.ts`):** CRUD completo (`GET /subcategories`, `GET /subcategories/:id`, `POST /subcategories`, `PUT /subcategories/:id`, `DELETE /subcategories/:id`), ordenação alfabética e validação de existência de categoria vinculada.
    - **`CategoriesService`:** `findAll` agora inclui subcategorias ordenadas; exclusão desassocia produtos de ambas as chaves (`categoryId: null`, `subcategoryId: null`).
    - **`ProductsService`:** `findAll` e `findOne` incluem `category` e `subcategory`; criação e atualização aceitam e persistem `subcategoryId`.
    - Registrado `SubcategoriesModule` em `app.module.ts`.
  - **4. Frontend Mobile-First (`apps/mobile/src/`):**
    - **`Products.tsx` & `Products.css`:**
      - Agrupamento visual hierárquico: Categoria ➔ Subcategoria ➔ Grid de Cards.
      - Quando uma categoria não tem subcategorias (ou produtos sem subcategoria), os cards renderizam diretamente sob o cabeçalho da categoria, mantendo a tela limpa sem subtítulos vazios.
      - Modal de gerenciamento de subcategorias (criar, editar, excluir).
      - Modal de produtos com selects encadeados (Categoria filtra Subcategorias válidas) e auto-preenchimento do preço sugerido ao selecionar uma subcategoria precificada.
      - Menu FAB atualizado com ação dedicada `📂 Nova Subcategoria`.
    - **`Stock.tsx` & `Stock.css`:**
      - Agrupamento de estoque atualizado para a hierarquia Categoria ➔ Subcategoria ➔ Cards de saldo.
      - Ação de toque rápido no card para entrada contábil imediata (`+1`) preservada intacta.
    - **`OrderForm.tsx`:**
      - Agrupamento de produtos na grade de seleção de pedidos (tanto no modo normal quanto descarte) organizado por Categoria e Subcategoria.
    - **`Manufacturing.tsx` & `ProductRecipe.tsx`:**
      - Dropdowns `<select>` organizados com `<optgroup label="Categoria > Subcategoria">` para localização rápida de produtos finais e ingredientes.
    - **`Help.tsx`:**
      - Seção de ajuda e manual de uso atualizado com o novo conceito de categorias e subcategorias.
  - **5. Suíte de Testes Automatizados E2E com Playwright (`e2e/`):**
    - Criado teste `06-subcategories.spec.ts` cobrindo navegação via barra inferior, abertura do modal de subcategoria pelo FAB, cadastro de nova subcategoria, validação de renderização no DOM e exclusão com diálogo nativo.
- **Validação:**
  - Build do monorepo (`npm run build`) concluído com 100% de sucesso para todos os 4 projetos (`types`, `utils`, `mobile`, `api`).
  - Suíte completa de testes Playwright E2E executada com sucesso: 11 passed (incluindo autenticação, ciclo de pedidos, swipe mobile, histórico, descarte e subcategorias).
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md), [docs/HISTORY.md](docs/HISTORY.md), `HARU_CONTROL_INDEX.md` e `walkthrough.md`.

### [2026-09-22] Especificação Técnica da Sugestão de Fornada Multi-Dias (Planejamento de Produção)

- **Contexto:** Alinhamento estratégico e modelagem do cálculo de previsão estatística de fornada para confeitarias artesanais. A demanda levantada pelo usuário estabeleceu que a produção precisa operar com horizonte flexível de planejamento (data alvo): em vez de calcular apenas a necessidade de hoje, o operador pode definir até que dia pretende estender a durabilidade da produção (ex: assar na segunda para cobrir segunda, terça e quarta-feira).
- **Especificações Formalizadas no Rascunho ([docs/DRAFT_SUGESTAO_FORNADA.md](docs/DRAFT_SUGESTAO_FORNADA.md)):**
  - **1. Horizonte Temporal Multi-Dias ($D_{\text{início}}$ a $D_{\text{alvo}}$):** Identificação dos dias no intervalo e soma das previsões pontuais de cada dia da semana individual (segundas, terças, etc.), respeitando a sazonalidade semanal.
  - **2. Algoritmo de Média Móvel Ponderada:** Ponderação decrescente das últimas 4 semanas para capturar aceleração ou queda de vendas em cada produto específico.
  - **3. Dedução de Estoque Físico e Necessidade Líquida:** Abatimento automático dos cookies já prontos em estoque e arredondamento para tamanho de assadeira/bandeja (batch size).
  - **4. Alerta de Validade (*Shelf Life*):** Verificação de prazo máximo de frescor (ex: 4 dias) com aviso caso a data alvo exceda o tempo ideal de consumo.
  - **5. Interface Mobile no Estoque (`Stock.tsx`):** Card colapsável com atalhos rápidos de período (`Hoje`, `Até Amanhã`, `Até Quarta`, `Fim de Semana`, `Personalizado`) e botão de 1 toque para lançamento direto de entrada no Ledger Contábil (`LedgerOperationType.IN`).
- **Documentação Atualizada:** [docs/DRAFT_SUGESTAO_FORNADA.md](docs/DRAFT_SUGESTAO_FORNADA.md), [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

### [2026-09-22] Implementação do Gerador de Mensagem de Divulgação de Cookies para WhatsApp

- **Contexto:** Necessidade operacional de gerar rapidamente uma mensagem padronizada e atraente para divulgação no WhatsApp dos cookies e produtos atualmente disponíveis no estoque da Haru Cookies, com suporte a saudações por horário, gancho contextual opcional e agrupamento por famílias de produtos.
- **Implementações Realizadas:**
  - **1. Banco de Dados & Prisma (`apps/api/prisma/schema.prisma`):**
    - Adicionado o campo `description String?` no modelo `Product`, permitindo que cada cookie tenha sua copy/descrição de venda gravada no catálogo.
    - Gerada e aplicada com sucesso a migration `20260922045012_add_product_description`.
    - Script de semente (`seed.ts`) atualizado com descrições realistas dos cookies artesanais e bebidas.
  - **2. Tipos Compartilhados (`libs/types/src/lib/types.ts`):**
    - Adicionado `description?: string | null;` na interface `Product` e nos DTOs `CreateProductDto`, `UpdateProductDto`.
  - **3. Backend NestJS (`apps/api/src/modules/products/`):**
    - `ProductsController` e `ProductsService` atualizados para receber, validar (`@IsOptional() @IsString()`) e persistir `description` na criação e atualização de produtos.
  - **4. Frontend Mobile - Gestão de Produtos (`Products.tsx`):**
    - Adicionado campo `<textarea>` para a descrição/copy de divulgação no modal de criação e edição de produtos.
  - **5. Componente Modal de Divulgação (`BroadcastMenuModal.tsx` & `.css`):**
    - **Saudação Inteligente:** Campo editável pré-preenchido conforme o horário (< 12h: "Bom dia", 12h às 17h: "Boa tarde", >= 18h: "Boa noite").
    - **Gancho Contextual:** Campo editável opcional (ex: citação de clima/chuva, datas especiais) que é completamente ignorado se mantido vazio, sem gerar linhas em branco adicionais.
    - **Checklist de Seleção:** Exibe apenas produtos vendáveis (`isSellable === true`), com pré-seleção automática dos itens com saldo positivo em estoque (`currentStock > 0`), botões rápidos para marcar/desmarcar e badges de saldo.
    - **Agrupamento & Formatação WhatsApp:** Agrupa produtos por Subcategoria/Categoria. Caso os produtos tenham preço uniforme (ex: `*Cookies Tradicionais R$8,00*`), exibe o valor no título da seção. Se os preços variarem dentro da subcategoria (ex: `*Cookies Especiais:*`), agrupa por faixas de preço (`*R$11,00*`, `*R$14,00*`). Cada item exibe `*{nome}* - {descrição}`.
    - **Rodapé Padronizado:** Inclui avisos de entrega, encomenda e o link oficial do catálogo (`https://wa.me/c/5511976952264`).
    - **Pré-visualização em Tempo Real & Cópia:** Caixa de preview ao vivo do texto final formatado e botão com cópia segura para a área de transferência (`navigator.clipboard` com fallback) e toast de feedback.
  - **6. Integração na Tela de Estoque (`Stock.tsx`):**
    - Adicionada a ação `📢 Divulgar Cookies Disponíveis` no topo do menu do `FloatingActionButton`.
    - Renderização do `BroadcastMenuModal` e do feedback visual via componente `Toast`.
  - **7. Suíte de Testes Automatizados E2E com Playwright (`e2e/`):**
    - Criado teste `07-broadcast-menu.spec.ts` validando o fluxo completo de ponta a ponta (acesso via FAB, preenchimento, preview reativo e cópia com toast).
    - Ajustado o tratamento assíncrono de aviso de estoque negativo em `OrderFormPage.ts` e `OrderHistoryPage.ts` (`waitFor`).
- **Validação:**
  - Build do monorepo (`npm run build`) concluído com 100% de sucesso para todos os 4 pacotes (`types`, `utils`, `api`, `mobile`).
  - Suíte completa de 12 testes E2E Playwright executada e aprovada com 100% de sucesso (27.9s).
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md), [docs/HISTORY.md](docs/HISTORY.md) e `walkthrough.md`.

### [2026-09-22] Auditoria Técnica e Criação da PR #2 para Produção (`main` ➔ `production`)

- **Contexto:** Solicitação do usuário para verificar a segurança de atualizar a branch de produção (`production`) com todas as modificações acumuladas na branch `main` e, caso seguro, abrir a Pull Request correspondente.
- **Auditoria de Segurança Realizada:**
  - **1. Análise de Conflitos e Árvore Git:**
    - Ancestral comum validado (`9e399dc`).
    - Verificação via `git merge-tree origin/production origin/main` confirmando **zero conflitos** de merge.
  - **2. Análise das Migrations do Prisma (5 migrations acumuladas):**
    - `20260909132237_add_order_notify_field`: Adiciona coluna `notify` (default `true`).
    - `20260910025657_add_order_completed_at`: Adiciona coluna `completed_at` (nullable).
    - `20260917193214_add_stock_waste_fields`: Cria enum `WasteReason`, adiciona valor `WASTE` em `LedgerOperationType` e colunas `notes`/`waste_reason` (nullables).
    - `20260919155355_add_subcategories`: Cria tabela `subcategories` e adiciona chave estrangeira opcional `subcategory_id` em `products`.
    - `20260922045012_add_product_description`: Adiciona coluna `description` (nullable) em `products`.
    - **Veredito:** Todas as alterações são 100% aditivas e seguras, com zero risco de perda de dados ou quebra em produção.
  - **3. Infraestrutura & Deploy Coolify:**
    - `Dockerfile.api` executa automaticamente `npx prisma migrate deploy` no bootstrap.
    - Zero novas variáveis de ambiente obrigatórias exigidas.
  - **4. Integridade de Código:**
    - Build limpo do monorepo (`npx nx run-many --target=build --all --skip-nx-cache`) passou com 100% de sucesso para todos os projetos (`types`, `utils`, `api`, `mobile`).
- **Ação Executada:**
  - Criada Pull Request [#2](https://github.com/CesarRyudi/Haru-Control/pull/2) no GitHub: `chore(release): sincronizar produção com melhorias operacionais da Fase 2 e correções`.

### [2026-09-23] Validação Prática de BUG-005, BUG-006 e BUG-007 pelo Usuário

- **Contexto:** Confirmação explícita pelo usuário após testes práticos em ambiente de desenvolvimento de que as correções comportamentais e visuais implementadas resolveram completamente os problemas apontados.
- **Bugs Validados:**
  - `[BUG-005]`: Chips de seleção de motivo de descarte no `OrderForm` agora apresentam feedback visual claro de seleção (`.active`).
  - `[BUG-006]`: Rolagem da página ao fundo travada durante a abertura do drawer do carrinho, discriminação de taxa de entrega e total consolidado, e ícone do carrinho atualizado para `🛒`.
  - `[BUG-007]`: Supressão da seleção nativa de texto no long-press dos cards de pedidos, abas do Kanban 100% responsivas sem scroll horizontal, contenção da altura vertical da tela e botões de ação em massa integrados ao cabeçalho da coluna.
- **Documentação Atualizada:** `docs/BUGS.md`, `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-23] Implementação da Previsão de Demanda e Sugestão de Fornada Multi-Dias

- **Contexto:** Necessidade da confeitaria de planejar lotes de cookies que cubram múltiplos dias consecutivos de venda (ex: assar na segunda à noite para cobrir terça e quarta), com visibilidade clara da demanda individual por produto, dedução do estoque atual e checagem de matérias-primas.
- **Implementações Realizadas:**
  - **1. Tipos Compartilhados (`libs/types/src/lib/types.ts`):**
    - Criadas as interfaces `BakingSuggestionDayBreakdown`, `MissingIngredient`, `BakingSuggestionItem`, `BakingSuggestionResponse`, `StockInBatchItemDto` e `StockInBatchDto`.
  - **2. Backend API NestJS (`apps/api/src/modules/stock/`):**
    - **`BakingSuggestionService`:** Motor estatístico que analisa as últimas 4 semanas de pedidos concluídos (`COMPLETED`), aplicando média móvel ponderada decrescente (pesos 4, 3, 2, 1) para cada dia da semana do intervalo planejado, margem de segurança configurável (padrão 10%), dedução do saldo atual de estoque (`LedgerEntry`) e cálculo da necessidade líquida individual por sabor.
    - **Checagem Informativa de BOM:** Cruzamento com as receitas (`RecipeItem`), gerando lista detalhada de insumos em falta sem bloquear a produção.
    - **Entrada em Lote no Ledger Contábil (`StockService.addStockBatch`):** Criação atômica de múltiplos registros `STOCK_IN` via `prisma.$transaction`.
    - **`StockController`:** Adicionados endpoints `GET /stock/baking-suggestion` (com suporte a `startDate`, `targetDate` e `safetyMargin`) e `POST /stock/in/batch`.
    - **`StockModule`:** Registrado `BakingSuggestionService` em providers e exports.
  - **3. Frontend Mobile-First (`apps/mobile/src/`):**
    - **Componente `BakingSuggestionCard.tsx` & `BakingSuggestionCard.css`:**
      - Painel retrátil no topo da tela de Estoque com badge de contagem de cookies a fornar.
      - Seletor flexível de início: `📅 De Hoje` vs `🌙 A partir de Amanhã` (ex: assando à noite para os dias seguintes).
      - Chips de atalho rápido de data alvo: `Mesmo Dia`, `Até Amanhã`, `Até Quarta-feira`, `Fim de Semana (até Domingo)` e `Outra Data...` com seletor `<input type="date">`.
      - Exibição transparente da equação por produto: `Demanda (X) − Estoque (Y) = Assar (Z)`.
      - Accordion expansível com o discriminativo da demanda prevista de cada dia individual do período.
      - Alerta visual suave listando insumos em falta caso a cozinha não tenha ingredientes suficientes, sem travar a fornada.
      - Botão `📋 Copiar Resumo`: gera texto formatado com links e totais e copia instantaneamente para o clipboard com Toast de confirmação.
      - Modal `🔥 Fornar Sugestão`: permite conferir e ajustar as quantidades e lançar a entrada de estoque em lote no Ledger contábil.
    - **`Stock.tsx`:** Integrado o painel no topo da página de Estoque com recarregamento reativo automático dos dados.
  - **4. Suíte de Testes Automatizados E2E com Playwright (`e2e/`):**
    - Criado teste `08-baking-suggestion.spec.ts` validando o fluxo completo de ponta a ponta (renderização, alternância de início hoje/amanhã, presets, equação transparente, accordion dia a dia, cópia para WhatsApp e modal de fornada).
- **Validação:**
  - Build do monorepo (`npm run build`) concluído com 100% de sucesso para todos os 4 projetos (`types`, `utils`, `api`, `mobile`).
  - Suíte completa de 13 testes E2E Playwright executada e aprovada com 100% de sucesso (34.8s).
- **Documentação Atualizada:** `docs/TASKS.md`, `docs/HISTORY.md` e `HARU_CONTROL_INDEX.md`.

### [2026-09-24] Implementação de Pix Copia e Cola com Valor Exato e Integração na Comanda WhatsApp

- **Contexto:** Agilização do fechamento e recebimento de pedidos diretamente pelo WhatsApp e no Quadro de Pedidos (Kanban), eliminando a dependência de APIs bancárias externas e sem gerar complexidade de schema ou poluição visual na interface.
- **Implementações Realizadas:**
  - **1. Utilitário BR Code EMVCo (`libs/utils/src/lib/pix.ts`):**
    - Implementação da especificação oficial do Banco Central do Brasil para arranjos de pagamento Pix (EMVCo BR Code padrão).
    - Cálculo matemático de redundância cíclica `CRC16-CCITT` (polinômio `0x1021`, inicial `0xFFFF`) com padding de 4 caracteres hexadecimais em caixa alta.
    - Suporte a geração dinâmica com chave Pix (`harucookiesdf@gmail.com`), nome do recebedor (`HARU COOKIES`), cidade (`BRASILIA`), identificador de transação e valor exato formatado (`00.00`).
    - Exportado em `libs/utils/src/index.ts` e compartilhado no monorepo.
  - **2. Integração no Quadro de Pedidos (`apps/mobile/src/pages/OrderBoard.tsx` & `.css`):**
    - **Comanda WhatsApp:** O botão de cópia rápida da comanda (`📋`) agora anexa automaticamente ao final da mensagem o bloco formatado com o código Pix Copia e Cola referente ao valor total do pedido (`totalPrice + deliveryFee`).
    - **Botão Rápido no Card:** Adicionado botão `🔑` (`.btn-copy-pix`) ao lado do botão da comanda em cada card do Kanban, permitindo copiar exclusivamente o código Pix para a área de transferência com um único toque, com feedback visual via Toast.
    - **Modal de Detalhes:** Seção Pix no modal de detalhes com visualização monoespaçada do código, botão dedicado de cópia e QR Code gerado para leitura presencial.
    - **Fluxo Operacional Enxuto:** Conforme alinhado, a confirmação do pagamento ocorre de forma natural ao mover o pedido de `Rascunho` para `Em Produção`, mantendo a interface limpa e sem necessidade de migrações ou badges de pendência.
  - **3. Suíte de Testes Automatizados E2E (`e2e/specs/09-pix-payment.spec.ts`):**
    - Cobertura completa de ponta a ponta validando o botão `🔑` no card, validação da string EMVCo no clipboard (`000201...`, `br.gov.bcb.pix`, `HARU COOKIES`), inclusão do Pix na comanda copiada e QR Code / cópia no modal de detalhes.
- **Validação:**
  - Build limpo do monorepo (`npm run build`) concluído com 100% de sucesso (`types`, `utils`, `api`, `mobile`).
  - Suíte completa de 14 testes E2E Playwright executada e aprovada com 100% de sucesso.
- **Documentação Atualizada:** `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-24] Refinamento de UI/UX do Pix no Modal, Remoção de Botões no Card e Envio Isolado da Comanda

- **Contexto:** Solicitação do usuário para otimização de espaço visual no modal de detalhes do pedido (seção Pix excessivamente alta em telas mobile), remoção dos botões de cópia dos cards no Kanban para layout mais limpo, centralização da cópia de comanda dentro do modal e desvinculação do Pix da mensagem de confirmação (para que o Pix possa ser enviado como mensagem avulsa e independente no WhatsApp, facilitando a cópia/pagamento pelo cliente).
- **Implementações Realizadas:**
  - **1. Seção Pix Colapsável no Modal (`OrderBoard.tsx` & `OrderBoard.css`):**
    - Estado `isPixExpanded` com valor inicial `false` garantido ao abrir ou fechar o modal.
    - Quando colapsada (default), ocupa apenas uma linha compacta contendo o valor total `🔑 Pix Copia e Cola (R$ XX,XX)`, botão `📋 Copiar Código` e badge interativo `▼ QR Code`.
    - Ao tocar no cabeçalho ou no badge, expande suavemente exibindo o QR Code gerado em alta resolução e o bloco monoespaçado do código, com badge alternado para `▲ Fechar QR`.
    - Cópia do código via botão `📋 Copiar Código` isolada com `e.stopPropagation()` para não disparar expansão/recolhimento acidental.
  - **2. Limpeza dos Cards no Kanban (`OrderBoard.tsx`):**
    - Removidos completamente os botões de ação rápida (`.order-item-actions`, contendo `btn-copy` e `btn-copy-pix`) dos cards de pedidos.
    - A lista de itens dos cookies passa a ocupar a largura total do container, eliminando poluição visual no quadro.
  - **3. Botão Dedicado de Cópia da Confirmação no Modal (`OrderBoard.tsx` & `OrderBoard.css`):**
    - Adicionado botão `.btn-modal-copy-confirmation` (*"💬 Copiar Mensagem de Confirmação"*) em verde WhatsApp (`#25d366`) destacado na base dos totais do pedido, com feedback visual via Toast (*"Mensagem de confirmação copiada!"*).
  - **4. Restauração da Comanda Original sem Pix (`OrderBoard.tsx`):**
    - Removido o bloco `${pixBlock}` do gerador de texto em `handleCopyOrder()`, restaurando rigorosamente a mensagem original enxuta (*"Então são: ... Valor total: ... Certo?"*).
  - **5. Atualização da Suíte de Testes E2E (`e2e/specs/09-pix-payment.spec.ts`):**
    - Validação de ausência de botões nos cards, estado inicial colapsado no modal, cópia do código Pix, expansão do QR Code ao toque, cópia da mensagem de confirmação sem Pix e fechamento do modal.
- **Validação:**
  - `npx prisma generate` executado com sucesso sincronizando novos modelos com o cliente Prisma local.
  - Build limpo do monorepo (`npm run build`) concluído com 100% de sucesso (`types`, `utils`, `api`, `mobile`).
- **Documentação Atualizada:** `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-25] Correção do Padrão EMVCo BR Code do Pix Copia e Cola (Remoção da Tag 010212)

- **Contexto:** Identificada inconsistência técnica na geração do payload de Pix Copia e Cola: a inclusão indevida da tag `010212` (`Point of Initiation Method = 12`) indicava aos aplicativos bancários tratar-se de um QR Code Dinâmico (que exige URL de cobrança via API bancária). Como o Haru Control opera com QR Code Estático offline (chave Pix direta na subtag 01), os bancos rejeitavam o código com erro de formato ou QR code inválido.
- **Implementações Realizadas:**
  - **1. Utilitário BR Code (`libs/utils/src/lib/pix.ts`):**
    - Removida a emissão da Tag `01` (`010212`) para estrita conformidade com a especificação do Banco Central (Manual BR Code / EMVCo) para Pix Estático com valor fixo.
    - Adicionada sanitização de espaços em branco na chave (`key.replace(/\s+/g, "").trim()`) para prevenir falhas decorrentes de espaçamentos acidentais em variáveis de ambiente.
  - **2. Variáveis de Ambiente & Documentação (`.env.example`):**
    - Documentadas as variáveis `VITE_PIX_KEY`, `VITE_PIX_NAME` e `VITE_PIX_CITY`.
  - **3. Testes Unitários (`libs/utils/src/lib/pix.spec.ts`):**
    - Criados testes unitários validando a estrutura BR Code (início em `00020126`, ausência de `010212`, presença de `br.gov.bcb.pix`, chave, valor monetário formatado e cálculo do CRC16).
- **Validação:** Compilação de todos os pacotes concluída com 100% de sucesso (`npm run build`).
- **Documentação Atualizada:** `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-25] Auto-cópia da Confirmação do Pedido, Ordenação por Preço no Menu de Divulgação e Otimização do Pix

- **Contexto:** Solicitação do usuário para:
  1. Copiar automaticamente a mensagem de confirmação para a área de transferência no momento em que um pedido for criado no `OrderForm`, agilizando o envio imediato no WhatsApp.
  2. Ordenar as categorias e subcategorias na mensagem de divulgação e no checklist do modal pelo preço (do mais barato para o mais caro), criando um padrão uniforme de apresentação.
  3. Diagnóstico e otimização do código Pix Copia e Cola, removendo parâmetros redundantes na Tag 26 e padronizando txid estático (`***`).
- **Implementações Realizadas:**
  - **1. Auto-cópia da Confirmação de Pedido (`OrderForm.tsx`, `OrderBoard.tsx`, `libs/utils`):**
    - Criada a função compartilhada `formatOrderConfirmationMessage()` em `libs/utils/src/lib/utils.ts`.
    - `OrderForm.tsx`: Ao salvar o pedido (ou continuar com avisos), copia automaticamente a mensagem de confirmação formatada para o clipboard e redireciona com estado `{ toastMessage: "Pedido criado e confirmação copiada!" }`.
    - `OrderBoard.tsx`: Escuta `location.state?.toastMessage` exibindo feedback visual imediato via Toast; refatorado `handleCopyOrder` para utilizar o mesmo utilitário compartilhado.
  - **2. Ordenação por Preço no Menu de Divulgação (`BroadcastMenuModal.tsx`):**
    - `generateBroadcastText`: Categorias e subgrupos agora são ordenados estritamente pelo menor preço (ascendente, do mais barato ao mais caro), com desempate alfabético por nome.
    - Modal de Divulgação: Lista de produtos vendáveis (`sellableProducts`) também passa a ordenar os itens em ordem crescente de valor monetário.
  - **3. Otimização do Payload Pix (`OrderBoard.tsx`):**
    - Removida a subtag redundante `description: "Haru Cookies"` dentro da tag 26, eliminando espaços no campo e mantendo a identificação exclusivamente na tag 59 (`Merchant Name`).
    - Padronizado o identificador de transação estático para `txid: "***"`, compatível com 100% dos aplicativos bancários.
- **Validação:** Compilação de todos os pacotes concluída com 100% de sucesso (`npm run build`).
- **Documentação Atualizada:** `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-25] Conversão da Sugestão de Fornada para Modal Acionado pelo Menu Flutuante (FAB)

- **Contexto:** Solicitação do usuário para mover o painel de sugestão de fornada (que anteriormente ficava fixo no topo da página de estoque ocupando espaço vertical) para dentro de um modal sob demanda, acessível diretamente pelo menu do botão de ação flutuante (`FloatingActionButton`).
- **Implementações Realizadas:**
  - **1. Componente de Modal Responsivo (`BakingSuggestionModal.tsx` & `.css`):**
    - Criado componente `BakingSuggestionModal` com overlay com efeito blur, container animado (`bakingModalPop`), cabeçalho temático com badge de unidades a fornar, botão de fechar (`✕`), corpo com rolagem suave independente e rodapé com botões de fechar e fornar sugestão.
    - Suporte a fechamento ao clicar no backdrop e pela tecla `Escape`.
    - Ajustado o z-index do modal aninhado de registro de fornada no estoque (`.bake-modal-backdrop`, z-index 10000) para sobrepor com perfeição o modal de sugestão.
    - Re-exportação mantida em `BakingSuggestionCard.tsx` para compatibilidade retroativa integral.
  - **2. Integração no Menu Flutuante e Limpeza da Tela de Estoque (`Stock.tsx`):**
    - Removido o componente fixo do topo de `Stock.tsx`, permitindo visualização imediata da listagem de produtos e categorias do estoque sem rolagem preliminar.
    - Adicionada a ação `🍪 Sugestão de Fornada` ao menu de ações do `FloatingActionButton`.
    - Integração de estado `isBakingModalOpen` com recarregamento reativo dos dados ao abrir.
  - **3. Atualização dos Testes Automatizados E2E (`08-baking-suggestion.spec.ts`):**
    - Atualizado o fluxo de teste Playwright para abrir o FAB e selecionar "Sugestão de Fornada", mantendo todas as validações de horizonte, breakdown, cópia e lançamento no estoque ativas.
- **Validação:** Compilação de todos os pacotes concluída com 100% de sucesso (`npm run build`).
- **Documentação Atualizada:** `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-25] Atalhos de Datas Dinâmicos no Modal de Fornada e Otimização do Menu Flutuante (FAB)

- **Contexto:** Solicitação do usuário para:
  1. Substituir os botões fixos de presets por um seletor dropdown nativo idêntico ao utilizado nos Insights, calculando dinamicamente as opções com base no dia atual ("Até amanhã", "Até depois de amanhã (dia da semana)", etc.), abrangendo todos os dias da semana corrente até sábado (omitindo domingo, pois não há vendas).
  2. Remover as opções "Entrada de Estoque" e "Ajustar Estoque" do menu flutuante (FAB), visto que o fluxo já é acessado intuitivamente com um toque direto nos cards dos produtos.
- **Implementações Realizadas:**
  - **1. Atalhos Dinâmicos em Dropdown Nativo (`BakingSuggestionModal.tsx` & `.css`):**
    - Criado gerador `dynamicOptions` calculando automaticamente os dias úteis a partir de hoje/amanhã até o sábado da semana em curso.
    - Rótulos formatados fielmente: "Até amanhã (dia)", "Até depois de amanhã (dia)", "Até sábado", etc., com exclusão inteligente de domingos.
    - Seletor estilizado com o padrão `Insights.tsx` (`baking-period-select-wrapper` e `baking-period-select`), acompanhado de campo de data customizada quando "Outra data..." for selecionada.
  - **2. Simplificação do Menu Flutuante (`Stock.tsx`):**
    - Removidos os itens de menu redundantes `Entrada de Estoque` e `Ajustar Estoque`, mantendo `Divulgar Cookies Disponíveis`, `Sugestão de Fornada` e `Registrar Descarte / Perda`.
  - **3. Atualização dos Testes Automatizados E2E (`08-baking-suggestion.spec.ts`):**
    - Adaptada a asserção Playwright para interagir com o novo dropdown nativo de período dinâmico.
- **Validação:** Compilação de todos os pacotes concluída com 100% de sucesso (`npm run build`).
- **Documentação Atualizada:** `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-25] Resolução de BUG-008: Normalização Automática de Chaves Pix para Padrão Internacional E.164 (+55)

- **Contexto:** Identificado que aplicativos bancários rejeitavam o código Pix Copia e Cola gerado para chaves de telefone celular quando informadas sem o prefixo internacional `+55` (ex: `11976952264`). De acordo com a especificação técnica do DICT (Banco Central do Brasil), telefones exigem estritamente o formato E.164 (`+55XXXXXXXXXXX`). Na ausência do `+`, os bancos interpretavam o valor de 11 dígitos como um CPF e rejeitavam a transação.
- **Implementações Realizadas:**
  - **1. Normalizador de Chaves Pix (`libs/utils/src/lib/pix.ts`):**
    - Implementada a função `normalizePixKey()` com algoritmo de validação matemática de CPF (módulo 11).
    - Se a chave for composta por 10 ou 11 dígitos que não correspondam a um CPF válido, ou se começar com `55` sem o `+`, é automaticamente prefixada com `+55` (ex: `11976952264` ou `(11) 97695-2264` ➔ `+5511976952264`).
    - Chaves do tipo e-mail, EVP (UUID), CPF válido e CNPJ continuam preservadas sem alteração.
    - Integrada a normalização diretamente no ponto de entrada de `generatePixPayload()`.
  - **2. Fallback Seguro no Frontend (`OrderBoard.tsx`):**
    - Atualizado o valor padrão de `pixKey` para `+5511976952264` caso a variável `VITE_PIX_KEY` não seja fornecida.
  - **3. Testes Unitários (`libs/utils/src/lib/pix.spec.ts`):**
    - Testes unitários atualizados e expandidos cobrindo chaves com e sem `+55`, com caracteres especiais de máscara, e-mails, UUIDs, CNPJs e validação da subtag `0114+5511976952264`.
- **Validação:** Compilação do monorepo (`npm run build`) concluída com 100% de sucesso e testes validados via script de execução.
- **Documentação Atualizada:** `docs/BUGS.md`, `docs/TASKS.md` e `docs/HISTORY.md`.

### [2026-09-25] Resolução de BUG-009: Correção do Endpoint de Sugestão de Fornada no Modal

- **Contexto:** Usuário reportou que, ao abrir o modal de Sugestão de Fornada na tela de Estoque (`/stock`), o aplicativo exibia imediatamente uma notificação de toast com erro: *"Erro ao carregar previsão de fornada."*.
- **Investigação & Causa Raiz:**
  - Durante a migração da sugestão de fornada de um card estático para o componente `BakingSuggestionModal.tsx`, a requisição foi configurada com o endpoint `GET /analytics/demand-forecast`.
  - A API NestJS não possui nenhum módulo ou controller em `/analytics`, pois o endpoint canônico está declarado em `StockController` (`apps/api/src/modules/stock/stock.controller.ts`) sob `@Get("baking-suggestion")`, acessível via `GET /stock/baking-suggestion`.
  - Além disso, `selectedOptionValue` inicializava como string vazia `""`, o que causava disparo de query prematura antes do período padrão ser atribuído.
- **Implementações Realizadas:**
  - **1. Correção do Endpoint (`BakingSuggestionModal.tsx`):**
    - Substituída a rota de chamada para `api.get("/stock/baking-suggestion", ...)`, alinhando os parâmetros `startDate` e `targetDate` com o backend.
  - **2. Inicialização Síncrona do Dropdown (`BakingSuggestionModal.tsx`):**
    - Extraída a função auxiliar `getDynamicOptions()` e inicializado o estado `selectedOptionValue` diretamente com o valor do preset padrão, evitando re-renders e chamadas duplicadas ou desordenadas na abertura do modal.
- **Validação:** Compilação completa do monorepo (`npm run build`) concluída com 100% de sucesso.
- **Documentação Atualizada:** `docs/BUGS.md`, `docs/TASKS.md` e `docs/HISTORY.md`.












