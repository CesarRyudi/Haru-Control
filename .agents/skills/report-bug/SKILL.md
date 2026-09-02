---
name: report-bug
description: Registra um novo bug reportado pelo usuário em docs/BUGS.md (gerando ID único como BUG-XXX) e cria uma tarefa prioritária no topo de docs/TASKS.md. Realiza a triagem completa, investigando sintomas, arquivos afetados, causa raiz e prevenção de problemas futuros.
---

# Haru Control Bug Reporting & Triage Skill

Esta skill padroniza e automatiza a triagem, investigação preliminar e registro canônico de qualquer bug reportado pelo usuário no projeto **Haru Control**, garantindo prioridade máxima de trabalho e análise de causa raiz.

Execute o fluxo abaixo rigorosamente quando esta skill for invocada ou quando o usuário reportar um novo problema/bug:

## Instruções Passo a Passo

### 1. Ler os Arquivos de Controle de Bugs
- Execute a ferramenta `view_file` para ler `docs/BUGS.md` e `docs/TASKS.md`.
- Analise a tabela **"📌 Índice de Bugs"** em `docs/BUGS.md` para determinar o **próximo ID sequencial** disponível (ex: se o último registrado for `BUG-002`, o próximo será `BUG-003`; se apenas o exemplo `BUG-000` existir, inicie em `BUG-001`).

### 2. Triagem e Investigação Preliminar do Código
- Com base na descrição do usuário, identifique:
  - **Sintomas e Comportamento Observado:** O que deu errado, passos para reproduzir e comportamento esperado.
  - **Severidade:**
    - `🔴 Alta (Bloqueante/Crash/Perda de Dados)`
    - `🟡 Média (Funcionalidade Degrada/Workaround Existe)`
    - `🟢 Baixa (UI/Cosmético/Pequeno Ajuste)`
- **Investigação Ativa:** Se o usuário reportou apenas o sintoma, use ferramentas como `grep_search` e `view_file` nos arquivos do projeto para mapear rapidamente os **Componentes / Arquivos Afetados** e formular uma hipótese inicial de **Onde está o problema** e **Como foi introduzido (Causa Raiz)**.

### 3. Registrar o Bug em `docs/BUGS.md`
- Atualize `docs/BUGS.md`:
  1. **Tabela de Índice:** Insira uma nova linha no final da tabela "📌 Índice de Bugs" com o status `[ ] Aberto` e validação `⏳ Pendente`:
     ```markdown
     | BUG-XXX | `[ ]` Aberto | `⏳ Pendente` | [Severidade] | [Título Curto] | [Componente Afetado] | YYYY-MM-DD |
     ```
  2. **Registro Detalhado:** Adicione o novo bloco de documentação no final da seção "🔍 Registro Detalhado de Bugs" (acima da linha horizontal final ou após o último bug registrado), seguindo exatamente o modelo abaixo:
     ```markdown
     ### [BUG-XXX] Título Descritivo do Bug
     - **Status:** `[ ]` Aberto
     - **Validação Prática:** `[ ]` Pendente de Validação
     - **Severidade:** `🔴 Alta` | `🟡 Média` | `🟢 Baixa`
     - **Data de Registro:** YYYY-MM-DD
     - **Data de Implementação:** N/A
     - **Data de Validação:** N/A
     - **Componentes / Arquivos Afetados:** `caminho/do/arquivo.ext`

     #### 1. O que acontece (Sintomas & Comportamento Observado)
     - [Explicação detalhada dos sintomas]
     - **Passos para Reproduzir:**
       1. [Passo 1]
       2. [Passo 2]
     - **Comportamento Esperado:** [O que deveria acontecer]
     - **Logs / Erros de Console:** [Mensagens ou "Nenhum erro de console reportado/observado"]

     #### 2. Onde está o problema (Localização Técnica)
     - [Análise preliminar de qual componente, hook, endpoint ou serviço está causando o erro]

     #### 3. Como foi introduzido (Causa Raiz & Contexto Histórico)
     - [Análise da causa raiz provável com base na arquitetura, concorrência, refatorações anteriores ou ausência de fallbacks/tratamento de estado]

     #### 4. Como foi resolvido (Solução Aplicada)
     - *(Pendente de resolução — em análise/investigação)*

     #### 5. Lições Aprendidas & Prevenção Futura
     - [Esboço de diretrizes de prevenção arquitetural e melhorias nos padrões do código para evitar falhas similares]
     ```

### 4. Espelhar na Lista de Prioridades em `docs/TASKS.md`
- Atualize `docs/TASKS.md` para adicionar o bug logo abaixo do cabeçalho da seção `## 🐛 Bugs Prioritários (BUGS.md)`:
  ```markdown
  - `[ ]` **[BUG-XXX]** Título Curto do Bug — *[Breve resumo do problema]*
  ```
- *(Nota: Se o placeholder `*(Nenhum bug aberto no momento)*` estiver presente, remova-o).*

### 5. Ciclo de Vida: Implementação vs Validação Prática
- **Ao Finalizar a Correção no Código:**
  - Atualize `BUGS.md`: **Status: `[x] Implementado`**, **Validação: `⏳ Pendente`**, preencha `Data de Implementação: YYYY-MM-DD` e descreva a solução.
  - Atualize `TASKS.md`: `- [ ] **[BUG-XXX]** Título — *[🟡 Implementado: resumo da solução — ⏳ Aguardando Validação Prática]*`
  - **NÃO MARQUE COMO TOTALMENTE CONCLUÍDO AINDA.** Peça para o usuário testar e validar no ambiente real.
- **Após Confirmação Positiva do Usuário:**
  - Atualize `BUGS.md`: **Validação: `✅ Validado`**, **Status: `[x] Resolvido`**, preencha `Data de Validação: YYYY-MM-DD`.
  - Atualize `TASKS.md`: `- [x] **[BUG-XXX]** Título — *[✅ Concluído & Validado: resumo]*`.
- **Se o Teste Falhar / Regredir:**
  - Atualize `BUGS.md`: **Validação: `❌ Falhou / Regressão`**.
  - Reabra imediatamente a investigação técnica para ajustar a correção.

### 6. Apresentação e Confirmação
- Apresente ao usuário um resumo claro contendo:
  - O **ID criado (`BUG-XXX`)** e seu **Título**.
  - O diagnóstico preliminar elaborado durante a triagem (arquivos afetados e causa raiz provável).
  - Confirmação de que os arquivos `BUGS.md` e `TASKS.md` foram atualizados.
- **Ação Imediata:** Como bugs têm prioridade máxima de trabalho no projeto, encerre sua resposta perguntando ao usuário:
  > *"O registro de `[BUG-XXX]` está concluído. Como bugs têm prioridade máxima absoluta no projeto, deseja que eu inicie a correção agora mesmo?"*
