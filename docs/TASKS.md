# 📋 Checklist de Tarefas - Haru Control

## 🐛 Bugs Prioritários (BUGS.md)
> **NOTA DE PRIORIDADE MÁXIMA:** Bugs listados nesta seção têm **prioridade absoluta de trabalho** sobre qualquer nova feature, refatoração ou ajuste normal do projeto. Sempre que um bug for reportado, registre-o primeiro em `docs/BUGS.md` com ID único (ex: `BUG-001`) e adicione-o no topo desta lista via skill `report-bug`.

- `[ ]` **[BUG-001]** Erros de CORS nas requisições da API no frontend — *[🟡 Implementado: CORS dinâmico e ARG de build no Dockerfile — ⏳ Aguardando Validação Prática]*

---

## 🎯 Fase 1: Transição de Ambientes (Coolify Prod/Dev) & Fechamento do MVP

- `[ ]` **Segregação de Ambientes & Infraestrutura no Coolify:**
  - `[x]` Renomear/reconfigurar a aplicação atual no Coolify para **Produção** (preservando banco de dados com dados reais).
  - `[x]` Criar e publicar branch de produção no Git (`production`).
  - `[x]` Criar nova aplicação e novo banco de dados PostgreSQL isolado no Coolify para **Desenvolvimento**.
  - `[x]` Conectar a branch `main` do repositório ao novo ambiente de Desenvolvimento no Coolify e configurar `.env` local.
- `[x]` **Normalização do Pipeline de Migrations do Prisma:**
  - `[x]` Limpar comandos provisórios do `Dockerfile.api` (garantido `npx prisma migrate deploy`).
  - `[x]` Garantir que o container execute estritamente `npx prisma migrate deploy` no bootstrap.
  - `[x]` Validar execução e idempotência das migrations no novo banco de desenvolvimento.
- `[ ]` **Validação Operacional & Fechamento da Fase 1:**
  - `[x]` Criar script de seed (`apps/api/prisma/seed.ts`) com massa de dados realista da Haru Cookies (sem café/álcool).
  - `[x]` Testar segregação de ambientes e deploy do Coolify via alteração visual na branch `main`.
  - `[ ]` Testar fluxo completo de ponta a ponta (login PIN/biometria, criação de pedido, baixa de estoque, manufatura e insights) em Dev.
  - `[ ]` Validar que o ambiente de Produção permanece 100% íntegro e operacional.
  - `[ ]` Arquivar o histórico da Fase 1 em `docs/HISTORY_ARCHIVE.md` e abrir a Fase 2.

---

## 🔮 Fases Futuras & Backlog

### Fase 2: Expansão Operacional, Automações & Relatórios
- `[x]` **Navegação por Swipe (Gesto de Deslizar) entre Abas de Pedidos:**
  - Permitir alternar entre as colunas/abas (`Rascunho`, `Em Produção`, `Em Entrega`, `Concluídos`) por gesto de deslizar horizontal (swipe left/right) na tela, facilitando o uso com uma só mão (alcance do dedão na parte inferior), sem bloquear a rolagem vertical.
- `[x]` **Ajuste e Simplificação da Mensagem Copiada do Pedido (Comanda WhatsApp):**
  - Remover o nome do cliente da mensagem copiada ao clicar no ícone 📋 do card de pedido.
  - Avaliar/definir se o endereço de entrega permanece como campo condicional ou se a mensagem retorna 100% ao formato original enxuto (Itens + Subtotal + Taxa de Entrega + Total + "Certo?").
- `[x]` **Pedidos Retroativos, Tela de Histórico Geral e Edição de Pedidos:**
  - **Endpoint Batch de Importação / Criação Retroativa:**
    - Criar endpoint `POST /orders/batch` recebendo um array de pedidos.
    - Suportar definição explícita de `status`, `createdAt` (data de criação retroativa), `completedAt` (data de conclusão), cliente, itens, preços e endereço.
    - Suporte a execução via scripts externos ou ferramentas de carga em lote, criando as baixas e vendas contábeis retroativas de forma consistente.
  - **Nova Tela de Histórico de Pedidos no App:**
    - Nova tela (`/orders/history`) acessível pela navegação/cabeçalho, exibindo tabela/lista completa de todos os pedidos já realizados com filtros e busca.
    - Botão para **"Novo Pedido Histórico"**: formulário permitindo cadastrar pedidos passados diretamente pelo app, escolhendo data/hora de criação, conclusão e status.
  - **Edição Flexível de Pedidos:**
    - Permitir editar qualquer pedido existente (mesmo já concluído) para retificar informações (itens, valores, status, datas de criação e conclusão), prevenindo erros operacionais.
