# 📋 Checklist de Tarefas - Haru Control

## 🐛 Bugs Prioritários (BUGS.md)
> **NOTA DE PRIORIDADE MÁXIMA:** Bugs listados nesta seção têm **prioridade absoluta de trabalho** sobre qualquer nova feature, refatoração ou ajuste normal do projeto. Sempre que um bug for reportado, registre-o primeiro em `docs/BUGS.md` com ID único (ex: `BUG-001`) e adicione-o no topo desta lista via skill `report-bug`.

*(Nenhum bug aberto no momento)*

---

## 🎯 Fase 1: Transição de Ambientes (Coolify Prod/Dev) & Fechamento do MVP

- `[ ]` **Segregação de Ambientes & Infraestrutura no Coolify:**
  - `[ ]` Renomear/reconfigurar a aplicação atual no Coolify para **Produção** (preservando banco de dados com dados reais).
  - `[ ]` Criar e proteger branch de produção no Git (ex: `production` ou release branch).
  - `[ ]` Criar nova aplicação e novo banco de dados PostgreSQL isolado no Coolify para **Desenvolvimento**.
  - `[ ]` Conectar a branch `main` do repositório ao novo ambiente de Desenvolvimento no Coolify.
- `[ ]` **Normalização do Pipeline de Migrations do Prisma:**
  - `[ ]` Limpar comandos provisórios do `Dockerfile.api` (remover flags de risco como `--accept-data-loss` ou `db push`).
  - `[ ]` Garantir que o container execute estritamente `npx prisma migrate deploy` no bootstrap.
  - `[ ]` Validar execução e idempotência das migrations no novo banco de desenvolvimento.
- `[ ]` **Validação Operacional & Fechamento da Fase 1:**
  - `[ ]` Testar fluxo completo de ponta a ponta (login PIN/biometria, criação de pedido, baixa de estoque, manufatura e insights) em Dev.
  - `[ ]` Validar que o ambiente de Produção permanece 100% íntegro e operacional.
  - `[ ]` Arquivar o histórico da Fase 1 em `docs/HISTORY_ARCHIVE.md` e abrir a Fase 2.

---

## 🔮 Fases Futuras & Backlog

### Fase 2: Expansão Operacional, Automações & Relatórios
- `[ ]` Relatórios de margem de lucro por cookie e custo de matéria-prima (DRE simplificado).
- `[ ]` Melhoria na fluidez do drag-and-drop no Kanban mobile (@dnd-kit).
- `[ ]` Histórico detalhado de compras de insumos e preço médio ponderado.
- `[ ]` Suporte a PWA instalável com service workers.
- `[ ]` Módulo de impressão de pedidos em impressoras térmicas de balcão (58mm/80mm).
