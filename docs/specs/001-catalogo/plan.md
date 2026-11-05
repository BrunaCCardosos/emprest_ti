# Plano do catálogo

Registro retrospectivo da implementação do protótipo descrita em [spec.md](spec.md).

1. Renderizar a lista a partir dos dados de demonstração em `app.js`. Exibir a situação em cada cartão e ordenar os disponíveis primeiro (CA-01, CA-02).
2. Atualizar a lista com os eventos de busca e filtro. Aplicar os critérios em conjunto e exibir uma mensagem quando o resultado estiver vazio (CA-02 a CA-05).
3. Abrir os detalhes do equipamento disponível por clique ou teclado. Usar os dados do cartão selecionado na tela de detalhe (CA-02, CA-06).
4. Calcular os totais a partir do catálogo e mostrar a quantidade da seleção quando houver filtros (CA-02, CA-07).
5. Exercitar os critérios com dados de demonstração e DOM simulado. Rodar `node --test tests/catalogo.test.cjs` e encaminhar a spec para verificação em contexto separado.
