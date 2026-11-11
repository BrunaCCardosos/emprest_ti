# 003 — Solicitar empréstimo

**Status:** aprovada pela operadora em 2026-11-11. Implementação em andamento.

## Objetivo e escopo

O colaborador autenticado vê os equipamentos do seu tenant, solicita um disponível e acompanha seus próprios empréstimos em aberto. A solicitação confirmada cria o empréstimo na hora. As telas do protótipo servem de base. Devolução, Operações, cadastro de equipamentos, reservas, notificações e renovação ficam fora desta etapa.

## Decisões propostas

- O limite do PRD é de três empréstimos abertos por colaborador. Um empréstimo em atraso impede novo pedido. O servidor determina a data prevista somando 14 dias corridos ao instante da retirada, em UTC, conforme a regra de 14 dias do PRD e o cálculo descrito no schema. A interface exibe a data no fuso de São Paulo.
- As fotos aprovadas vêm do bucket público, pelos caminhos do cadastro da spec 002. O catálogo exibe o crédito “Fotos: Pixabay” com link, conforme a fonte orientada pelo professor.
- O servidor resolve o tenant e a identidade pelo vínculo da sessão autenticada. O catálogo mostra que um item está emprestado sem revelar o nome de outro colaborador.
- A conta do professor permanece com zero empréstimos. Validações que criam empréstimos usam contas de teste distintas.

## Critérios de aceite

### CA-01 — Catálogo do tenant e créditos

O colaborador autenticado vê os 12 itens da carga inicial do seu tenant, com nome, patrimônio, categoria, situação e foto. A página tem o link “Fotos: Pixabay”. Equipamentos de outro tenant ficam fora da lista. Equipamentos fora de uso ficam fora do catálogo.

### CA-02 — Solicitação imediata e devolução prevista

Ao confirmar um equipamento disponível, o servidor cria um empréstimo para o colaborador da sessão, grava a devolução prevista 14 dias corridos após a retirada e atualiza a disponibilidade. Recarregar o catálogo mantém o item como emprestado.

### CA-03 — Limite de três

O terceiro empréstimo em aberto é permitido quando os demais requisitos forem atendidos. O quarto é recusado com motivo visível e nenhum registro novo.

### CA-04 — Atraso

Um colaborador com empréstimo aberto cuja data prevista já passou recebe uma recusa com o motivo visível. Um empréstimo devolvido não conta como atraso em aberto.

### CA-05 — Disponibilidade e concorrência

Itens em manutenção, fora de uso ou com empréstimo em aberto são recusados pelo servidor. Dois pedidos simultâneos para o mesmo equipamento criam exatamente um empréstimo. Pedidos simultâneos para itens diferentes não permitem ultrapassar o limite do colaborador.

### CA-06 — Meus empréstimos

A tela mostra somente os empréstimos abertos do colaborador no tenant da sessão, cada um com o equipamento e a data de devolução prevista. Uma conta nova começa com a lista vazia.

### CA-07 — Autenticação e isolamento

Visitantes sem sessão não consultam nem solicitam empréstimos. Uma sessão válida sem vínculo com o tenant não tem acesso aos seus dados. Um colaborador não consegue solicitar por patrimônio um equipamento que existe apenas em outro tenant.
