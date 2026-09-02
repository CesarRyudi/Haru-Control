---
name: haru-control-init
description: Inicializa o contexto do projeto Haru Control. Verifica o git status, faz checkout/pull se necessário, lê o HARU_CONTROL_INDEX.md e resume onde o desenvolvimento parou.
---

# Haru Control Initialization Skill

Esta skill automatiza o processo de preparação para iniciar uma conversa de desenvolvimento no projeto **Haru Control**.
Execute as instruções abaixo quando o usuário invocar esta skill ou pedir para inicializar/retomar o projeto:

## Instruções Passo a Passo

1. **Verificar Status e Atualizar Repositório:**
   - Execute o comando `git status` no diretório raiz do projeto para verificar a situação atual.
   - Com base na saída do `git status`:
     - Se o branch atual não for o principal (`main` ou `master`) e a working tree estiver limpa, execute `git checkout main` (ou `master`).
     - Se houver mudanças não salvas que impeçam o checkout, avise o usuário e pergunte como proceder antes de continuar.
     - Uma vez no branch principal (ou se já estiver nele), execute `git pull` para garantir que as atualizações mais recentes do remoto sejam baixadas.

2. **Ler o HARU_CONTROL_INDEX.md:**
   - Use a ferramenta `view_file` para ler todo o conteúdo do arquivo `HARU_CONTROL_INDEX.md` localizado na raiz do projeto.
   - Siga as instruções do index para carregar `docs/PROJECT_CONTEXT.md` se precisar se aprofundar na arquitetura e glossário.

3. **Verificar as Últimas Alterações & Estado Atual:**
   - Leia `docs/HISTORY.md` (para ver o último log da fase ativa) e `docs/TASKS.md` (para ver o checklist de tarefas e bugs prioritários).
   - Execute `git log -n 3 --oneline` no diretório do projeto para verificar as últimas alterações registradas no repositório.

4. **Gerar um Resumo Executivo para o Usuário:**
   - Apresente ao usuário um **resumo conciso** de:
     1. **Onde o projeto parou:** Qual é a fase atual, se há bugs prioritários abertos em `docs/TASKS.md` ou qual tarefa está em andamento `[/]`.
     2. **Últimas alterações:** O que foi feito na última sessão (baseado em `docs/HISTORY.md` e git log).
     3. **Próximo passo sugerido:** Qual é a ação imediata recomendada para esta sessão.
