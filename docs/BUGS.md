# 🐛 Repositório Canônico de Bugs - Haru Control

> **AI Instruction:** Este é o repositório central de bugs do projeto **Haru Control**. Sempre que um bug for identificado ou reportado pelo usuário, use a skill **`report-bug`** para triagem e registro. Todo bug recebe um ID único sequencial (`BUG-001`, `BUG-002`, ...), é espelhado no topo de `docs/TASKS.md` e recebe prioridade máxima de trabalho.

---

## 📌 Índice de Bugs

| ID | Status | Validação Prática | Severidade | Título Curto | Componente Afetado | Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-000` | `[x]` Resolvido | `✅ Validado` | `🟢 Baixa` | Exemplo de Bug de Demonstração (Template) | `src/example.ts` | 2026-09-02 |
| `BUG-001` | `[x]` Implementado | `⏳ Pendente` | `🔴 Alta` | Erros de CORS nas requisições da API no frontend | `apps/api/src/main.ts`, `Dockerfile.mobile` | 2026-09-02 |

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
