# 🚀 Haru Control Master Index

> **AI Resume Command:** "Leia este arquivo (HARU_CONTROL_INDEX.md) e o diretório `./docs` para retomar o contexto completo do projeto Haru Control."

Este é o ponto de entrada principal para qualquer sessão de desenvolvimento no **Haru Control**. Este arquivo organiza a documentação para que modelos de IA possam entender o estado atual do projeto gastando o mínimo possível de tokens.

## 📌 Mapa da Documentação

Para prosseguir, leia os arquivos abaixo na ordem sugerida:

1. **[docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)**:
   - **O QUE É:** Visão geral da loja de cookies, Mapa de Arquitetura Monorepo Nx, Glossário de Domínio e Roadmap de Fases.
   - **QUANDO ATUALIZAR:** Se uma fase do roadmap mudar, novos módulos/rotas nascerem ou novos termos de negócio forem introduzidos.
2. **[docs/ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md)** (ADRs):
   - **O QUE É:** Registros sobre arquitetura técnica (Estoque em Ledger Contábil, Autenticação PIN/WebAuthn, Manufatura/BOM e Estratégia de Deploy Coolify).
   - **QUANDO ATUALIZAR:** Quando houver criação ou alteração de paradigmas técnicos de alta complexidade.
3. **[docs/BUGS.md](docs/BUGS.md)**:
   - **O QUE É:** Repositório canônico de bugs, post-mortems e análise de causa raiz com IDs únicos (`BUG-001`).
   - **QUANDO ATUALIZAR:** **Prioridade Máxima.** Sempre que um bug for reportado ou resolvido. Todos os bugs devem ser detalhados com sintomas, causa raiz e prevenção.
4. **[docs/HISTORY.md](docs/HISTORY.md)**:
   - **O QUE É:** Registro técnico e cronológico estritamente da **fase atual** do projeto.
   - **QUANDO ATUALIZAR:** Proativamente, a cada passo significativo. Quando a fase for concluída, seu conteúdo é arquivado em **[docs/HISTORY_ARCHIVE.md](docs/HISTORY_ARCHIVE.md)** (Token Diet).
5. **[docs/TASKS.md](docs/TASKS.md)**:
   - **O QUE É:** O checklist ativo de tarefas e bugs prioritários no topo.
   - **QUANDO ATUALIZAR:** Durante o desenvolvimento, marcando itens como `[x]` ou `[/]`.

---

## 🛠️ Regras de Manutenção (Para IAs)

Para garantir que a próxima sessão seja eficiente e economize tokens:

1. **Não peça para "ler o código todo"**: O `HISTORY.md` e o `TASKS.md` devem ser suficientes para entender _onde paramos_.
2. **Mantenha os arquivos curtos**: Use listas e bullet points. Evite parágrafos longos.
3. **Documente Decisões**: Se o usuário aprovou algo importante (ex: uma biblioteca ou modelo de dados), registre imediatamente no `HISTORY.md`.
4. **Sincronização**: Ao final de cada turno longo, verifique se o `TASKS.md` reflete a realidade dos arquivos alterados.
5. **Gestão Inflexível de Bugs (Prioridade Máxima)**: Sempre que o usuário reportar um bug, invoque a skill **`report-bug`** para realizar a triagem completa, investigar a causa raiz, criar o registro com ID sequencial em `docs/BUGS.md` (ex: `BUG-001`) e espelhá-lo no topo do `docs/TASKS.md`. Bugs têm prioridade de trabalho absoluta sobre qualquer outra task.
6. **Autorização Explícita para Commits e Deploys**: A IA **NUNCA** deve executar comandos de `git commit` ou `git push` sob nenhuma circunstância sem perguntar e obter a confirmação/autorização clara do usuário antes.

---

## 📡 Estado Atual (Resumo Rápido)

- **Fase atual:** Fase 1 — Segregação de Ambientes (Coolify Prod vs Dev) & Fechamento do MVP
- **Produção / Deploy:** Coolify (Ambiente único atualmente em uso real, a ser promovido para Produção oficial)
- **Fases Concluídas:** Fase 1 (MVP Operacional Core: Autenticação PIN/WebAuthn, Board de Pedidos, Ledger de Estoque, Gestão de Produtos/Categorias, BOM/Manufatura, Clientes, Pushover, Insights)
- **Funcionalidades Adiadas / Backlog:** Separação de branches (`main` para dev e branch dedicada para prod), retorno de `npx prisma migrate deploy` no Dockerfile da API, relatórios avançados de margem/insumos
- **Infra / Stack Base:** Monorepo Nx (NestJS 10 + Prisma 5 + PostgreSQL 15 + React 18 + Vite 5 + Zustand + Pushover + Coolify)
