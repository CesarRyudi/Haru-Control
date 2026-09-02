# 🏛️ Architecture Decision Records (ADRs) - Haru Control

Este arquivo documenta as decisões arquiteturais pesadas, complexas e fundamentais do projeto **Haru Control**. Mantemos esses registros separados do histórico cronológico e do contexto principal para evitar sobrecarga cognitiva e desperdício de tokens na leitura inicial do agente. 

Consulte as seções deste arquivo **apenas** quando for trabalhar em componentes ou módulos diretamente relacionados à decisão registrada.

---

## 📌 Índice de ADRs

| ADR | Título | Status | Data |
| :--- | :--- | :--- | :--- |
| **ADR 01** | Controle de Estoque Baseado em Ledger Contábil Imutável | `Aprovada` | 2025-12-04 |
| **ADR 02** | Autenticação Operacional via PIN com Suporte Biométrico WebAuthn | `Aprovada` | 2026-01-10 |
| **ADR 03** | Ficha Técnica de Produtos (BOM) e Baixa Automática de Insumos | `Aprovada` | 2026-08-13 |
| **ADR 04** | Isolamento de Ambientes no Coolify e Pipeline de Migrations do Prisma | `Aprovada` | 2026-09-02 |

---

## ADR 01: Controle de Estoque Baseado em Ledger Contábil Imutável

### 1. Contexto & Problema
Em operações de confeitaria e delivery, estoques sofrem frequentes alterações rápidas: entradas de fornecedores, reservas temporárias para pedidos em aberto, cancelamentos de pedidos, perdas e quebras, e vendas concluídas. Abordagens tradicionais baseadas em atualizar diretamente uma coluna `stock: number` na tabela de produtos perdem a rastreabilidade histórica, impossibilitam auditoria e geram condições de corrida em concorrência. Além disso, no atendimento ágil de balcão, a operação não pode travar se o estoque virtual estiver zerado/negativo, mas deve emitir alertas.

### 2. Decisão Adotada & Estratégia Técnica
Implementar um **Ledger Contábil de Estoque** com lançamentos imutáveis na tabela `ledger_entries`. O saldo atual de qualquer produto é obtido somando-se todas as entradas correspondentes.
- **Tipos de Lançamento (`LedgerOperationType`):**
  - `STOCK_IN`: Entrada manual de mercadoria/insumo.
  - `STOCK_ADJUSTMENT` / `CORRECTION`: Ajuste de inventário físico.
  - `RESERVE`: Reserva efetuada no momento da criação/edição do pedido.
  - `RELEASE`: Liberação da reserva caso o pedido seja cancelado.
  - `SALE`: Baixa definitiva do produto quando o pedido é concluído.
  - `MANUFACTURING_PRODUCTION`: Entrada de estoque do produto acabado (cookie) após fornada.
  - `MANUFACTURING_CONSUMPTION`: Baixa proporcional de cada insumo utilizado na receita.
- **Tolerância a Saldo Negativo:** O sistema calcula o saldo e permite que ele fique negativo (com alerta visual na UI), impedindo que a equipe de atendimento perca vendas por atraso no lançamento manual de compras.

### 3. Alternativas Analisadas & Trade-offs
- **Opção A (Descartada - Coluna `stock` estática):** Simples de implementar, mas sem histórico de quem/quando/onde gerou a discrepância. Risco alto de inconsistências.
- **Opção B (Escolhida - Ledger Imutável):** Garante rastreabilidade total de cada grama/unidade, auditoria perfeita e facilita reversão de pedidos sem corrupção de estado.

### 4. Impacto Esperado & Métricas
| Métrica / Critério | Comportamento Esperado |
| :--- | :--- |
| Rastreabilidade | 100% dos movimentos de estoque vinculados a um pedido ou operação manual |
| Integridade | Sem risco de perda de histórico por overwrite |
| Performance | Consultas otimizadas via agregações Prisma indexadas por `productId` |

### 5. Isolamento de Responsabilidades
- `apps/api/src/modules/stock`: Responsável exclusivo por registrar transações no ledger e computar snapshots de saldo.
- `apps/api/src/modules/orders`: Aciona o serviço de estoque para reservar, liberar ou concretizar vendas via transações ACID do Prisma.

