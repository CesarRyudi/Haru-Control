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
