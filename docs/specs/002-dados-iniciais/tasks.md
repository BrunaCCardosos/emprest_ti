# Tarefas — 002 Dados iniciais

- [x] Aprovar o escopo e o DDL.
- [x] Aplicar e validar a migration aditiva no PostgreSQL local (CA-01, CA-04, CA-05). Prisma confirmou as duas migrations aplicadas na porta 5433. A categoria `CABLE`, a coluna opcional `photo_path`, o RLS e o índice único de patrimônio por tenant foram conferidos. A tabela de equipamentos estava vazia antes da migration.
- [x] Preparar a skill `imagens-equipamentos`. Em teste offline, a busca reutilizou o cache, o script gerou 12 JPEGs distintos em 800 × 600 e a reexecução conferiu o mesmo lote. Uma aprovação com ID repetido foi rejeitada.
- [x] Buscar as fotos reais e gerar o lote local com manifesto (CA-03, CA-04, CA-07). A operadora aprovou os 12 JPEGs em 2026-11-11. Dimensões de 800 × 600, IDs de origem e hashes conferidos.
- [x] Consolidar o registro de rejeições e documentar a validação repetível dos quatro retoques aprovados (CA-03, CA-07). Ver [revisão](revisao-fotos.md) e [manifesto](manifesto-fotos.json).
- [x] Implementar e testar a carga repetível no PostgreSQL local (CA-01, CA-02 e parte de banco do CA-05). A carga de equipamentos está em `prisma/seed-equipments.sql` e usa as duas migrations já aplicadas. No Docker da porta 5433, foram conferidos 12 equipamentos, nove disponíveis, três em manutenção, 12 caminhos de foto e zero empréstimos. A segunda execução manteve os 12 IDs e caminhos. `node --test tests/dados-iniciais.test.cjs` passou com três testes em banco descartável e `node --test tests/catalogo.test.cjs` passou com sete testes de demonstração.
- [x] Preparar o [procedimento da operadora](operacao.md) e a rotina de vínculo da conta (CA-04 a CA-07).
- [x] Executar a rodada de verificação independente local. Veredito **NÃO PRONTA** enquanto as evidências de produção estiverem pendentes.
- [ ] Reunir evidências de produção e solicitar a rodada final ao verificador (CA-04 a CA-07).
