# Entrega da prática

## Links

- [Repositório EmpresTI](https://github.com/BrunaCCardosos/emprest_ti)
- [Branch da prática](https://github.com/BrunaCCardosos/emprest_ti/tree/codex/pratica-sdd-dados-iniciais)
- [EmpresTI em produção na Vercel](https://emprest-ti.vercel.app)
- [Deploy usado no teste de aceite](https://vercel.com/emprestimo-ti/emprest-ti/5rs1fNyzKxw7jRndahXoaUCmh2Cc) do [commit `9a8afb7`](https://github.com/BrunaCCardosos/emprest_ti/commit/9a8afb7aa22321c276c28476557246c8d80daa26)

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

Na verificação de fechamento, apareceram duas divergências entre a implementação e as convenções de formulário e estilização. A operadora avaliou adaptar a interface à stack e repetir o aceite. Aprovou manter as telas já validadas em HTML, CSS e JavaScript como [exceção restrita à spec 003](docs/specs/003-solicitar-emprestimo/spec.md#exceção-de-interface-aprovada). Os procedimentos continuam validando os dados de entrada com Zod.

## 4. Skill de imagens

O [SKILL.md](.agents/skills/imagens-equipamentos/SKILL.md) define as etapas, as referências trazem termos de busca e instruções do operador, e o script consulta a API, redimensiona e valida. A revisão humana avalia enquadramento, marcas e conteúdo. Quatro fotos aprovadas têm retoques localizados e a reexecução da validação usa os arquivos aprovados e seus hashes. O [manifesto](docs/specs/002-dados-iniciais/manifesto-fotos.json) registra 25 rejeições nas duas rodadas finais documentadas e quatro versões anteriores substituídas, com motivos.

A preparação local usa acesso de leitura ao Pixabay. A escrita no Storage exige a sessão administrativa da operadora, conforme o [procedimento](docs/specs/002-dados-iniciais/operacao.md).

## 5. Verificador

O [gatilho da spec](rules/spec-flow.md) exige verificação independente antes de declarar prontidão. O [verificador](agents/verificador-spec.md) lê a spec, as regras, os testes ativos e as evidências do escopo indicado. O relatório por CA permite comparar rodadas.

O [lançador de verificação](scripts/verificar-spec.ps1) abre uma execução separada com sandbox de leitura, aprovações desativadas e Apps e plugins desativados. A chamada interna no Codex herda a configuração do processo principal, por isso a execução dedicada é a forma de impor esse limite técnico. [OpenAI Docs](https://developers.openai.com/codex/subagents)

## 6. Verificador em ação

Na rodada inicial da spec 002, o verificador confirmou o manifesto e apontou que faltavam as evidências de Storage e Auth. Na spec 003, apontou datas demonstrativas nos detalhes e a aplicação dispersa do filtro de tenant. O agente principal corrigiu os dois pontos.

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
| CA-01 | [Teste de catálogo](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L77) | SEM EXECUÇÃO | O filtro pulou catálogo, fotos, crédito e isolamento. |
| CA-02 | [Spec](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/docs/specs/003-solicitar-emprestimo/spec.md#L24), [asserção](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L91) e [constante plantada](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/src/server/services/loans.ts#L6) | REPROVADO | O teste recebeu 1.123.200.000 ms (13 dias) e esperava 1.209.600.000 ms (14 dias). A data prevista usa a constante alterada. |
| CA-03 | [Teste de limite](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L100) | SEM EXECUÇÃO | O filtro pulou a permissão do terceiro e a recusa do quarto. |
| CA-04 | [Teste de atraso](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L107) | SEM EXECUÇÃO | O filtro pulou bloqueio por atraso e liberação após devolução. |
| CA-05 | Testes de [disponibilidade](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L120), [mesmo item](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L128) e [limite em paralelo](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L137) | SEM EXECUÇÃO | O filtro pulou os três testes de disponibilidade e concorrência. |
| CA-06 | [Teste da lista pessoal](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L149) | SEM EXECUÇÃO | O filtro pulou a lista de empréstimos abertos do colaborador. |
| CA-07 | [Teste de vínculo e isolamento](https://github.com/BrunaCCardosos/emprest_ti/blob/c88cc4f1330b60834458047e8c2e4e553d0c3f88/tests/solicitar-emprestimo.test.ts#L162) | SEM EXECUÇÃO | O filtro pulou vínculo e isolamento no tRPC. |

- `tsx --test --test-name-pattern=CA-02 tests/solicitar-emprestimo.test.ts` saiu com código 1, com uma falha e oito casos ignorados pelo filtro. O agente principal executou esse comando em banco descartável no Docker local. A falha na asserção do prazo interrompeu o CA-02 antes das asserções de persistência e disponibilidade.
- O verificador executou `node --test tests/catalogo.test.cjs` (7 testes passaram) e `git --no-optional-locks diff --check 70a9613..c88cc4f` (passou). A suíte de banco ficou a cargo do agente principal porque escreve em um banco descartável e gera arquivos do Prisma.
- O verificador encontrou apenas a mudança da constante no intervalo, sem alteração nas exclusões da spec. **Veredito da prova: NÃO PRONTA.** O CA-02 falhou com 13 dias e os outros critérios ficaram sem execução na rodada filtrada.
- O agente principal reverteu a mudança no [commit `b462731`](https://github.com/BrunaCCardosos/emprest_ti/commit/b462731b374f88a1b40fc420ab93cf797656f7e8). `git diff --exit-code 70a9613 b462731` confirmou a restauração completa. A suíte `tsx --test tests/solicitar-emprestimo.test.ts` passou com 9 testes, inclusive o CA-02 com 14 dias corridos.

### Teste de aceite em produção

- A operadora integrou a implementação, disparou a [migration na `main`](https://github.com/BrunaCCardosos/emprest_ti/actions/runs/42986606224), executou a carga duas vezes, publicou as fotos e criou o vínculo do professor. [Registro e capturas da operação](docs/specs/evidencias-pratica/verificacao-operadora.md#spec-002)
- A implantação inicial retornou 404 com o preset `Other`. A operadora selecionou `Next.js`, configurou as variáveis de produção e refez o deploy. A página e a sessão responderam HTTP 200 e o catálogo anônimo retornou HTTP 401.
- A conferência em produção revelou dois defeitos de interface. A seção `Histórico` exibia exemplos do protótipo, removidos da resposta publicada no [PR #3](https://github.com/BrunaCCardosos/emprest_ti/pull/3). A seleção de um equipamento disponível mantinha o botão desabilitado. O [PR #4](https://github.com/BrunaCCardosos/emprest_ti/pull/4) corrigiu a atualização do botão e incluiu um teste que falhou antes e passou depois.
- A operadora confirmou três empréstimos com vencimento em 14 dias corridos e o quarto item bloqueado com motivo na conta separada. A conta do professor ficou com zero empréstimos totais após a remoção dos três pedidos de teste feitos por engano e continuou com a lista vazia após a nova conferência. [Capturas do teste separado](docs/specs/evidencias-pratica/verificacao-operadora.md#spec-003), [contagem do professor](docs/specs/evidencias-pratica/professor-zero-no-banco.png).
- No código implantado, `npm test` passou com 8 testes, `node --test tests/dados-iniciais.test.cjs` com 4, `tsx --test tests/solicitar-emprestimo.test.ts` com 10 e `node --test tests/fotos-iniciais.test.cjs` com 3. O teste das fotos incluiu os 12 JPEGs locais e as 12 URLs públicas. As suítes que escrevem usaram bancos descartáveis no Docker local da porta 5433.

### Verificações independentes de fechamento

As rodadas de fechamento usaram o código implantado em `9a8afb7` e as evidências da operadora. Os verificadores executaram os checks compatíveis com leitura e conferiram as saídas sanitizadas dos testes locais que escrevem em bancos descartáveis.

#### Spec 002 — Dados iniciais

| CA | Evidência | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | [Carga dos patrimônios](tests/dados-iniciais.test.cjs#L48), [reexecução](tests/dados-iniciais.test.cjs#L71), [teste manual](docs/specs/evidencias-pratica/verificacao-operadora.md#L7) | ATENDIDO | Doze patrimônios com nomes e categorias corretos. Registros de outros patrimônios e tenants preservados. |
| CA-02 | [Teste de situações](tests/dados-iniciais.test.cjs#L63), [catálogo inicial](docs/specs/evidencias-pratica/verificacao-operadora.md#L11) | ATENDIDO | Nove disponíveis, três em manutenção nos patrimônios previstos e zero empréstimos criados pela carga. |
| CA-03 | [Teste do manifesto](tests/fotos-iniciais.test.cjs#L17), [revisão visual](docs/specs/002-dados-iniciais/revisao-fotos.md#L3) | ATENDIDO | Doze imagens aprovadas com origem, autor e licença. A revisão registra 25 rejeições e quatro versões substituídas. |
| CA-04 | [JPEGs locais](tests/fotos-iniciais.test.cjs#L37), [URLs públicas](tests/fotos-iniciais.test.cjs#L54) | ATENDIDO | JPEGs de 800 × 600 com hashes distintos. As 12 URLs responderam sem login e com os hashes aprovados. |
| CA-05 | [Carga repetida](tests/dados-iniciais.test.cjs#L71), [repetição dos arquivos](docs/specs/evidencias-pratica/verificacao-operadora.md#L17) | ATENDIDO | A segunda execução preservou IDs e caminhos. O teste local do lote preservou os 12 JPEGs e o objeto preexistente. O bucket publicado foi revalidado por leitura. |
| CA-06 | [Teste do vínculo](tests/dados-iniciais.test.cjs#L109), [teste manual](docs/specs/evidencias-pratica/verificacao-operadora.md#L19) | ATENDIDO | Login do professor como colaborador. Contagem zero após retirar os três testes feitos por engano e lista vazia depois do aceite na conta separada. |
| CA-07 | [Teste de separação](docs/specs/evidencias-pratica/verificacao-operadora.md#L23), [workflow](.github/workflows/migrate.yml#L14) | ATENDIDO | Preparação e testes de escrita locais. Migration, carga, upload e provisionamento executados pela operadora. A triagem de segredos no Git passou para os padrões conferidos. |

Na revisão, 8 testes de catálogo e 2 testes locais de fotos passaram, assim como a checagem de diff do recorte. O verificador conferiu a execução principal de 4 testes de dados iniciais e 3 testes de fotos, incluindo o bucket público. A interface do catálogo e dos pedidos pertence à spec 003. **Veredito da spec 002 — PRONTA.**

#### Spec 003 — Solicitar empréstimo

A primeira rodada de fechamento teve os sete critérios funcionais atendidos e veredito **NÃO PRONTA** por duas divergências no checklist, o uso de formulário HTML em vez de React Hook Form com `zodResolver` e a estilização em CSS sem Tailwind e shadcn/ui. A operadora aprovou a exceção de interface, registrada na spec e nas regras. Um novo verificador conferiu o escopo da decisão e a validação Zod na API.

| CA | Evidência | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | [Teste do catálogo](tests/solicitar-emprestimo.test.ts#L78), [catálogo em produção](docs/specs/evidencias-pratica/verificacao-operadora.md#L29) | ATENDIDO | Catálogo do tenant com 12 equipamentos, fotos, crédito e situações. Itens fora de uso e de outro tenant ficam fora da lista. |
| CA-02 | [Teste da solicitação](tests/solicitar-emprestimo.test.ts#L89), [regressão do botão](tests/catalogo.test.cjs#L251), [teste manual](docs/specs/evidencias-pratica/verificacao-operadora.md#L33) | ATENDIDO | O pedido é gravado imediatamente para o titular da sessão, com 14 dias corridos. Recarregar o catálogo preserva a indicação de emprestado. |
| CA-03 | [Teste do limite](tests/solicitar-emprestimo.test.ts#L101), [quarto item bloqueado](docs/specs/evidencias-pratica/conta-teste-quarto-bloqueado.png) | ATENDIDO | O terceiro é aceito. O quarto é bloqueado com motivo na tela e o servidor recusa a mutação sem novo registro no teste descartável. |
| CA-04 | [Teste de atraso](tests/solicitar-emprestimo.test.ts#L108), [mensagem de bloqueio](app.js#L499) | ATENDIDO | O atraso em aberto impede a solicitação e aparece como motivo. A devolução registrada no teste elimina esse bloqueio. |
| CA-05 | [Disponibilidade](tests/solicitar-emprestimo.test.ts#L121), [mesmo item](tests/solicitar-emprestimo.test.ts#L129), [limite em paralelo](tests/solicitar-emprestimo.test.ts#L138) | ATENDIDO | O servidor recusa manutenção, fora de uso e empréstimo aberto. A concorrência permite um empréstimo pelo mesmo item e respeita o limite do colaborador. |
| CA-06 | [Teste da lista pessoal](tests/solicitar-emprestimo.test.ts#L150), [teste do HTML publicado](tests/solicitar-emprestimo.test.ts#L163), [lista em produção](docs/specs/evidencias-pratica/conta-teste-tres-emprestimos.png) | ATENDIDO | Uma conta nova começa com lista vazia. A lista mostra apenas itens em aberto do titular, com as datas previstas. |
| CA-07 | [Teste de vínculo e isolamento](tests/solicitar-emprestimo.test.ts#L171), [teste anônimo na Vercel](docs/specs/evidencias-pratica/verificacao-operadora.md#L39) | ATENDIDO | Consultas e solicitações exigem vínculo e isolam por tenant. O catálogo público sem sessão respondeu HTTP 401. |

Na revisão, os 8 testes do catálogo passaram. O verificador conferiu a suíte de empréstimos com 10 testes, o build fora do OneDrive e o teste HTTP local, executados pelo agente principal. As exclusões da spec foram respeitadas. A operadora corrigiu os pedidos feitos por engano na conta do professor e repetiu o aceite em uma conta separada. **Veredito da spec 003 — PRONTA.**

## 7. Regra posta à prova

A regra de isolamento exige injetar o escopo pelo middleware. O verificador apontou que passar o ID de sessão e lembrar do filtro em cada serviço ainda deixava o isolamento disperso. A correção concentra as consultas em [uma conexão de tenant criada pelo middleware](src/server/tenant-db.ts), inclusive dentro da transação.

## 8. O que ficou de fora

Devolução, histórico de itens devolvidos, Operações, cadastro de equipamentos, reservas e renovação ficam fora da spec 003. As telas demonstrativas desses fluxos seguem no protótipo estático.

Em uma próxima prática, o teste da interface deve abrir os detalhes a partir do catálogo e acionar o botão de pedido com uma conta descartável. O teste direto da API cobriu as regras de negócio e a validação da Vercel encontrou o erro que deixava o botão desabilitado.
