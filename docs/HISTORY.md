# 📜 Histórico Técnico de Desenvolvimento - Haru Control

> **AI Instruction (Token Diet):** Este arquivo contém estritamente o histórico de desenvolvimento da **FASE ATUAL** (ativa). 
> Quando uma fase for concluída, todo o conteúdo correspondente deve ser movido para `docs/HISTORY_ARCHIVE.md`, mantendo este arquivo enxuto para poupar tokens de contexto.

---

## 📍 Fase 1: Transição de Ambientes (Coolify Prod/Dev) & Estabilização do MVP

### [2026-09-02] Baseline Inicial — Importação do Sistema de Documentação CF Docs

- **Contexto:** Catalogação e estruturação oficial de governança e documentação para o projeto **Haru Control**. O sistema encontra-se com o MVP operacional completo, testado e em uso diário real na operação da loja de cookies (atendimento no condomínio e pedidos do iFood).
- **Decisões Tomadas:**
  - Inicialização do sistema padronizado de documentação com arquitetura Token Diet (`HARU_CONTROL_INDEX.md`, `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE_DECISIONS.md`, `docs/BUGS.md`, `docs/HISTORY.md`, `docs/HISTORY_ARCHIVE.md`, `docs/TASKS.md`).
  - Estabelecimento das regras globais de governança em `.agents/AGENTS.md` (Regra de Ouro da documentação, prioridade absoluta para resolução de bugs e proibição estrita de commits/pushes sem autorização explícita).
  - Criação das skills locais `.agents/skills/haru-control-init` (retomada inteligente de contexto) e `.agents/skills/report-bug` (triagem sequencial de bugs).
  - Formalização das ADRs 01 a 04 cobrindo o Estoque em Ledger, Autenticação PIN/WebAuthn, Receitas/BOM e Estratégia de Deploy Coolify.
- **Estado dos Módulos Catalogados:**
  - `apps/api`: NestJS com módulos de `auth`, `categories`, `customers`, `manufacturing`, `notifications` (Pushover), `orders`, `products`, `stock` (Ledger).
  - `apps/mobile`: React SPA com telas de `PinLogin`, `OrderBoard`, `OrderForm`, `Products`, `ProductRecipe`, `Stock`, `Manufacturing`, `Customers`, `Insights`, `Help`.
  - `libs`: Shared libs `types`, `ui`, `utils`.
  - `infra`: Dockerfiles e Coolify em uso real.
- **Próximos Passos Imediatos:**
  1. Planejar e executar a segregação de ambientes no Coolify: promover a instância atual com banco existente para Produção e criar uma nova instância para Desenvolvimento a partir da `main`.
  2. Ajustar o `Dockerfile.api` para retornar ao fluxo seguro de `npx prisma migrate deploy`.

### [2026-09-02] Criação da Branch Oficial de Produção

- **Contexto:** Isolamento da branch de produção a partir do estado atual da `main` para permitir a segregação de ambientes no Coolify sem risco para os dados reais em operação.
- **Decisões & Ações:**
  - Commit e push da documentação e governança inicial na `main`.
  - Criação da branch `production` e push para o repositório remoto (`origin/production`).
  - Retorno do ambiente local de trabalho para a branch `main`.
- **Próximos Passos Imediatos:**
  - Alterar a branch da aplicação existente no Coolify de `main` para `production`.
  - Criar o novo ambiente de desenvolvimento no Coolify conectado à `main`.

### [2026-09-02] Configuração do Novo Banco de Dados de Desenvolvimento & Validação de Migrations

- **Contexto:** Conexão do ambiente local e de desenvolvimento ao novo banco de dados PostgreSQL isolado criado no Coolify.
- **Decisões & Ações:**
  - Configuração da `DATABASE_URL` no `.env` raiz e em `apps/api/.env` apontando para a nova instância remota de Dev (`143.95.211.48:5432/postgres`).
  - Execução de `npx prisma migrate status`: verificado com sucesso que todas as 6 migrations existentes estão 100% aplicadas e íntegras no banco novo.
  - Verificação do `Dockerfile.api`: confirmado que a imagem já utiliza o comando seguro `npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && node dist/apps/api/main.js`.
- **Próximos Passos Imediatos:**
  - Testar o fluxo operacional ponta a ponta no ambiente de desenvolvimento.

### [2026-09-02] Exibição do Nome do Cliente no Card de Pedidos

- **Contexto:** Solicitação para tornar o nome do cliente visível no card de pedidos (`OrderBoard`), posicionado logo abaixo do endereço em tamanho menor.
- **Decisões & Alterações:**
  - `libs/types/src/lib/types.ts`: Atualizada a interface `Order` com os campos opcionais `customer?: Customer | null` e `items?: any[]`.
  - `apps/mobile/src/pages/OrderBoard.tsx`:
    - Adicionada a renderização de `order.customer.name` com ícone de usuário (`👤`) logo abaixo do endereço no `OrderCard`.
    - Atualizado o cabeçalho do modal de detalhes do pedido para incluir nome do cliente e endereço.
    - Atualizada a função `handleCopyOrder` para incluir o nome do cliente na mensagem formatada da comanda.
  - `apps/mobile/src/pages/OrderBoard.css`: Estilizada a classe `.order-customer-name` (15px, semi-bold, cor neutra balanceada) e ajustes de margem no endereço e modal.
  - Validação de build executada com sucesso (`npx nx build mobile` e `npx nx build api`).

