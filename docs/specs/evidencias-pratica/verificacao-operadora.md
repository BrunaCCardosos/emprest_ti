# Verificação da prática em produção

Em 11 de novembro de 2026, Bruna executou as ações de produção e conferiu a [Vercel](https://emprest-ti.vercel.app). A implementação usada no teste corresponde ao [merge `9a8afb7`](https://github.com/BrunaCCardosos/emprest_ti/commit/9a8afb7aa22321c276c28476557246c8d80daa26), com [deploy bem-sucedido](https://vercel.com/emprestimo-ti/emprest-ti/5rs1fNyzKxw7jRndahXoaUCmh2Cc).

## Spec 002

### CA-01, CA-02 e CA-05 — Teste manual da carga e do catálogo

A operadora integrou o [PR #2](https://github.com/BrunaCCardosos/emprest_ti/pull/2) e disparou o [workflow de migrations #1](https://github.com/BrunaCCardosos/emprest_ti/actions/runs/42986606224) na `main`. Conferiu RLS ativo em `equipments` e `tenants` e rodou o seed de equipamentos duas vezes no SQL Editor. A primeira execução retornou 12 linhas. A captura da segunda mostra `já conferido` para as linhas visíveis. A suíte em banco descartável confere os 12 IDs e caminhos antes e depois da repetição e exercita a preservação de registros preexistentes e divergentes.

O catálogo, antes das solicitações, mostrou 12 equipamentos, nove disponíveis e `TI-0004`, `TI-0007` e `TI-0010` em manutenção. [Primeira carga](carga-inicial.png), [segunda carga](carga-repetida.png), [catálogo inicial](professor-catalogo.png), [itens em manutenção e crédito](catalogo-manutencao-e-creditos.png).

### CA-03, CA-04 e CA-05 — Teste de publicação das fotos

A operadora usou o ZIP aprovado e carregou 12 JPEGs na pasta `suporte_ti` do bucket público `equipment-photos`. A checagem sem autenticação comparou os 12 objetos públicos byte a byte por SHA-256 com o manifesto. Os 12 JPEGs locais medem 800 × 600 e têm IDs do Pixabay e hashes distintos. A revalidação usa os mesmos caminhos e confirma o mesmo conteúdo. [Upload no Storage](storage-fotos-publicadas.png), [manifesto](../002-dados-iniciais/manifesto-fotos.json), [revisão e créditos](../002-dados-iniciais/revisao-fotos.md).

No teste local do CA-05, foram feitas duas passagens com as mesmas entradas em um diretório descartável. A primeira copiou 12 objetos para os caminhos do manifesto. A segunda comparou os hashes e pulou os 12 objetos existentes. Os caminhos, hashes e horários de modificação foram idênticos entre as duas passagens. Um arquivo preexistente fora do lote também foi preservado. A conferência do bucket publicado foi uma revalidação de leitura pelas mesmas 12 URLs.

### CA-06 — Teste manual da conta do professor

A operadora criou o usuário no Supabase Auth, executou `link-teacher.sql` e entrou na Vercel como Marcelo Grilo, com papel de colaborador. Três pedidos de teste foram feitos nessa conta durante a primeira conferência. Após confirmar que os três eram testes sem retirada real, a operadora removeu somente esses registros e a consulta retornou zero empréstimos totais. O teste de aceite foi repetido com uma conta separada. Em seguida, a operadora confirmou que `Meus empréstimos` do professor continuava vazio, com `0 de 3 itens`. [Login e catálogo](professor-catalogo.png), [contagem no banco](professor-zero-no-banco.png), [lista da conta separada](conta-teste-tres-emprestimos.png).

### CA-07 — Teste manual da separação entre preparação e publicação

A preparação dos JPEGs e as suítes de banco rodaram localmente. A validação externa pelo agente leu somente as URLs públicas do Storage e da Vercel. A operadora executou as ações de produção no GitHub, no SQL Editor, no Auth, no Storage e na Vercel. O teste conferiu a autoria do disparo da migration e as capturas produzidas pela operadora durante a carga, a publicação e o provisionamento. A conferência dos arquivos versionados encontrou somente `.env.example` como arquivo de ambiente. [Execução da migration](https://github.com/BrunaCCardosos/emprest_ti/actions/runs/42986606224), [carga](carga-inicial.png), [publicação](storage-fotos-publicadas.png), [conferência do vínculo](professor-catalogo.png), [roteiro](../002-dados-iniciais/operacao.md).

## Spec 003

### CA-01 e CA-05 — Teste manual do catálogo

A operadora autenticou-se na Vercel, viu os 12 equipamentos com fotos e o link de crédito do Pixabay. Os três patrimônios definidos pela spec aparecem com o estado **Manutenção** e sem a ação de pedido. [Catálogo inicial](professor-catalogo.png), [manutenção e crédito](catalogo-manutencao-e-creditos.png).

### CA-02, CA-03 e CA-06 — Teste manual da conta separada

A operadora solicitou `TI-0001`, `TI-0002` e `TI-0003` na conta identificada como **Conta de teste**. A tela `Meus empréstimos` mostrou três itens, retirados em 11/11/2026 e com devolução prevista para 25/11/2026. Ao abrir `TI-0005`, o equipamento ainda estava disponível e o botão de pedido estava desabilitado. A área **Seus itens** informou que o limite de três foi atingido. [Três empréstimos e datas](conta-teste-tres-emprestimos.png), [quarto item bloqueado](conta-teste-quarto-bloqueado.png).

A suíte de banco descartável testa diretamente a recusa do quarto pedido com código `PRECONDITION_FAILED`, atraso, concorrência e isolamento. O teste manual acima observa o bloqueio na interface.

### CA-07 — Teste HTTP de acesso anônimo

No domínio público, a página e `/app.js` retornaram HTTP 200. A sessão anônima respondeu HTTP 200 sem usuário. A consulta ao catálogo sem sessão retornou HTTP 401 `UNAUTHORIZED`. Os testes de tRPC e PostgreSQL descartável cobrem as demais condições de vínculo e isolamento.
