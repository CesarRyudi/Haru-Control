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

---