### [2026-09-02] Criação do Script de Seed e Migração de Campos Pushover

- **Contexto:** Necessidade de popular o ambiente de desenvolvimento com uma massa de dados rica e realista para validação visual e operacional do Kanban, Estoque, Manufatura e gráficos de Insights.
- **Decisões & Implementações:**
  - **Migration Prisma (`20260902165120_add_pushover_fields`):** Gerada e aplicada formalmente via `npx prisma migrate dev` para sincronizar os campos `pushover_receipt` e `acknowledged_at` na tabela `orders`.
  - `apps/api/prisma/seed.ts`: Criado e executado com sucesso script automatizado de seed usando `@prisma/client`.
    - **Restrições respeitadas:** Exclusão estrita de qualquer item contendo café ou álcool.
    - **Categorias (5):** Cookies Clássicos, Cookies Especiais & Recheados, Cookies Sazonais, Bebidas Refrescantes & Chocolates, Insumos & Matérias-Primas.
    - **Insumos (22):** Farinha especial, manteiga extra, chocolate belga 54% Callebaut, chocolate ao leite, chocolate branco, Nutella, pistache puro, cacau black, doce de leite artesanal, baunilha de Madagascar, embalagens kraft, etc.
    - **Produtos Vendíveis (18):** 10 cookies artesanais e 8 bebidas (chocolates cremosos, leites aromatizados, sodas italianas, sucos e chás naturais).
    - **Fichas Técnicas (BOM):** 55 relacionamentos de receitas (`RecipeItem`) para cálculo automatizado de consumo na manufatura.
    - **Clientes (30):** Clientes com telefones e endereços realistas de condomínio (Torres, Blocos, Casas).
    - **Ledger de Estoque:** Entradas de estoque inicial (`STOCK_IN`) e simulação de produções/consumos (`MANUFACTURING_PRODUCTION` / `MANUFACTURING_CONSUMPTION`).
    - **Histórico de Pedidos & Vendas (30 dias):** 146 pedidos concluídos com registro em `Sale` e `LedgerEntry` de venda (`SALE`), com distribuição concentrada nos horários de pico (14h às 20h30) e dias de maior movimento (quinta a domingo) para a tela de Insights.
    - **Pedidos no Kanban:** Pedidos distribuídos nas colunas ativas (4 em `PENDING`, 3 em `READY`, 2 em `DRAFT` e 2 em `CANCELLED`) com lançamentos contábeis de reserva (`RESERVE` / `RELEASE`).
  - `package.json`: Adicionados os comandos `"seed"` e `"prisma:seed"`, além da configuração `"prisma": { "seed": "..." }`.

### [2026-09-02] Resolução do BUG-001: Ajuste de CORS e Build Args do Docker

- **Contexto:** Relato de erros de CORS ao acessar o frontend no ambiente de nuvem do Coolify chamando a API.
- **Decisões & Correções:**
  - `apps/api/src/main.ts`: Configurado `app.enableCors({ origin: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', credentials: true, allowedHeaders: '...' })` para refletir dinamicamente a origem e autorizar headers de preflight.
  - `Dockerfile.mobile`: Declaradas as diretivas `ARG VITE_API_URL` e `ENV VITE_API_URL=$VITE_API_URL` na etapa de build do Docker, garantindo que o Vite capture a URL remota da API durante `npx nx build mobile --prod`.
  - Validação de compilação da API e do Mobile executada com sucesso.

### [2026-09-08] Teste Visual de Deploy Segregado (Dev vs Prod)

- **Contexto:** Validação prática do pipeline de deploy do Coolify para garantir que alterações enviadas para a branch `main` afetem exclusivamente o ambiente de Desenvolvimento (`Dev`), mantendo o ambiente de Produção (`production`) 100% inalterado.
- **Decisões & Alterações:**
  - `apps/mobile/src/pages/PinLogin.tsx`: Adicionado badge estilizado `DEV 🧪` ao lado do título principal "Haru Control".
  - `apps/mobile/src/pages/OrderBoard.tsx`: Adicionado badge estilizado `DEV 🧪` ao lado do cabeçalho "Pedidos".
  - **Isolamento de Branches:** Código commitado e mergeado na branch `main`. A branch `production` permanece intacta.
  - Validação de build executada com sucesso (`npx nx build mobile`).

### [2026-09-08] Validação do Deploy Segregado e Reversão dos Badges de Teste

- **Contexto:** Teste em nuvem concluído com sucesso total. O deploy automático do Coolify na branch `main` atualizou exclusivamente o ambiente de Desenvolvimento (`Dev`), enquanto o ambiente de Produção (`production`) permaneceu 100% inalterado e isolado.
- **Decisões & Reversão:**
  - `apps/mobile/src/pages/PinLogin.tsx`: Removido o badge provisório `DEV 🧪`, restaurando o título limpo original `Haru Control`.
  - `apps/mobile/src/pages/OrderBoard.tsx`: Removido o badge provisório `DEV 🧪`, restaurando o título limpo original `Pedidos`.
  - Validação de build executada com sucesso (`npx nx build mobile`).
  - Commit e push executados na branch `main`.

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


