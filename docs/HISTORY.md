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
- **Documentação Atualizada:** [docs/TASKS.md](docs/TASKS.md) e [docs/HISTORY.md](docs/HISTORY.md).

---
