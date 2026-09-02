# Haru Control - Project Context

## 1. Visão Geral: O que é o Haru Control?

O **Haru Control** é o sistema centralizado de gestão operacional, controle de pedidos, estoque em tempo real e manufatura/receitas (BOM) desenvolvido sob medida para a **Haru**, uma loja artesanal de cookies. O sistema gerencia as operações híbridas da loja, atendendo tanto clientes internos no condomínio (pedidos diretos) quanto pedidos originados de plataformas de delivery (iFood).

- **O Problema:** A operação diária de uma confeitaria/loja de cookies exige alta agilidade no atendimento de balcão/WhatsApp/iFood, controle rigoroso do consumo de ingredientes caros (chocolates, manteigas, farinhas) por fornada/receita, rastreabilidade precisa de estoque para evitar rupturas e uma interface mobile-first sem atrito de login individual para os atendentes.
- **O Objetivo:** Proporcionar uma plataforma unificada, rápida e intuitiva para criação/edição de pedidos em formato Kanban (Board), cálculo e baixa automática de insumos por ordem de produção (Manufatura/BOM), controle de estoque contábil baseado em ledger imutável e métricas consolidadas de faturamento e produtos mais vendidos.
- **Público-Alvo / Proposta de Valor:** Equipe de atendimento de balcão, operadores de cozinha/produção e proprietários da Haru Cookies, com foco em simplicidade, velocidade e confiabilidade.

---

## 2. Stack Tecnológica Base

- **Estrutura de Repositório:** Monorepo gerenciado via **Nx (v18.0.4)**
  - `apps/api`: Backend REST API em NestJS
  - `apps/mobile`: Frontend SPA Mobile-First em React + Vite
  - `libs/types`: Tipos, interfaces e DTOs compartilhados
  - `libs/ui`: Componentes visuais reutilizáveis
  - `libs/utils`: Formatadores monetários, datas e cálculo de unidades
- **Frontend:** React 18, Vite 5, Zustand (gerenciamento de rascunhos de pedidos e estado de autenticação), @dnd-kit (drag-and-drop no Kanban), Recharts (gráficos analíticos na tela de Insights), Lucide React / Ícones customizados, CSS Modules e estilos globais mobile-first.
- **Backend:** NestJS 10, TypeScript, RxJS, Class-Validator, Class-Transformer.
- **Banco de Dados & ORM:** PostgreSQL 15, gerenciado via Prisma ORM 5.22.
- **Comunicação & Protocolos:** REST APIs JSON com cliente HTTP Axios.
- **Armazenamento / Storage:** Banco relacional PostgreSQL.
- **Autenticação & Segurança:** Autenticação ágil por **PIN compartilhado** (`PIN_CODE`) com suporte opcional a biometria **WebAuthn** (Passkeys/FIDO2) para login instantâneo no dispositivo móvel.
- **Notificações em Tempo Real:** Integração nativa com a API do **Pushover** para alertas sonoros e notificações push instantâneas a cada novo pedido recebido.

---

## 3. Glossário de Domínio (Termos Canônicos)

Para manter a consistência do código, nomes de variáveis, rotas e banco de dados, utilize **sempre** a nomenclatura oficial do projeto:

- **Insumo / Matéria-Prima (`Product` com `isPurchasable: true`):** Ingrediente comprado (ex: Farinha de Trigo, Gotas de Chocolate Belga, Manteiga) que não é vendido diretamente ao cliente final, mas é consumido nas receitas.
- **Produto Final / Cookie Vendível (`Product` com `isSellable: true`):** Produto acabado destinado à venda (ex: Cookie Tradicional, Cookie Red Velvet, Cookie Nutella). Pode possuir uma Ficha Técnica (BOM) associada.
- **Categoria (`Category`):** Agrupamento organizacional e de precificação de produtos (ex: Cookies Clássicos, Cookies Especiais, Bebidas, Insumos).
- **Receita / Ficha Técnica (BOM - `RecipeItem`):** Estrutura de composição que define a lista e as quantidades exatas de insumos (`childId`) necessários para fabricar uma unidade do produto final (`parentId`).
- **Manufatura / Produção (`Manufacturing`):** Ação de registrar a produção de uma fornada/lote de cookies. Gera lançamento de entrada no estoque do produto acabado (`MANUFACTURING_PRODUCTION`) e baixa automática no estoque de cada ingrediente proporcionalmente à receita (`MANUFACTURING_CONSUMPTION`).
- **Ledger de Estoque (`LedgerEntry`):** Registro contábil imutável de qualquer movimentação física ou lógica de produto. O saldo atual é a soma aritmética de todas as entradas do ledger para aquele produto.
- **Pedido (`Order`):** Pedido de compra contendo itens (`OrderItem`), status do fluxo operacional (`DRAFT`, `PENDING`, `READY`, `COMPLETED`, `CANCELLED`), taxa de entrega (`deliveryFee`), endereço de entrega e dados do cliente (`Customer`).
- **Cliente (`Customer`):** Cadastro do comprador com nome, telefone (WhatsApp), endereço padrão (ex: Bloco/Apartamento no condomínio) e observações de preferências.
- **Taxa de Entrega (`deliveryFee`):** Valor adicional configurado no pedido para cobrir o deslocamento da entrega.
- **Venda (`Sale`):** Registro financeiro consolidado gerado automaticamente no momento em que um pedido atinge o status `COMPLETED`.
- **Termos Não Recomendados / Proibidos:**
  - NÃO use o termo genérico `User` para se referir a clientes do sistema (o termo canônico é `Customer`).
  - NUNCA delete registros da tabela `ledger_entries` diretamente (toda correção deve ser feita via novo `LedgerEntry` do tipo `CORRECTION` ou `STOCK_ADJUSTMENT`).

