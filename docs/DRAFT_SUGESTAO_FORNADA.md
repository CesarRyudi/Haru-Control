# 🍪 Rascunho de Especificação: Previsão de Demanda e Sugestão de Fornada Multi-Dias

> **Status:** Rascunho / Planejado (Não implementado)  
> **Data:** 2026-09-22  
> **Módulo:** Planejamento de Produção & Estoque (`apps/api` e `apps/mobile`)  
> **Origem da Demanda:** Otimização do fluxo da cozinha e fornadas da Haru Cookies.

---

## 🎯 1. Visão Geral & Objetivo

Diferente de um cálculo estático diário, a rotina da Haru Cookies frequentemente envolve assar lotes de cookies que atendam ao consumo de **múltiplos dias consecutivos** (ex: na segunda-feira assa-se o volume necessário para cobrir **segunda, terça e quarta-feira**).

O objetivo deste módulo é permitir que o confeiteiro selecione **até que data** pretende cobrir o estoque de cookies. O sistema calcula a previsão de demanda acumulada somando os padrões históricos de cada dia do período selecionado, deduz o estoque atual de cookies prontos e sugere a quantidade líquida exata a ser assada.

---

## 🧮 2. Modelo Matemático & Lógica de Cálculo

### 2.1. Intervalo de Planejamento (Horizonte Temporal)
* **Data Inicial ($D_{\text{início}}$):** Hoje (momento atual).
* **Data Alvo ($D_{\text{alvo}}$):** Data final informada pelo operador (ex: quarta-feira às 23:59).
* O período abrange uma lista de dias: $\mathcal{D} = \{ d_1, d_2, \dots, d_n \}$, onde cada $d_i$ corresponde a um dia específico da semana (segunda, terça, etc.).

### 2.2. Previsão por Dia da Semana ($\hat{V}_{p, d}$)
Para cada produto $p$ e para cada dia $d$ no intervalo:
* Busca o histórico de vendas concluídas daquele dia da semana nas últimas $K$ semanas (padrão: $K = 4$ semanas anteriores).
* Aplica média móvel ponderada com pesos decrescentes (dando peso maior para as semanas mais recentes, capturando tendências imediatas):
  $$\hat{V}_{p, d} = \frac{\sum_{w=1}^{K} w \cdot V_{p, d, w}}{\sum_{w=1}^{K} w}$$
  *(Onde $w=4$ é a semana mais recente e $w=1$ é a de 4 semanas atrás).*

### 2.3. Demanda Acumulada no Período ($D_{\text{total}}$)
Soma-se a demanda prevista de todos os dias do período selecionado, aplicando uma margem de segurança configurável (padrão: 10% ou buffer mínimo de 1 a 2 unidades para dias de pico):
$$D_{\text{total}}(p) = \sum_{d \in \mathcal{D}} \hat{V}_{p, d} \times (1 + \text{Margem})$$

### 2.4. Necessidade Líquida de Produção ($N_{\text{líquida}}$)
Dedução direta do saldo de cookies já assados e disponíveis no estoque físico:
$$N_{\text{líquida}}(p) = \max\left(0, \lceil D_{\text{total}}(p) \rceil - \text{EstoqueAtual}(p)\right)$$

### 2.5. Ajuste de Lote / Assadeira (Batch Size)
* Se o produto tiver tamanho de assadeira cadastrado (ex: 6 ou 8 unidades por bandeja), o sistema calcula o número ideal de assadeiras e sugere o valor arredondado para cima:
  $$\text{FornadaSugerida}(p) = \lceil N_{\text{líquida}}(p) / \text{BatchSize} \rceil \times \text{BatchSize}$$

### 2.6. Alerta de Shelf Life (Validade do Cookie)
* Se $(D_{\text{alvo}} - D_{\text{início}})$ exceder a validade máxima recomendada do cookie fresco (ex: 4 dias), o sistema exibe um aviso preventivo:
  > *"⚠️ Atenção: A data alvo ultrapassa o prazo ideal de frescor (4 dias). Risco de descarte por validade."*

---

## 📊 3. Exemplo Prático de Simulação

