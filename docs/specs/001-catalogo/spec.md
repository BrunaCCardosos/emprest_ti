# 001 — Catálogo de equipamentos

## Objetivo

Permitir que o colaborador encontre equipamentos, confira a situação de cada item e abra os detalhes de um item disponível antes de decidir se quer pedir um empréstimo.

Fonte de negócio [PRD — Empréstimo de Equipamentos Internos](../../PRD.md).

## Escopo

A tela Catálogo inclui a lista de equipamentos, a busca, os filtros, a contagem de resultados e a abertura dos detalhes a partir da lista. Cadastro, confirmação de empréstimo e devolução ficam fora desta spec.

## Critérios de aceite

### CA-01 — Identificação e situação dos equipamentos

Ao abrir o catálogo com uma sessão ativa, sem busca e com o filtro **Todos** selecionado, cada equipamento aparece uma vez, com nome, categoria, patrimônio e a situação correspondente ao cadastro. Os rótulos esperados são **Disponível**, **Emprestado** e **Manutenção**. Os itens disponíveis aparecem antes dos demais.

### CA-02 — Equipamento em manutenção

Um equipamento em manutenção aparece com o rótulo **Manutenção** na lista geral e nas buscas ou categorias que correspondam a ele. Ele fica fora dos resultados quando **Só disponíveis** está ativo e fora da contagem de disponíveis. Seu cartão não abre o fluxo de solicitação por clique ou teclado.

### CA-03 — Filtros combinados

Ao selecionar **Notebooks**, **Monitores**, **Câmeras** ou **Acessórios**, a lista mostra somente a categoria selecionada. Ativar **Só disponíveis** restringe os resultados aos itens disponíveis daquela categoria. Desativar essa opção mantém a categoria selecionada. Selecionar **Todos** remove a restrição de categoria e preserva o estado de **Só disponíveis**.

### CA-04 — Busca

A lista se atualiza enquanto o colaborador digita. Um trecho do nome, da categoria ou do patrimônio localiza o equipamento sem distinguir maiúsculas de minúsculas e ignorando espaços nas pontas da consulta. A busca respeita os filtros ativos. Limpar o campo restaura os resultados permitidos por esses filtros.

### CA-05 — Nenhum resultado

Se a combinação de busca e filtros não encontrar nenhum equipamento, a lista fica sem cartões e exibe a mensagem “Nada encontrado por aqui. Tente outro filtro ou outra busca.” Ao mudar a busca ou os filtros para uma combinação com resultados, a mensagem desaparece e os cartões voltam.

### CA-06 — Abertura dos detalhes

Ao clicar em um cartão disponível, ou ao focá-lo pelo teclado e pressionar Enter ou Espaço, o colaborador chega aos detalhes do item selecionado. Nome, categoria e patrimônio nos detalhes correspondem aos do cartão. Cartões de itens emprestados ou em manutenção não oferecem essa ação.

### CA-07 — Contagem do catálogo

Sem filtros nem busca, o cabeçalho informa o total de equipamentos da lista e o total de disponíveis. Com busca ou filtros ativos, informa quantos itens correspondem à seleção em relação ao total do catálogo. A contagem de disponíveis continua sendo a do catálogo inteiro e inclui apenas itens com situação **Disponível**.

## Referência para verificação

A tela atual está em [index.html](../../../index.html) e usa dados de demonstração definidos em [app.js](../../../app.js). Use o MacBook Pro 14” (PAT-1042) como exemplo disponível, o ThinkPad T14 (PAT-1188) como emprestado e o LG UltraFine 24” (PAT-0910) como item em manutenção.

Com os dados iniciais, o cabeçalho mostra 6 equipamentos e 3 disponíveis. A suíte local pode ser executada com `node --test tests/catalogo.test.cjs`.
