# Setup do Projeto Haru Control

## Passo a Passo para Iniciar

### 1. Instalar Dependências
```powershell
cd "c:\Users\Cesar\Desktop\Projetos\Haru Control"
npm install
```

### 2. Iniciar o Banco de Dados PostgreSQL
```powershell
npm run docker:up
```

### 3. Gerar Prisma Client
```powershell
npm run prisma:generate
```

### 4. Executar Migrations
```powershell
npm run prisma:migrate
```
- Quando solicitado o nome da migration, digite: `init`

### 5. Iniciar as Aplicações
```powershell
npm start
```

Isso iniciará:
- API (Backend): http://localhost:3000
- Mobile (Frontend): http://localhost:4200

## Comandos Úteis

### Visualizar Banco de Dados
```powershell
npm run prisma:studio
```
Abre interface gráfica em http://localhost:5555

### Parar o PostgreSQL
```powershell
npm run docker:down
```

### Build de Produção
```powershell
npm run build
```

## Estrutura Criada

```
haru-control/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Schema do banco
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/       # Autenticação PIN
│   │       │   ├── products/   # CRUD Produtos
│   │       │   ├── orders/     # Gestão de Pedidos
│   │       │   └── stock/      # Controle de Estoque (Ledger)
│   │       ├── prisma/         # Serviço Prisma
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   └── mobile/                 # Frontend React
│       └── src/
│           ├── pages/
│           │   ├── PinLogin.tsx      # Tela de Login
│           │   ├── OrderBoard.tsx    # Board de Pedidos
│           │   ├── OrderForm.tsx     # Criar/Editar Pedido
│           │   ├── Products.tsx      # CRUD Produtos
│           │   └── Stock.tsx         # Gerenciar Estoque
│           ├── store/
│           │   └── useOrderDraft.ts  # Estado Zustand
│           ├── services/
│           │   └── api.ts            # Cliente Axios
│           └── app/
│               └── App.tsx           # Rotas
│
├── libs/
│   ├── types/      # Tipos compartilhados
│   ├── utils/      # Utilitários (formatação)
│   └── ui/         # Componentes UI (futuramente)
│
├── docker-compose.yml   # PostgreSQL
├── package.json
├── nx.json
└── tsconfig.base.json

```

## Funcionalidades Implementadas

### Backend (API)
✅ Autenticação via PIN (env: PIN_CODE=1234)
✅ CRUD completo de Produtos
✅ Sistema de Pedidos com status (DRAFT → PENDING → READY → COMPLETED)
✅ Sistema de Estoque baseado em Ledger
✅ Reserva automática de estoque ao criar/editar pedido
✅ Liberação de estoque ao cancelar pedido
✅ Conversão de pedido em venda ao concluir
✅ Avisos quando estoque fica negativo (mas permite continuar)
✅ Filtro de pedidos concluídos por data

### Frontend (Mobile)
✅ Tela de login com PIN
✅ Board de pedidos com 4 colunas
✅ Criação e edição de pedidos (estado mantido no Zustand)
✅ CRUD de produtos
✅ Visualização e ajuste de estoque
✅ Interface mobile-first responsiva
✅ Avisos visuais para estoque negativo

## Próximos Passos Opcionais

1. **Drag & Drop no Board**: Implementar com @dnd-kit
2. **Testes**: Adicionar testes unitários e E2E
3. **Melhorias de UI**: Biblioteca de componentes (libs/ui)
4. **Clientes**: Adicionar CRUD de clientes
5. **Relatórios**: Dashboard com vendas e estatísticas
6. **PWA**: Transformar em Progressive Web App
7. **Notificações**: Sistema de notificações em tempo real
8. **Backup**: Sistema de backup automático do banco

## Troubleshooting

### Erro de conexão com o banco
- Verifique se o Docker está rodando: `docker ps`
- Reinicie o container: `npm run docker:down` e `npm run docker:up`

### Erro ao gerar Prisma Client
- Delete `node_modules` e `package-lock.json`
- Reinstale: `npm install`
- Tente novamente: `npm run prisma:generate`

### Porta já em uso
- API (3000): Mude PORT no arquivo `.env`
- Frontend (4200): Mude port em `apps/mobile/vite.config.ts`
