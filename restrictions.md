# Instruções de arquitetura — projeto de empréstimo de equipamentos internos

Você está trabalhando num monolito Next.js (App Router) com tRPC, Prisma e Supabase,
hospedado na Vercel (plano Hobby). Antes de escrever qualquer código, siga estas
regras sem exceção. Se um pedido do usuário conflitar com alguma delas, avise antes
de implementar.

## Arquitetura — caminhos únicos, não alternativos
- NUNCA busque dado direto do Prisma em Server Component. Todo acesso a dado passa
  por um procedimento tRPC.
- NUNCA crie Server Action para mutação. Toda escrita passa por procedimento tRPC.
- NUNCA exponha rota REST além do endpoint único `app/api/trpc/[trpc]/route.ts`.
- NUNCA introduza versionamento de API nem misture builds diferentes de
  cliente/servidor em produção.

## Segurança
- `SUPABASE_SERVICE_ROLE_KEY` NUNCA é importada em código que o bundle do cliente
  alcança — só em código de servidor.
- NENHUMA variável de ambiente sensível recebe prefixo `NEXT_PUBLIC_`.
- Sessão NUNCA é guardada em `localStorage`; sempre cookie `httpOnly` via
  `@supabase/ssr`.
- RLS habilitado (deny by default) em toda tabela nova, mesmo sendo defesa
  secundária — não é opcional.

## Multi-tenancy
- Toda tabela de domínio nova recebe a coluna `tenant_id` desde a migration
  inicial, nunca depois.
- `tenant_id` NUNCA vem do input do procedimento; sempre resolvido no
  `createContext` a partir da sessão.
- Nenhuma query de domínio roda sem passar por `tenantProcedure`. Nunca confie em
  lembrar do `where: { tenantId }` manual em cada service.
- Todo procedimento novo precisa de um teste de isolamento (tenant A não vê dado
  de tenant B) antes de ser considerado pronto.

## Dados e Prisma
- Prisma Migrate é o único dono do schema. NUNCA altere tabela, policy ou trigger
  pelo painel do Supabase.
- Policy, RLS e trigger entram como SQL dentro da migration do Prisma, nunca como
  script solto.
- Runtime sempre usa `DATABASE_URL` (Supavisor, porta 6543,
  `?pgbouncer=true&connection_limit=1`). `DIRECT_URL` (porta 5432) é só para
  migration.
- Migration roda no CI (`prisma migrate deploy`), NUNCA no boot da aplicação.

## Limites operacionais (Hobby + serverless)
- Nenhuma operação pode depender de rodar por mais de 60s — desenhe importação e
  relatório grande em lotes.
- Nenhuma funcionalidade pode depender de conexão aberta (WebSocket, SSE) — a
  Vercel não suporta.
- Nenhum trabalho assíncrono ou agendado — tudo roda dentro do request, sem fila.

## Regras de negócio (PRD)
- Máximo de 3 itens simultâneos emprestados por colaborador.
- Prazo padrão de devolução: 14 dias.
- Colaborador com item em atraso não pode solicitar novo empréstimo.
- Equipamento em manutenção nunca aparece como disponível no catálogo.

## Fora de escopo nesta versão — não implemente
- Reserva com data futura.
- Notificação por e-mail.
- Importação da planilha atual.

## Convenções de código
- TypeScript em modo `strict`.
- Um router tRPC por domínio em `src/server/api/routers/<dominio>.ts`.
- Camadas: Router (procedimento) → Service → Prisma.
- Todo `.input()` de procedimento validado com Zod.
- Formulários com React Hook Form + `zodResolver`, reaproveitando o schema Zod
  do procedimento.
- Estilização com Tailwind; componentes via shadcn/ui (copiados para o repo, não
  importados de biblioteca fechada).
