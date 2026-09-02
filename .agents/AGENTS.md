# Regras Globais do Workspace Haru Control

As seguintes regras são restrições comportamentais e devem ser obedecidas rigorosamente por todos os agentes em todos os turnos de trabalho neste projeto:

1. **MANUTENÇÃO INFLEXÍVEL DE DOCUMENTAÇÃO (REGRA DE OURO)**:
   - Você **NUNCA** deve concluir uma tarefa, resolver um bug ou finalizar uma sessão de código sem atualizar os arquivos de documentação (`docs/HISTORY.md` e `docs/TASKS.md`).
   - A atualização deve ser **proativa** e realizada a cada passo significativo (ex: novo componente criado, endpoint integrado, bug corrigido). Não espere o usuário solicitar a documentação.
   - **MANTENHA O PADRÃO:** Antes de editar a documentação, consulte `HARU_CONTROL_INDEX.md`, `docs/HISTORY.md` e `docs/TASKS.md` para seguir rigorosamente o estilo, formato de checklist (`[x]`, `[/]`, `[ ]`) e linguagem do projeto.
   - **LIMPEZA CONTÍNUA DE HISTÓRICO (TOKEN DIET):** Ao concluir uma Fase do projeto, você DEVE proativamente mover todo o log de `docs/HISTORY.md` correspondente à fase encerrada para `docs/HISTORY_ARCHIVE.md`. O `docs/HISTORY.md` deve conter estritamente a fase atual (ativa), mantendo o consumo de tokens hiper-eficiente.

2. **GESTÃO INFLEXÍVEL DE BUGS (PRIORIDADE MÁXIMA)**:
   - Sempre que o usuário reportar um erro, bug ou comportamento anômalo, invoque a skill **`report-bug`** para realizar a triagem técnica completa, gerar o ID único (`BUG-XXX`) em `docs/BUGS.md` e espelhar o item no topo de `docs/TASKS.md`.
   - Bugs têm prioridade absoluta de resolução sobre qualquer tarefa planejada ou nova feature.

3. **AUTORIZAÇÃO EXPLÍCITA PARA COMMITS & DEPLOYS**:
   - Você **NUNCA** deve executar comandos de `git commit` ou `git push` sem obter autorização prévia, clara e explícita do usuário para aquele commit específico.
   - Sempre prepare o código, revise as alterações, avise que está pronto, sugira a mensagem de commit e aguarde o "ok" do usuário.

4. **LEITURA DE CONTEXTO E PADRÕES**:
   - Em caso de dúvida sobre o estado do projeto, a arquitetura ou o que fazer em seguida, consulte o arquivo `HARU_CONTROL_INDEX.md` na raiz do projeto. Ele é o mapa principal que conecta a documentação e o código.