- `[x]` **Instituição de Testes Automatizados E2E com Playwright (Qualidade & Confiabilidade):**
  - **Ambiente & Arquitetura de Testes E2E:**
    - Configurado ambiente Playwright com emulação mobile-first nativa (`Pixel 7`, touch, viewport 412x915).
    - Definição da stack em TypeScript integrado ao monorepo Nx com compartilhamento de tipos e scripts dedicados.
    - Estrutura de fixtures de autenticação (`auth.setup.ts` gerando `e2e/.auth/user.json`) para bypass rápido de PIN em milissegundos.
    - Configuração de `webServer` no Playwright para auto-inicialização da API e Mobile.
  - **Page Objects (POM) & Suíte Inicial de Testes Críticos:**
    - Criação de Page Objects das principais páginas (`LoginPage`, `OrderBoardPage`, `OrderFormPage`, `OrderHistoryPage`).
    - Testes de ponta a ponta dos fluxos centrais: autenticação (PIN correto e inválido), criação de pedido e movimentação completa de status até conclusão com confirmação ACK, navegação por abas e gestos de swipe horizontal por toque, e cadastro de pedidos retroativos com filtros.
  - **Automação & Execução:**
    - Scripts de execução adicionados ao `package.json` (`test:e2e`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:codegen`) e guia completo para novos QAs em `e2e/README.md`.
- `[ ]` **Integração de Pix Copia e Cola Dinâmico no Pedido com Gestão de Status:**
  - **Geração de Código Pix:** Gerar código Pix "Copia e Cola" (e QR Code) com o valor exato final do pedido (produtos + taxa de entrega) e identificador único (`txid`).
  - **Ciclo de Vida & Status do Pagamento:**
    - Novos campos no modelo `Order` (ex: `pix_code`, `pix_txid`, `pix_status` [PENDING, PAID, EXPIRED], `pix_generated_at`, `pix_paid_at`).
    - Registro de histórico e auditoria de quando o código foi gerado e quando o pagamento foi confirmado.
  - **UI/UX Mobile:**
    - Botão de ação rápida no card/modal para gerar e copiar a chave Pix com 1 toque.
    - Opção de anexar o código Pix diretamente na mensagem formatada enviada ao cliente via WhatsApp.
    - Badges visuais de status do Pix no card (ex: 🟡 Aguardando Pix, 🟢 Pix Pago).
- `[x]` **Confirmação Interna de Pedidos (ACK no App) e Controle de Notificações:**
  - **Controle Opcional de Notificação na Criação/Edição:**
    - Adicionar checkbox no formulário do pedido (`OrderForm.tsx`): *"Enviar alerta sonoro de emergência (Pushover)"*, com **valor padrão marcado (`true`)**.
    - Se desmarcado, enviar `notify: false` no payload da API para não disparar o alarme no celular (ideal para pedidos presenciais de balcão ou quando o confeiteiro já estiver no local).
  - **Confirmação Direta pelo Aplicativo (ACK no App):**
    - Permitir confirmar o recebimento do pedido diretamente pela interface do Haru Control (tanto no card quanto no modal de detalhes), gravando `acknowledgedAt: new Date()` e cancelando o alarme ativo no Pushover.
    - Suportar confirmação interna mesmo se a notificação Pushover não tiver sido disparada, permitindo sinalizar que a cozinha já viu e está ciente do pedido.
- `[ ]` **Projeção de Faturamento Mensal na Tela de Insights:**
  - **Cálculo Linear Inicial (Run Rate):** Calcular a projeção de fechamento do mês atual através da fórmula: `(Faturamento Acumulado no Mês / Dias Decorridos até Hoje) * Total de Dias do Mês Atual`.
  - **Exibição na UI:** Exibir card destacado de métrica na tela `/insights` com o valor projetado, indicando a média diária e o número de dias restantes do mês.
  - **Evolução Futura:** Deixar a arquitetura preparada para modelos preditivos mais avançados (levando em conta sazonalidade de dias da semana, quinta a domingo com maior pico de vendas).
- `[ ]` **Previsão Estatística de Demanda e Sugestão de Produção Diária (Planejamento de Fornada):**
  - **Motor de Recomendação Baseado em Dados:**
    - Analisar o histórico de vendas por dia da semana (ex: segundas vs sextas/sábados) e médias móveis ponderadas das últimas semanas.
    - Calcular a necessidade prevista de cada produto para o dia, aplicando uma margem de segurança configurável.
  - **Cruzamento Inteligente com Estoque e Ficha Técnica (BOM):**
    - Subtrair os cookies já assados/disponíveis no estoque atual para sugerir a quantidade líquida exata a produzir.
    - Alertar se há massa/ingredientes suficientes no estoque para cobrir a sugestão do dia.
  - **Interface no App (`/manufacturing`):**
    - Painel/cartão *"Sugestão de Fornada para Hoje"*, com botão rápido para gerar a ordem de produção em 1 toque.
- `[ ]` **Módulo de Descarte de Produtos / Insumos (Controle de Perdas & Validade):**
  - **Ledger Contábil de Descarte:**
    - Adicionar operação `WASTE` (ou `DISCARD`) ao enum `LedgerOperationType` no Prisma.
    - Gravar motivo do descarte (ex: *"Validade Vencida"*, *"Quebra/Avaria"*, *"Falha de Forno/Preparo"*, *"Teste/Degustação"*) e observações.
    - Baixar imediatamente a quantidade descartada do estoque no Ledger imutável.
  - **Interface de Registro no Mobile (`/stock`):**
    - Botão *"Registrar Descarte / Perda"* na tela de Estoque.
    - Modal intuitivo para selecionar o produto/insumo, quantidade, motivo e data do descarte.
  - **Métricas e Relatórios nos Insights (`/insights`):**
    - Card de KPI com o total de perdas do mês (custo estimado em R$ e volume).
    - Gráfico com os produtos mais descartados e distribuição por motivo (ex: % validade vs % quebra), ajudando a identificar gargalos de produção e compras.
- `[ ]` Relatórios de margem de lucro por cookie e custo de matéria-prima (DRE simplificado).
- `[ ]` Melhoria na fluidez do drag-and-drop no Kanban mobile (@dnd-kit).
- `[ ]` Histórico detalhado de compras de insumos e preço médio ponderado.
- `[ ]` Suporte a PWA instalável com service workers.
- `[ ]` Módulo de impressão de pedidos em impressoras térmicas de balcão (58mm/80mm).