---

## 4. Mapa de Arquitetura Simplificado

Estrutura das principais pastas e responsabilidades para navegação de agentes:

```text
haru-control/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma                 # Schema oficial do Prisma e enums
│   │   │   └── migrations/                   # Histórico de migrations SQL
│   │   └── src/
│   │       ├── main.ts                       # Bootstrap da API NestJS
│   │       ├── app.module.ts                 # Módulo raiz da aplicação
│   │       └── modules/
│   │           ├── auth/                     # Autenticação por PIN e WebAuthn
│   │           ├── categories/               # CRUD de Categorias
│   │           ├── customers/                # Gestão e histórico de Clientes
│   │           ├── manufacturing/            # Produção de receitas e baixa de insumos
│   │           ├── notifications/            # Integração com API Pushover
│   │           ├── orders/                   # Ciclo de vida e regras de Pedidos
│   │           ├── products/                 # CRUD de Produtos e Receitas (BOM)
│   │           └── stock/                    # Ledger contábil e ajustes de Estoque
│   │
│   └── mobile/
│       └── src/
│           ├── main.tsx                      # Bootstrap React SPA
│           ├── app/App.tsx                   # Roteador principal da aplicação
│           ├── pages/
│           │   ├── PinLogin.tsx              # Tela de Login com PIN e WebAuthn
│           │   ├── OrderBoard.tsx            # Board Kanban de Pedidos
│           │   ├── OrderForm.tsx             # Criação/Edição de Pedidos
│           │   ├── Products.tsx              # Gestão de Produtos e Categorias
│           │   ├── ProductRecipe.tsx         # Ficha Técnica / Receitas (BOM)
│           │   ├── Stock.tsx                 # Gestão e Ajustes de Estoque
│           │   ├── Manufacturing.tsx         # Registro de Fornadas/Produção
│           │   ├── Customers.tsx             # Cadastro e consulta de Clientes
│           │   ├── Insights.tsx              # Dashboard analítico de vendas
│           │   └── Help.tsx                  # Manual interno de uso do sistema
│           ├── store/
│           │   └── useOrderDraft.ts          # Gerenciamento de rascunho de pedidos (Zustand)
│           └── services/
│               └── api.ts                    # Cliente Axios configurado com base URL
│
├── libs/
│   ├── types/                                # Interfaces TypeScript compartilhadas
│   ├── ui/                                   # Componentes de interface compartilhados
│   └── utils/                                # Helpers de conversão, moeda e datas
│
├── Dockerfile.api                            # Container Docker do Backend NestJS
├── Dockerfile.mobile                         # Container Docker do Frontend (Nginx)
├── docker-compose.yml                        # Ambiente local com PostgreSQL
└── nginx.conf                                # Configuração do servidor web Nginx
```

---

## 5. Fases de Desenvolvimento e Features

### 📍 FASE 1: MVP Operacional Estabilizado & Segregação de Ambientes ⏳ (Fase Atual)
_Objetivo: Estabilizar o MVP completo que já opera na prática e segregar formalmente a infraestrutura do Coolify em ambientes isolados de Produção e Desenvolvimento._

- **1.1 Core Operacional do MVP (Concluído):**
  - Autenticação por PIN e suporte biométrico WebAuthn.
  - Gestão de Pedidos em Kanban (`OrderBoard`) com persistência de rascunhos no front (`Zustand`).
  - Controle de Estoque por Ledger Contábil com tolerância a saldo negativo e alertas visuais.
  - Gestão de Insumos, Produtos Finais e Categorias.
  - Ficha Técnica / Receitas (BOM) com conversão de unidades e baixa automática de estoque na Manufatura.
  - Cadastro de Clientes com endereço detalhado para entregas no condomínio.
  - Notificações instantâneas via Pushover.
  - Dashboard analítico de vendas e faturamento (`Insights`).
- **1.2 Segregação de Ambientes & Pipeline de Deploy (Em Andamento):**
  - Promover o container/banco atual do Coolify para o ambiente oficial de **Produção** (com dados reais).
  - Criar branch dedicada/protegida para Produção.
  - Configurar novo ambiente isolado no Coolify para **Desenvolvimento (Dev / Staging)** apontando para a branch `main`.
  - Normalizar o pipeline de migrations do Prisma no `Dockerfile.api`, restaurando `npx prisma migrate deploy` formal sem bypasses provisórios.

