# Revisão das fotos aprovadas

A operadora aprovou os 12 JPEGs em 11 de novembro de 2026. O [manifesto](manifesto-fotos.json) conserva a associação entre patrimônio, ID da API do Pixabay, página de origem, fotógrafo, licença, preparo e hash do arquivo.

As rodadas finais documentaram 25 candidatas rejeitadas por enquadramento, presença de pessoas, marcas, conteúdo na tela ou tipo de equipamento incorreto. Outras quatro fotos foram substituídas depois da revisão do enquadramento. O manifesto registra os motivos e delimita as duas rodadas contabilizadas.

Os JPEGs foram ajustados proporcionalmente para 800 × 600. Quatro originais do Pixabay receberam retoques localizados com ImageGen para retirar marcas ou inscrições. Os resultados foram revisados e aprovados. O retoque depende de revisão humana e pode produzir outro resultado se repetido. Para repetir a validação e a publicação, usar os JPEGs aprovados, com os hashes do manifesto. A pasta de trabalho e a chave do Pixabay ficam fora do Git.

Para revalidar os arquivos locais, apontar `EMPRESTI_PHOTO_DIR` para a pasta que contém os 12 JPEGs e executar `node --test tests/fotos-iniciais.test.cjs`. Depois do upload, apontar `EMPRESTI_PUBLIC_PHOTO_BASE` para a URL pública do bucket e repetir o comando. Essa verificação usa leitura pública e compara os bytes recebidos com o manifesto.
