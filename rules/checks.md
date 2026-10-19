# Checklist de verificação — antes de finalizar qualquer tarefa

Rode este checklist contra o código que você acabou de escrever ou alterar.
Se qualquer item falhar, corrija antes de entregar — não relate a tarefa como
concluída com um item pendente. Marque mentalmente cada seção; não pule para
"Regras de negócio" sem passar por "Segurança" e "Multi-tenancy" antes.

## Arquitetura
- [ ] Nenhum Server Component busca dado direto do Prisma — todo acesso passa por
      procedimento tRPC.
- [ ] Nenhuma Server Action foi criada para mutação.
- [ ] Nenhuma rota REST nova foi exposta fora de `app/api/trpc/[trpc]/route.ts`.
- [ ] Nenhum tipo de resposta foi escrito à mão — vem de `RouterInputs`/
      `RouterOutputs` inferidos do `AppRouter`.

## Segurança
- [ ] `SUPABASE_SERVICE_ROLE_KEY` não aparece em nenhum arquivo importado por
      Client Component (`"use client"`) nem em código que roda no browser.
- [ ] Nenhuma variável nova com dado sensível recebe prefixo `NEXT_PUBLIC_`.
- [ ] Nenhuma leitura ou escrita de sessão usa `localStorage`/`sessionStorage`.
- [ ] Toda tabela nova tem RLS habilitado, deny by default, antes da migration
      ser considerada pronta.
- [ ] Nenhum segredo foi hardcoded no código — só vem de `env`.

## Multi-tenancy
- [ ] Toda tabela de domínio nova criada nesta tarefa tem coluna `tenant_id`.
- [ ] Nenhum procedimento lê `tenant_id` do `input()` — vem do `ctx` montado no
      `createContext`.
- [ ] Todo procedimento de domínio novo usa `tenantProcedure` (não
      `protectedProcedure` puro).
- [ ] Todo service novo que toca tabela com `tenant_id` recebe o filtro pelo
      middleware, não por `where` escrito à mão dentro do service.
- [ ] Existe teste de isolamento (tenant A não vê dado de tenant B) para cada
      procedimento novo ou alterado.

## Dados e Prisma
- [ ] Nenhuma alteração de schema, policy ou trigger foi feita pelo painel do
      Supabase — só via migration do Prisma.
- [ ] RLS, policy e trigger novos estão como SQL dentro do arquivo de migration,
      não como script solto.
- [ ] Código de runtime usa `DATABASE_URL` (pooler); nenhum código de
      aplicação usa `DIRECT_URL`.
- [ ] Nenhum comando de migration foi adicionado ao boot da aplicação
      (`instrumentation.ts`, middleware, etc.) — só existe no job de CI.
- [ ] Instância do Prisma segue o padrão singleton (sem novo `new PrismaClient()`
      solto em arquivo de rota ou componente).

## Limites operacionais
- [ ] Nenhuma operação nova depende de rodar por mais de 60s — importação e
      relatório grande foram desenhados em lotes.
- [ ] Nenhuma funcionalidade nova depende de conexão aberta (WebSocket, SSE) —
      a Vercel não suporta.
- [ ] Nenhum trabalho assíncrono ou agendado foi adicionado — tudo roda dentro
      do request, sem fila.

## Regras de negócio (PRD)
- [ ] Nenhuma alteração passa do limite de 3 itens simultâneos emprestados por
      colaborador.
- [ ] Prazo padrão de devolução continua sendo 14 dias.
- [ ] Colaborador com item em atraso não consegue solicitar novo empréstimo —
      fluxo coberto por teste.
- [ ] Equipamento em manutenção nunca aparece como disponível no catálogo.

## Fora de escopo (não implemente nesta versão)
- [ ] Nenhuma reserva com data futura foi criada.
- [ ] Nenhum e-mail de notificação é enviado.
- [ ] Nenhuma importação da planilha atual foi implementada.

## Convenções de código
- [ ] TypeScript em modo `strict`.
- [ ] Um router tRPC por domínio em `src/server/api/routers/<dominio>.ts`.
- [ ] Camadas Router (procedimento) → Service → Prisma, sem acesso ao Prisma fora do service.
- [ ] Todo `.input()` de procedimento validado com Zod.
- [ ] Formulários com React Hook Form + `zodResolver`, reaproveitando o schema Zod do procedimento.
- [ ] Estilização com Tailwind; componentes via shadcn/ui copiados para o repo (sem biblioteca fechada).
