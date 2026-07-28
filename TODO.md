# Lista de Tarefas / Anotações

## Pendências Técnicas
- [x] **Banco de Dados / Migrations**: Na próxima vez que uma migration oficial for gerada, é necessário:
  1. Gerar o arquivo de migration corretamente usando `npx prisma migrate dev`.
  2. Remover a flag `--accept-data-loss` e voltar o comando para `npx prisma migrate deploy` no arquivo `Dockerfile.api`. A flag `--accept-data-loss` foi usada provisoriamente com o comando `db push` para aplicar a adição de Categorias no ambiente de desenvolvimento no Coolify sem perda de dados imediata. No entanto, para evitar problemas em produção futuros, devemos voltar ao fluxo padrão de migrations.
