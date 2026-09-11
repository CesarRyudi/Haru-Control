# 🐛 Repositório Canônico de Bugs - Haru Control

> **AI Instruction:** Este é o repositório central de bugs do projeto **Haru Control**. Sempre que um bug for identificado ou reportado pelo usuário, use a skill **`report-bug`** para triagem e registro. Todo bug recebe um ID único sequencial (`BUG-001`, `BUG-002`, ...), é espelhado no topo de `docs/TASKS.md` e recebe prioridade máxima de trabalho.

---

## 📌 Índice de Bugs

| ID | Status | Validação Prática | Severidade | Título Curto | Componente Afetado | Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-000` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Exemplo de Bug de Demonstração (Template) | `src/example.ts` | 2026-09-02 |
| `BUG-001` | `[x]` Implementado | `⏳ Pendente` | `🔴 Alta` | Erros de CORS nas requisições da API no frontend | `apps/api/src/main.ts`, `Dockerfile.mobile` | 2026-09-02 |
| `BUG-002` | `[x]` Implementado | `⏳ Pendente` | `🟡 Média` | Quebra de layout e overflow no modal de pedidos históricos | `apps/mobile/src/pages/OrderHistory.tsx`, `apps/mobile/src/pages/OrderForm.tsx` | 2026-09-11 |

---

## 🔍 Registro Detalhado de Bugs

### [BUG-001] Erros de CORS nas requisições da API no frontend
- **Status:** `[x]` Implementado
- **Validação Prática:** `[ ]` Pendente de Validação
- **Severidade:** `🔴 Alta`
- **Data de Registro:** 2026-09-02
- **Data de Implementação:** 2026-09-02
- **Data de Validação:** N/A
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
- **Status:** `[x]` Implementado
- **Validação Prática:** `[ ]` Pendente de Validação
- **Severidade:** `🟡 Média`
- **Data de Registro:** 2026-09-11
- **Data de Implementação:** 2026-09-11
- **Data de Validação:** N/A
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