---

## ADR 02: Autenticação Operacional via PIN com Suporte Biométrico WebAuthn

### 1. Contexto & Problema
O sistema é utilizado no balcão e na cozinha por atendentes em dispositivos móveis compartilhados (tablets e smartphones). Sistemas tradicionais de autenticação com e-mail/senha longos ou OAuth2 individual causam atrito severo na operação rápida diária. Ao mesmo tempo, era necessário proteger o acesso contra pessoas não autorizadas e agilizar a reautenticação diária no navegador.

### 2. Decisão Adotada & Estratégia Técnica
- **Acesso Base:** Autenticação por PIN numérico compartilhado (`PIN_CODE` configurado nas variáveis de ambiente), validado pelo backend via endpoint `/auth/pin`.
- **Aceleração Mobile via WebAuthn:** Integração com a API nativa de credenciais do navegador (WebAuthn / Passkeys / FIDO2). Após o primeiro login com PIN bem-sucedido, o atendente pode registrar a biometria do dispositivo (Touch ID / Face ID / Leitor de Digital do celular), permitindo logins subsequentes em 1 toque.

### 3. Alternativas Analisadas & Trade-offs
- **Opção A (Descartada - Login tradicional com usuários individuais):** Inviável para o ritmo de balcão e geraria custos operacionais desnecessários para a equipe enxuta da loja.
- **Opção B (Escolhida - PIN + WebAuthn):** Máxima velocidade operacional com proteção adequada para o ambiente da loja.

---

## ADR 03: Ficha Técnica de Produtos (BOM) e Baixa Automática de Insumos

### 1. Contexto & Problema
Para produzir cookies, a confeitaria utiliza múltiplos insumos comprados em quilos/litros/unidades (manteiga, farinha, chocolate belga, confeitos, embalagens). Registrar manualmente a baixa de cada ingrediente a cada fornada é demorado e propenso a erros humanos graves.

### 2. Decisão Adotada & Estratégia Técnica
- **Estrutura de Receita (`RecipeItem`):** Tabela que relaciona o produto acabado pai (`parentId`) aos insumos filhos (`childId`) com suas respectivas proporções e unidades de medida.
- **Conversão Inteligente de Unidades:** O módulo de manufatura realiza a conversão automática entre unidades de compra/estoque e unidades de receita (ex: kg para gramas, litros para ml).
- **Execução Atômica de Manufatura:** Ao registrar a produção de $N$ unidades de um cookie, o backend executa em uma única transação de banco:
  1. Criação do registro `MANUFACTURING_PRODUCTION` para o cookie pronto (+N).
  2. Criação dos registros `MANUFACTURING_CONSUMPTION` para cada insumo (-Qtd * N).

---

## ADR 04: Isolamento de Ambientes no Coolify e Pipeline de Migrations do Prisma

### 1. Contexto & Problema
O MVP entrou em produção real rapidamente e passou a ser utilizado no dia a dia da loja de cookies. Como a branch `main` estava conectada diretamente a uma instância de desenvolvimento do Coolify com dados reais, surgiu a necessidade crítica de isolar os ambientes para que novas features não quebrem o sistema em uso pelos atendentes. Além disso, uma flag provisória (`--accept-data-loss` / `db push`) havia sido utilizada temporariamente para acelerar testes.

### 2. Decisão Adotada & Estratégia Técnica
1. **Promoção para Produção:** A instância atual do Coolify (com o banco PostgreSQL populado e dados em uso) passa a ser oficialmente a instância de **Produção**, conectada a uma branch protegida ou release tag.
2. **Novo Ambiente de Desenvolvimento:** Criação de uma nova aplicação no Coolify com banco de dados independente para testes e desenvolvimento contínuo a partir da branch `main`.
3. **Pipeline Estrito de Migrations:**
   - Em desenvolvimento: `npx prisma migrate dev` para gerar arquivos SQL formais e versionados.
   - No Dockerfile e deploy de produção: `npx prisma migrate deploy` garantindo idempotência e zero perda de dados.
