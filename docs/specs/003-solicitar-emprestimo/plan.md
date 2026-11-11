# Plano — 003 Solicitar empréstimo

1. Aprovar os critérios e o prazo de devolução.
2. Servir as telas existentes pelo monolito Next.js e integrar a sessão do Supabase em cookies httpOnly. Resolver a associação ao tenant na fronteira tRPC (CA-07).
3. Consultar catálogo e empréstimos pelo servidor, usando o modelo Prisma existente. Para a solicitação, executar as verificações e a inserção em uma transação serializável, com nova tentativa limitada em conflito concorrente (CA-01 a CA-07).
4. Conectar catálogo, detalhes, confirmação e Meus empréstimos aos procedimentos. Reusar HTML, CSS e JavaScript conforme a [exceção de interface aprovada](spec.md#exceção-de-interface-aprovada) e indicar motivos de recusa no fluxo já existente (CA-01 a CA-06).
5. Testar em PostgreSQL descartável e com identidades de teste separadas. Encaminhar a implementação e as evidências ao verificador. O operador confirma o deploy com uma conta de teste, mantendo a conta do professor sem empréstimos.
