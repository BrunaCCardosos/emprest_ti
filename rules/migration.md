# Migrations

## Quando

Ao alterar o schema do Prisma, migrations, policies, triggers ou scripts que escrevem no banco.

- Registre mudanças de schema em uma nova migration versionada. Preserve migrations já aplicadas.
- Revise o SQL e aponte o impacto sobre dados, RLS, isolamento por tenant e compatibilidade com a aplicação.
- Valide em um banco local ou descartável cujo destino foi conferido. Registre o resultado e qualquer etapa necessária para recuperar os dados.
- Antes de aplicar uma mudança em banco remoto, apresente o SQL, o destino e o impacto. A execução segue a autorização definida em `rules/operacao.md` e o fluxo de CI previsto em `restrictions.md`.