**Cenário:** O confeiteiro abre o app na **Segunda-feira de manhã** e seleciona que deseja cobrir o estoque **até Quarta-feira** (3 dias).

| Produto | Estoque Atual | Seg (Prev) | Ter (Prev) | Qua (Prev) | Total Previsto (+10%) | **Sugestão Líquida** | Lote Assadeira (6 un) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Clássico Choc** | 6 un | 8 un | 7 un | 12 un | 30 un | **Assar 24 un** | 4 bandejas |
| **Nutella** | 8 un | 6 un | 5 un | 9 un | 22 un | **Assar 14 un** | 2 ou 3 bandejas (18 un) |
| **Red Velvet** | 2 un | 4 un | 3 un | 6 un | 15 un | **Assar 13 un** | 2 bandejas (12 un) |

---

## 📱 4. Arquitetura de Interface & Experiência de Uso (UX)

### 4.1. Localização no App
* **Local:** Card inteligente retrátil ou aba no topo da tela de Estoque ([Stock.tsx](file:///c:/Users/cesar/Projetos/Haru-Control/apps/mobile/src/pages/Stock.tsx)).
* **Título do Painel:** `🍪 Sugestão de Fornada & Planejamento`

### 4.2. Seletor de Período / Horizonte
* Campo de data interativo acompanhado de chips de atalho rápido para 1 toque:
  * `Hoje (1 dia)`
  * `Até Amanhã (2 dias)`
  * `Até Quarta (3 dias)`
  * `Fim de Semana (Sex a Dom)`
  * `Data Personalizada...` (abre `<input type="date">`)

### 4.3. Card de Cada Produto Sugerido
* **Nome do Cookie** e subcategoria.
* **Badge de Necessidade:** Ex: `Assar 24 un` (com destaque visual em verde/laranja).
* **Discriminativo ao Expandir (Accordion):**
  * Estoque Atual: `6 un`
  * Demanda Seg (`8`) + Ter (`7`) + Qua (`12`) = `27 un` (+ 10% = `30 un`).
  * Necessidade: `30 - 6 = 24 un`.
* **Checagem de Ficha Técnica (BOM):**
  * `✅ Massa suficiente em estoque` (ou `⚠️ Massa para apenas 12 un`).

### 4.4. Ação Rápida de Entrada no Estoque
* Botão `🔥 Fornar Sugestão` (por produto individual ou botão geral `🔥 Fornar Tudo`).
* Ao clicar, abre o modal de entrada de estoque já com as quantidades sugeridas pré-preenchidas, permitindo ajuste fino antes de confirmar.
* A confirmação realiza o lançamento no Ledger Contábil (`LedgerOperationType.IN`).

---

## 🛠️ 5. Plano de Implementação Técnica (Para Quando For Executar)

1. **Backend NestJS (`apps/api`):**
   * Endpoint: `GET /stock/baking-suggestion?targetDate=YYYY-MM-DD&safetyMargin=0.10`
   * Serviço `BakingSuggestionService` (ou método em `StockService` / `OrdersService`):
     * Query no Prisma buscando vendas agrupadas por `productId` e `EXTRACT(DOW FROM completed_at)` das últimas 4 semanas.
     * Cruzamento com estoque atual (`LedgerEntry`) e Fichas Técnicas (`ProductRecipe`).
2. **Tipos Compartilhados (`libs/types`):**
   * Interface `BakingSuggestionItem` (`productId`, `productName`, `currentStock`, `dailyForecast`, `totalForecast`, `suggestedQuantity`, `batchSize`, `hasSufficientIngredients`).
   * DTO `BakingSuggestionQueryDto` (`targetDate`, `safetyMargin`).
3. **Frontend Mobile (`apps/mobile`):**
   * Componente `BakingSuggestionCard.tsx` integrado em `Stock.tsx`.
   * Hook de consulta reativa com feedback de loading e atalhos rápidos de período.
4. **Testes Automatizados (Playwright):**
   * Teste E2E validando a troca de datas no seletor de horizonte e o pré-preenchimento da fornada no estoque.
