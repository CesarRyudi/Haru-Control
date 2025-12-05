# Haru Control - Sistema de Pedidos

Sistema de gestão de pedidos com controle de estoque baseado em ledger.

## Tech Stack

- **Monorepo**: Nx
- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: React + Vite + Zustand
- **UI**: @dnd-kit para drag-and-drop

## Estrutura

```
apps/
  api/          - Backend NestJS
  mobile/       - Frontend React
libs/
  types/        - Tipos compartilhados
  ui/           - Componentes UI
  utils/        - Utilitários
```

## Setup

1. Instalar dependências:
```bash
npm install
```

2. Copiar arquivo de ambiente:
```bash
copy .env.example apps\api\.env
```

3. Iniciar PostgreSQL:
```bash
npm run docker:up
```

4. Gerar Prisma Client e rodar migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Iniciar aplicações:
```bash
npm start
```

## Scripts Disponíveis

- `npm start` - Inicia API e Frontend em paralelo
- `npm run build` - Build de produção
- `npm run prisma:generate` - Gera Prisma Client
- `npm run prisma:migrate` - Roda migrations
- `npm run prisma:studio` - Abre Prisma Studio
- `npm run docker:up` - Inicia PostgreSQL
- `npm run docker:down` - Para PostgreSQL

## Acesso

- Frontend: http://localhost:4200
- API: http://localhost:3000
- PIN padrão: 1234
