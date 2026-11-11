# Entrega da prática

## Links

- [Repositório EmpresTI](https://github.com/BrunaCCardosos/emprest_ti)
- [Branch da prática](https://github.com/BrunaCCardosos/emprest_ti/tree/codex/pratica-sdd-dados-iniciais)
- Produção na Vercel e tag `entrega-pratica` pendentes da validação no ambiente de entrega.

## 1. Conflitos identificados

O [commit de implementação `70a9613`](https://github.com/BrunaCCardosos/emprest_ti/commit/70a96130a3689457565ca637149318cb9a59fd0b) reúne as decisões desta seção e da seção 1b, com as specs, o código e os testes correspondentes.

| Pedido do briefing | Referência | Decisão e motivo |
| --- | --- | --- |
| Verificador corrige teste que reprovou | [Fluxo de specs](rules/spec-flow.md) | O agente principal corrige e pede nova rodada. A verificação precisa ser independente. |
| Pexels e ausência de crédito na tela | Orientação do professor e [spec 002](docs/specs/002-dados-iniciais/spec.md) | A operadora confirmou Pixabay. A interface mostra o crédito com link para a fonte. |
| Dois itens em manutenção e dez disponíveis | Lista fixa da prática | Seguir os patrimônios da lista, com TI-0004, TI-0007 e TI-0010 em manutenção. A primeira carga tem nove disponíveis. |
| Gravar a senha do professor no seed | [Regra de segredos](rules/secrets.md) | A conta é criada pela operadora no Auth. O SQL registra o vínculo a partir da identidade já existente. |
| Instalar Sharp para normalizar os arquivos | [Plano da spec 002](docs/specs/002-dados-iniciais/plan.md) | FFmpeg e ffprobe já disponíveis preparam e conferem os JPEGs sem adicionar dependência à aplicação. |
| Limite de cinco e devolução em 14 dias úteis | [PRD](docs/PRD.md) | A operadora aprovou três empréstimos em aberto e 14 dias corridos na [spec 003](docs/specs/003-solicitar-emprestimo/spec.md). |

## 1b. Decisões sobre lacunas

| Spec | Lacuna | Alternativas | Decisão |
| --- | --- | --- | --- |
| [002](docs/specs/002-dados-iniciais/spec.md) | Reexecução encontra dados diferentes | Sobrescrever, abortar tudo ou preservar e avisar | Preservar e sinalizar por patrimônio. Preencher o caminho faltante quando os demais campos coincidem. |
| [002](docs/specs/002-dados-iniciais/spec.md) | Categoria e caminho da foto | Reaproveitar Acessório ou distinguir Cabo; URL completa ou caminho | Categoria `CABLE` e caminho estável por patrimônio. O bucket fica na configuração. |
| [003](docs/specs/003-solicitar-emprestimo/spec.md) | Dois pedidos simultâneos | Transação serializável ou nova restrição de banco e controle adicional do limite | Usar transação serializável com nova tentativa limitada e testar concorrência por item e por colaborador. |
| [003](docs/specs/003-solicitar-emprestimo/spec.md) | Identificar quem está com o item | Mostrar o nome ou mostrar a situação | Mostrar a situação e reservar a lista pessoal à sessão do titular. |

## 2. Onde o agente tentou decidir pela operadora

O agente escolheu inicialmente um monitor visto de cima. A operadora identificou que a perspectiva dificultava reconhecer a tela e pediu a troca. O mesmo ocorreu com três notebooks pouco claros. A revisão levou a novas buscas pela API, à troca das quatro imagens e à aprovação dos 12 JPEGs. As fotos são ilustrativas e as diagonais pertencem à lista da prática. [Evidência da revisão](docs/specs/002-dados-iniciais/revisao-fotos.md)

## 3. Decisão de arquitetura

O ADR já previa Next.js, tRPC, Prisma e Supabase. As telas existentes continuam na entrada do monolito, e a API integra somente os fluxos desta prática. A transação serializável é uma decisão da [spec 003](docs/specs/003-solicitar-emprestimo/plan.md) dentro da stack existente.

## 4. Skill de imagens

O [SKILL.md](.agents/skills/imagens-equipamentos/SKILL.md) define as etapas, as referências trazem termos de busca e instruções do operador, e o script consulta a API, redimensiona e valida. A revisão humana avalia enquadramento, marcas e conteúdo. Quatro fotos aprovadas têm retoques localizados e a reexecução da validação usa os arquivos aprovados e seus hashes. O [manifesto](docs/specs/002-dados-iniciais/manifesto-fotos.json) registra 25 rejeições nas duas rodadas finais documentadas e quatro versões anteriores substituídas, com motivos.

A preparação local usa acesso de leitura ao Pixabay. A escrita no Storage exige a sessão administrativa da operadora, conforme o [procedimento](docs/specs/002-dados-iniciais/operacao.md).

## 5. Verificador

O [gatilho da spec](rules/spec-flow.md) exige verificação independente antes de declarar prontidão. O [verificador](agents/verificador-spec.md) lê a spec, as regras, os testes ativos e as evidências do escopo indicado. O relatório por CA permite comparar rodadas.

O [lançador de verificação](scripts/verificar-spec.ps1) abre uma execução separada com sandbox de leitura, aprovações desativadas e Apps e plugins desativados. A chamada interna no Codex herda a configuração do processo principal, por isso a execução dedicada é a forma de impor esse limite técnico. [OpenAI Docs](https://developers.openai.com/codex/subagents)

## 6. Verificador em ação

Na rodada da spec 002, o verificador confirmou o manifesto e encontrou lacunas de Storage e Auth em produção. Na spec 003, apontou datas demonstrativas nos detalhes e a aplicação dispersa do filtro de tenant. O agente principal corrigiu os dois pontos. A validação de produção permanece pendente.

### Validação local em 11 de novembro de 2026

- `npm ci` e `npm run build` passaram em uma cópia fora do OneDrive, sem o `.env` do projeto e sem cache de build. `npm audit --audit-level=low` reportou zero vulnerabilidades.
- `npm test` passou com 7 testes. `npm run test:database` passou com 13 testes em bancos descartáveis no Docker local da porta 5433. A [suíte de empréstimos](tests/solicitar-emprestimo.test.ts) cobre atraso e pedidos concorrentes pelo mesmo item e por itens distintos.
- `node --test tests/fotos-iniciais.test.cjs`, com o ZIP aprovado extraído em pasta temporária, passou nos dois testes locais. Os 12 JPEGs são distintos, medem 800 × 600 e têm os hashes do manifesto. A leitura das URLs públicas depende da publicação.
- O teste HTTP com `next start`, Supabase Auth local e PostgreSQL descartável conferiu login inválido e acesso anônimo (401), POST de outra origem (403), login válido, sessão com cookie `HttpOnly`, `Secure` e `SameSite=Lax`, catálogo com os 12 caminhos de foto, recusa dos três itens em manutenção (409), três empréstimos com prazo de 14 dias corridos, recusa do quarto (412), atualização da disponibilidade, lista pessoal e encerramento da sessão.
- O teste HTTP encontrou um 403 em POST de mesma origem via `127.0.0.1`. O Next.js reescrevia o host na URL interna. O agente principal [corrigiu a comparação](app/api/trpc/%5Btrpc%5D/route.ts) e repetiu o build e o teste HTTP. A sessão e os empréstimos usaram uma conta descartável.

### Prova com erro plantado na spec 003

No [commit `c88cc4f`](https://github.com/BrunaCCardosos/emprest_ti/commit/c88cc4f1330b60834458047e8c2e4e553d0c3f88), o agente principal trocou 14 por 13 dias na constante que calcula a devolução. O verificador recebeu somente a spec, o intervalo `70a9613..c88cc4f` e a evidência sanitizada do teste local filtrado. Em contexto separado, devolveu este relatório.

| CA | Evidência (arquivo e linha) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | [Teste de catálogo](tests/solicitar-emprestimo.test.ts#L77) | SEM EXECUÇÃO | O filtro pulou catálogo, fotos, crédito e isolamento. |
| CA-02 | [Spec](docs/specs/003-solicitar-emprestimo/spec.md#L24), [asserção](tests/solicitar-emprestimo.test.ts#L91) e [constante plantada](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/src/server/services/loans.ts#L6) | REPROVADO | O teste recebeu 1.123.200.000 ms (13 dias) e esperava 1.209.600.000 ms (14 dias). A data prevista usa a constante alterada. |
| CA-03 | [Teste de limite](tests/solicitar-emprestimo.test.ts#L100) | SEM EXECUÇÃO | O filtro pulou a permissão do terceiro e a recusa do quarto. |
| CA-04 | [Teste de atraso](tests/solicitar-emprestimo.test.ts#L107) | SEM EXECUÇÃO | O filtro pulou bloqueio por atraso e liberação após devolução. |
| CA-05 | Testes de [disponibilidade](tests/solicitar-emprestimo.test.ts#L120), [mesmo item](tests/solicitar-emprestimo.test.ts#L128) e [limite em paralelo](tests/solicitar-emprestimo.test.ts#L137) | SEM EXECUÇÃO | O filtro pulou os três testes de disponibilidade e concorrência. |
| CA-06 | [Teste da lista pessoal](tests/solicitar-emprestimo.test.ts#L149) | SEM EXECUÇÃO | O filtro pulou a lista de empréstimos abertos do colaborador. |
| CA-07 | [Teste de vínculo e isolamento](tests/solicitar-emprestimo.test.ts#L162) | SEM EXECUÇÃO | O filtro pulou vínculo e isolamento no tRPC. |

- `tsx --test --test-name-pattern=CA-02 tests/solicitar-emprestimo.test.ts` saiu com código 1, com uma falha e oito casos ignorados pelo filtro. O agente principal executou esse comando em banco descartável no Docker local. A falha na asserção do prazo interrompeu o CA-02 antes das asserções de persistência e disponibilidade.
- O verificador executou `node --test tests/catalogo.test.cjs` (7 testes passaram) e `git --no-optional-locks diff --check 70a9613..c88cc4f` (passou). A suíte de banco ficou a cargo do agente principal porque escreve em um banco descartável e gera arquivos do Prisma.
- O verificador encontrou apenas a mudança da constante no intervalo, sem alteração nas exclusões da spec. **Veredito da prova: NÃO PRONTA.** O CA-02 falhou com 13 dias e os outros critérios ficaram sem execução na rodada filtrada.
- O agente principal reverteu a mudança no [commit `b462731`](https://github.com/BrunaCCardosos/emprest_ti/commit/b462731b374f88a1b40fc420ab93cf797656f7e8). `git diff --exit-code 70a9613 b462731` confirmou a restauração completa. A suíte `tsx --test tests/solicitar-emprestimo.test.ts` passou com 9 testes, inclusive o CA-02 com 14 dias corridos.

### Verificação final pendente

| Spec | Evidência local | Evidência pendente |
| --- | --- | --- |
| 002 | CA-01 e CA-02 no PostgreSQL descartável, CA-03 no manifesto e na revisão, dimensões e unicidade do CA-04, repetição de banco do CA-05, vínculo local do CA-06. | URLs públicas e repetição do upload, acesso do professor, zero empréstimos e registro das ações da operadora. |
| 003 | CA-01 a CA-07 cobertos em nove testes de tRPC e Prisma. A execução local inclui isolamento, atraso, concorrência, limite e empréstimos da própria conta. | Catálogo com as fotos publicadas e validação do login e do fluxo de empréstimo na Vercel. |

## 7. Regra posta à prova

A regra de isolamento exige injetar o escopo pelo middleware. O verificador apontou que passar o ID de sessão e lembrar do filtro em cada serviço ainda deixava o isolamento disperso. A correção concentra as consultas em [uma conexão de tenant criada pelo middleware](src/server/tenant-db.ts), inclusive dentro da transação.

## 8. O que ficou de fora

Devolução, Operações, cadastro de equipamentos, reservas e renovação ficam fora da spec 003. As telas demonstrativas desses fluxos seguem no protótipo estático. A operadora precisa integrar a branch, aplicar as migrations, publicar o lote de fotos e provisionar as contas do ambiente de entrega. As specs aguardam essa evidência e a rodada final de verificação.

Siga o [procedimento da operadora](docs/specs/002-dados-iniciais/operacao.md) para registrar o commit implantado, a URL da Vercel, o resultado da carga repetida, as 12 URLs públicas, o login e a lista vazia do professor, e os resultados de solicitação e limite com uma conta de teste. Esses registros permitem pedir as verificações finais e marcar a entrega.
