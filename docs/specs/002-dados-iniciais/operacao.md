# Publicação dos dados iniciais

As etapas de escrita em produção são executadas pela operadora. A preparação e os testes da prática usam o PostgreSQL do Docker e os JPEGs aprovados.

## Preparar a implantação

1. Integrar a branch revisada na `main`. Na Vercel, selecionar o framework Next.js e configurar as variáveis descritas em [.env.example](../../../.env.example). Usar `DATABASE_URL` com o pooler de transações na porta 6543 e os parâmetros do ADR. Configurar as credenciais de migração somente no ambiente `production` do GitHub Actions.
2. Disparar manualmente o workflow **Aplicar migrations Prisma** na `main` e confirmar que as migrations foram aplicadas.
3. No SQL Editor do projeto Supabase de entrega, executar [a carga dos equipamentos](../../../prisma/seed-equipments.sql). Repetir e conferir que os 12 patrimônios aparecem como já conferidos. Uma divergência pede revisão do registro existente.

## Fotos

1. Em Storage, criar o bucket público `equipment-photos` e a pasta `suporte_ti`. Usar um bucket com o mesmo nome configurado na Vercel.
2. Enviar os 12 JPEGs aprovados para a pasta, seguindo os nomes do [manifesto](manifesto-fotos.json). Ao repetir, conferir a URL e o conteúdo dos objetos existentes e preservá-los. Registrar divergências por caminho para revisão da operadora.
3. Abrir as 12 URLs públicas em uma janela anônima. O formato é `https://<projeto>.supabase.co/storage/v1/object/public/equipment-photos/suporte_ti/TI-0001.jpg`. Registrar a verificação com os IDs ou caminhos, sem dados de sessão.

## Conta do professor

1. Em Authentication → Users, criar a conta indicada na spec com a credencial informada pela turma, fora do repositório. Se a conta já existir, conferir a identidade antes de prosseguir.
2. Executar [o vínculo do professor](../../../prisma/link-teacher.sql) no SQL Editor do mesmo projeto. O script usa a identidade existente, preserva um perfil compatível e aborta se houver conflito de identidade, papel ou empréstimos existentes.
3. Conferir o login no link da Vercel, os 12 equipamentos e a lista vazia de empréstimos. Sair da conta antes de testar solicitações. Provisionar contas próprias de teste com papel de colaborador e usar somente essas contas para pedidos.

## Evidências

Registrar quem executou as etapas, o commit implantado, o URL da Vercel, o resultado da carga repetida, os 12 caminhos públicos e a conferência da conta do professor. Guardar o resultado de uma solicitação com a conta de teste e o resultado dos dois verificadores.
