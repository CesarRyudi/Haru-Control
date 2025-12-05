# Sistema de Pedidos — Especificação Completa

## 1. Objetivo
Este documento descreve toda a lógica, arquitetura, entidades, fluxo de dados e comportamento do sistema de pedidos. Ele será usado pelo GitHub Copilot para guiar o desenvolvimento.

---

## 2. Regras Gerais
- **Mobile First**: todas as telas devem ser pensadas inicialmente para uso mobile.
- **Sem autenticação real**: todos acessam com o mesmo PIN.
- **Sem filas inicialmente**.
- **Estado de rascunho apenas no front-end**, mantido em memória. Se sair da tela, os valores permanecem; se der refresh, podem ser apagados.
- **Estoque pode ficar negativo**, mas sempre gera aviso.
- **Concluir pedido = venda**. O cancelamento só pode ocorrer antes de concluir.
- **Produtos podem ser alterados a qualquer momento**.
- **Pedidos concluídos devem, por padrão**, mostrar somente pedidos do dia, com filtros ajustáveis.

---

## 3. Telas do Sistema

### 3.1 Tela de Login PIN
- Campo para digitar o PIN.
- Se correto, redireciona para o board de pedidos.

### 3.2 Board de Pedidos
- Lista pedidos divididos em colunas: **Rascunho**, **Em Produção**, **Pronto**, **Concluídos**.
- Arrastar/soltar (opcional) ou botões de mover entre etapas.
- A coluna "Concluídos" exibe **somente pedidos do dia**, com filtros para alterar o período.

### 3.3 Criar/Editar Pedido
- Lista de produtos com quantidade.
- Estado mantido no front apenas.
- Ao salvar/criar:
  - Sempre **reservar** estoque.
  - Se estoque insuficiente: exibir alerta, mas permitir continuar.
- Permite cancelar antes da conclusão.

### 3.4 Tela de Produtos
- CRUD simples de produtos.
- Alterações refletem imediatamente em novos pedidos.

---

## 4. Fluxo de Pedido

### 4.1 Criação
1. Usuário monta o pedido.
2. Sistema calcula estoque necessário.
3. Reserva estoque automaticamente.
4. Se negativo, alerta mas não bloqueia.
5. Pedido entra como **Rascunho** ou já vai para **Em Produção**, dependendo da ação do usuário.

### 4.2 Produção → Pronto
Fluxo manual via botões ou drag and drop.

### 4.3 Concluir
- Ao concluir:
  - Pedido vira **venda fechada**.
  - Estoques já estão reservados, então nada adicional ocorre.

### 4.4 Cancelamento
- Só permitido antes de concluir.
- Ao cancelar:
  - Estoque reservado é devolvido.

---

## 5. Modelagem do Banco
Modelo SQL relacional simples.

### 5.1 Tabela `products`
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | uuid | chave primária |
| name | varchar | nome do produto |
| stock | int | quantidade em estoque atual (pode ficar negativo) |
| price | decimal | valor unitário |
| created_at | timestamp |
| updated_at | timestamp |

### 5.2 Tabela `orders`
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | uuid | chave primária |
| status | enum(rascunho, producao, pronto, concluido, cancelado) |
| total_price | decimal | calculado com base nos itens |
| created_at | timestamp |
| updated_at | timestamp |

### 5.3 Tabela `order_items`
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | uuid | chave primária |
| order_id | uuid | referência à tabela orders |
| product_id | uuid | referência à tabela products |
| quantity | int | quantidade pedida |
| unit_price | decimal | preço do produto no momento |

---

## 6. Lógica de Estoque
- Quando um pedido é criado ou editado:
  - O sistema recalcula o estoque reservado.
- Fórmula:
  - **stock = stock - quantity_reservada**.
- Se o resultado < 0 → emitir aviso.
- Se o pedido for cancelado antes de concluir:
  - **stock = stock + quantidade_reservada**.

---

## 7. Arquitetura Geral

### 7.1 Back-end
- Node/NestJS
- Controle de pedidos, produtos e estoque.
- Endpoints REST:
  - POST /orders
  - PATCH /orders/:id
  - POST /orders/:id/advance
  - POST /orders/:id/cancel
  - GET /orders?from=X&to=Y
  - CRUD products

### 7.2 Front-end
- React (mobile first)
- Estado de rascunho mantido no cliente.
- Sincronização mínima com servidor.

### 7.3 Monorepo
- Nx
- Apps: `mobile`, `api`
- Libs: `ui`, `types`, `utils`

---

## 8. Fluxo Resumido (para Copilot)
1. Usuário acessa via PIN.
2. Visualiza board com etapas.
3. Cria pedido (estado local até salvar).
4. Ao salvar, backend:
   - cria pedido
   - reserva estoque
5. Usuário move entre etapas.
6. Ao concluir, backend marca como venda.
7. Filtro de concluídos mostra só o dia atual por padrão.

---

## 9. Futuro: Estrutura com Filas (opcional)
- Cada ação de pedido gera evento.
- Workers atualizam estoque.
- Board assina eventos em tempo real.
- Mantém arquitetura reativa e escalável.

---

## 10. Observações Finais
- Documento serve como contrato para desenvolvimento.
- Todos os comportamentos citados devem ser respeitados no código.


## Estrutura de Dados (Interfaces/DTOs)
### Product
```ts
interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  createdAt: Date;
}
```
### Customer
```ts
interface Customer {
  id: string;
  name: string;
  contact?: string;
  createdAt: Date;
}
```
### Order
```ts
interface Order {
  id: string;
  customerId?: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```
### OrderItem
```ts
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
}
```
### Sale
```ts
interface Sale {
  id: string;
  orderId: string;
  createdAt: Date;
}
```
### LedgerEntry
```ts
interface LedgerEntry {
  id: string;
  productId: string;
  quantity: number;
  type: LedgerOperationType;
  orderId?: string;
  createdAt: Date;
}
```
### LedgerOperationType
```ts
enum LedgerOperationType {
  STOCK_IN = 'stock_in',
  STOCK_ADJUSTMENT = 'stock_adjustment',
  RESERVE = 'reserve',
  RELEASE = 'release',
  SALE = 'sale',
  CORRECTION = 'correction'
}
```

## Endpoints da API
### Orders
```
POST /orders
PATCH /orders/:id
POST /orders/:id/complete
POST /orders/:id/cancel
GET /orders?status=pending
GET /orders/completed?date=YYYY-MM-DD
```
### Stock
```
POST /stock/in
POST /stock/adjust
GET /stock/snapshot
```

## Fluxo Detalhado do Ledger
### Exemplo Completo
1. Inserção de estoque inicial:
```
+10 X (stock_in)
+5 Y (stock_in)
```
2. Pedido P1 criado com 2x X e 1x Y:
```
-2 X (reserve, order=P1)
-1 Y (reserve, order=P1)
```
3. Edição do pedido P1: X de 2 → 3:
```
-1 X (reserve, order=P1)
```
4. Conclusão do pedido P1:
```
+3 X (release_reserve)
+1 Y (release_reserve)
-3 X (sale)
-1 Y (sale)
```

## Estrutura Sugerida de Pastas
```
/backend
  /src
    /modules
      /products
      /orders
      /stock
      /sales
    /database
    /common
/frontend
  /src
    /screens
      /order-entry
      /pending-orders
      /completed-orders
      /stock
    /components
    /services
    /store
```

## Estado do Frontend
O rascunho do pedido será mantido exclusivamente no frontend usando Zustand:
```
/store/useOrderDraft.ts
```
Esse estado persiste apenas enquanto o app está aberto (não salva no backend).