---

### 📍 FASE 2: Expansão Operacional, Automações & Relatórios 🔮 (Planejado)
_Objetivo: Aprimorar a experiência de atendimento e enriquecer a inteligência de negócios._

- **2.1 Integrações & Automações:**
  - Exportação de relatórios financeiros e de custos de insumos (DRE simplificado).
  - Aprimoramento do Drag & Drop de pedidos com feedback tátil aprimorado no mobile.
  - Gestão de histórico detalhado de compras de insumos com cálculo de custo médio ponderado.
- **2.2 PWA & Impressão Térmica:**
  - Suporte completo a Progressive Web App (PWA) instalável com service worker.
  - Integração para impressão de comandas de pedidos em impressoras térmicas (58mm/80mm).

---

### 🚫 OUT OF SCOPE (Fora de Escopo - Não propor ou arquitetar por enquanto)
- Sistema multi-tenant ou multi-loja complexo.
- Integração direta via API de parceiro do iFood (pedidos são lançados manualmente pela equipe no board).
- Gateway de pagamento online integrado ao front (pagamentos são confirmados via maquininha/Pix no momento da entrega).

---

## 6. ⚠️ OBRIGAÇÕES DA IA COMO CONSULTORA TÉCNICA (Regras Estritas)

1. **Aprovação Passo a Passo:** Nunca adiantar features ou escrever códigos fora da tarefa atual que não foram explicitamente solicitados.
2. **Decisões Arquiteturais Exigem Consulta:** Sempre que houver uma decisão técnica importante (ex: escolha de bibliotecas pesadas, mudança de modelagem de banco, introdução de novos paradigmas), **PARAR**. Apresentar alternativas, prós e contras, dar recomendação e esperar autorização antes de codificar.
3. **Explicação Obrigatória:** Para cada bloco de código gerado ou alterado, explicar brevemente _o porquê_ daquela abordagem e _como_ o código funciona.
4. **Padrões de Código & UI:** Seguir rigorosamente as convenções de estilo e responsividade definidas para o projeto (Mobile-First, tipagens estritas, separação clara entre estado global e local).
5. **Manutenção Inflexível de Documentação (REGRA DE OURO):** A IA **DEVE OBRIGATORIAMENTE** atualizar os arquivos `HISTORY.md`, `TASKS.md` e `BUGS.md` de forma proativa a **CADA passo significativo** dado no projeto. Criou um novo componente? Resolveu um bug? Alterou lógica de estado? A IA **precisa** ir nos arquivos de log e documentar a mudança imediatamente antes de encerrar seu turno, sem esperar que o usuário peça.
6. **Gestão Inflexível de Bugs (Prioridade Máxima):** Sempre que o usuário reportar um bug, invoque a skill **`report-bug`** para realizar a triagem completa, investigar a causa raiz, criar o registro com ID sequencial em `docs/BUGS.md` (ex: `BUG-001`) e espelhá-lo no topo do `docs/TASKS.md`. Bugs têm prioridade de trabalho absoluta sobre qualquer outra task.
7. **Autorização Explícita para Commits e Deploys:** A IA **NUNCA** deve executar comandos de `git commit` ou `git push` sob nenhuma circunstância sem perguntar e obter a confirmação/autorização clara do usuário antes. Sempre prepare o código, revise, avise que está pronto e aguarde o "ok" do usuário para commitar.

---

## 7. Infraestrutura de Deploy & Variáveis de Ambiente

| Camada | Serviço / Hospedagem | Observações |
| :--- | :--- | :--- |
| **Frontend** | Container Docker (Nginx) no Coolify | Build via Vite, servido estaticamente pelo Nginx |
| **Backend** | Container Docker (Node.js) no Coolify | API NestJS com migrations automáticas via Prisma |
| **Banco de Dados** | PostgreSQL 15 gerenciado via Coolify | Persistência em volume dedicado |
| **Notificações** | Pushover API | Notificações push em tempo real para equipe |

### Variáveis de Ambiente Necessárias

#### Backend (`apps/api/.env`):
- `DATABASE_URL` — Connection string do banco PostgreSQL (ex: `postgresql://user:pass@host:5432/haru_control?schema=public`)
- `PORT` — Porta de escuta da API (padrão: `3000`)
- `PIN_CODE` — Código PIN numérico de acesso operacional (padrão: `1234`)
- `PUSHOVER_USER_KEY` — Chave de usuário do Pushover para recebimento de alertas
- `PUSHOVER_API_TOKEN` — Token da aplicação criada no Pushover

#### Frontend (`apps/mobile/.env`):
- `VITE_API_URL` — URL base para comunicação com a API NestJS (ex: `http://localhost:3000` em dev ou URL pública de prod)
