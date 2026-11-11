# EmpresTI

## Prática SDD

O monolito Next.js serve as telas do EmpresTI e a API tRPC. O protótipo estático continua disponível em `index.html` para os testes de demonstração.

- Instale as dependências com `npm ci` e configure as variáveis de um ambiente isolado conforme [.env.example](.env.example).
- Inicie o PostgreSQL local com `docker compose up -d postgres`. Com as URLs apontando para esse banco na porta 5433, rode `npm run db:migrate` e siga a seção de carga no [procedimento do operador](docs/specs/002-dados-iniciais/operacao.md).
- Rode `npm run dev` para iniciar a aplicação. O login requer um usuário no Supabase Auth e um vínculo de colaborador com o tenant.
- Rode `npm test` para o protótipo e `npm run test:database` para as suítes do Docker. O [roteiro das fotos](docs/specs/002-dados-iniciais/revisao-fotos.md) traz a verificação dos JPEGs e das URLs.

A evidência e as etapas pendentes da prática estão no [ENTREGA.md](ENTREGA.md).
