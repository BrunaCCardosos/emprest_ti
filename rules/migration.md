# Migrations

> Leitor: agente.

## Quando

Ao alterar o schema do Prisma, migrations, policies, triggers ou scripts que escrevem no banco.

- Antes de gerar a migration ou editar o schema, apresente o DDL proposto, incluindo o efeito sobre RLS e as policies aplicáveis. Pare e aguarde aprovação para a proposta.
- Depois da aprovação, registre a mudança em uma nova migration versionada do Prisma. Preserve migrations já aplicadas.
- Revise o SQL e aponte o impacto sobre dados, RLS, isolamento por tenant e compatibilidade com a aplicação.
- Valide em um banco local ou descartável cujo destino foi conferido. Registre o resultado e qualquer etapa necessária para recuperar os dados.
- A aplicação fora do ambiente local cabe ao operador, pelo fluxo de CI previsto em `restrictions.md`.
