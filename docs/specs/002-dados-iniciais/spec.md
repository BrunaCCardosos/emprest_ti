# 002 — Dados iniciais do EmpresTI

**Status:** escopo e DDL aprovados. Implementação em andamento.

## Objetivo

Preparar os 12 equipamentos da prática, cada um com uma foto pública aprovada, e disponibilizar a conta do professor como colaborador do tenant `suporte_ti`, com zero empréstimos. A carga deve poder ser repetida preservando os registros já existentes.

## Escopo

- Preparar as fotos com a skill `imagens-equipamentos`, validar os arquivos e registrar seus créditos.
- Carregar os equipamentos no tenant `suporte_ti` e associar cada registro à foto correspondente no Supabase Storage.
- Provisionar a conta do professor e conferir o acesso pelo login existente. A carga inicial cria zero empréstimos.
- Reservar a exibição das fotos e dos créditos no catálogo e a integração dos empréstimos para a spec 003. Cadastro pela interface, importação de planilha e alterações de landing, logo e ilustrações ficam fora desta etapa.

Referências do projeto [PRD](../../PRD.md) e [ADR 001 — Stack, dados e autenticação](../../adr/001-stack.md).

## Lista de referência

Cada linha traz patrimônio, nome, categoria, situação inicial e termo de busca do HTML da prática.

- `TI-0001` — Notebook 14 polegadas · notebook · disponível · `laptop on white desk`
- `TI-0002` — Notebook 15 polegadas · notebook · disponível · `open laptop minimal desk`
- `TI-0003` — Notebook 13 polegadas · notebook · disponível · `laptop closeup keyboard`
- `TI-0004` — Notebook 15 polegadas · notebook · manutenção · `closed laptop on table`
- `TI-0005` — Monitor 24 polegadas · monitor · disponível · `computer monitor on desk`
- `TI-0006` — Monitor 27 polegadas · monitor · disponível · `monitor screen office desk`
- `TI-0007` — Monitor 22 polegadas · monitor · manutenção · `black computer screen`
- `TI-0008` — Cabo HDMI 2 m · cabo · disponível · `hdmi cable`
- `TI-0009` — Cabo USB-C 1 m · cabo · disponível · `usb cable white background`
- `TI-0010` — Cabo de rede 3 m · cabo · manutenção · `ethernet cable`
- `TI-0011` — Webcam Full HD · câmera · disponível · `webcam`
- `TI-0012` — Câmera compacta · câmera · disponível · `compact camera on table`

## Decisões e pontos do plano

- **Fonte definida pelo professor.** Como o Pexels indicado no HTML não funcionou para a prática, o professor orientou a turma a usar Pixabay, conforme informado pela responsável pelo projeto. Registre a origem de cada foto. A proposta para a spec 003 é exibir “Fotos: Pixabay” com link quando o catálogo mostrar as imagens. [API oficial do Pixabay](https://pixabay.com/api/docs/)
- **Situação do `TI-0010`.** O briefing indica dois equipamentos em manutenção, mas a lista fixa também inclui o cabo `TI-0010`. Vale a lista fixa, com **três em manutenção e nove disponíveis**.
- **Categoria dos cabos.** Adicionar uma categoria própria para cabo e preservar `ACCESSORY`, mantendo a distinção da lista e as categorias dos registros existentes.
- **Referência de foto.** Guardar no equipamento o caminho do objeto no bucket público do Supabase, com valor opcional para registros anteriores à prática. Os 12 equipamentos desta carga devem ter foto. O caminho estável por patrimônio permite repetir a carga sem criar outro objeto. Um manifesto associa patrimônio, caminho, ID e página de origem do Pixabay, autor e licença.
- **Reexecução da carga.** Identificar cada registro pelo par tenant e patrimônio. Em nova execução, completar o que faltar e sinalizar divergências preservando dados e fotos existentes.
- **Redimensionamento.** O briefing cita `sharp`. O plano deve propor a ferramenta e a forma de enquadramento, considerando as dependências permitidas pelo ADR e a preservação da proporção da foto. A aceitação exige verificar as dimensões reais do arquivo final.
- **Conta e credenciais.** A instrução do briefing de gravar a senha no seed conflita com a regra geral de segredos e com o provisionamento administrativo do ADR. O operador provisiona a conta no Supabase Auth com a senha da turma fora do repositório e a vincula ao tenant como colaborador.

## Critérios de aceite

### CA-01 — Lote inicial de equipamentos

Após a carga, uma consulta ao tenant `suporte_ti` encontra um registro para cada um dos 12 patrimônios da lista, com nome e categoria correspondentes, totalizando quatro notebooks, três monitores, três cabos e duas câmeras. Itens preexistentes de outros patrimônios ou tenants são preservados.

### CA-02 — Situação inicial

Em uma carga nova, `TI-0004`, `TI-0007` e `TI-0010` ficam em manutenção. Os outros nove equipamentos da lista ficam disponíveis. Uma consulta confirma a situação de cada patrimônio e que a carga criou zero empréstimos.

### CA-03 — Origem, créditos e revisão visual

Cada patrimônio tem uma foto de origem verificável no Pixabay. O manifesto identifica seu ID de origem, página, autor e licença. Cada foto aprovada passou por revisão visual sem pessoas, marcas, logos legíveis, texto ou telas com conteúdo. A revisão registra quantas candidatas foram rejeitadas e por quê.

### CA-04 — Arquivos finais e acesso público

Os 12 arquivos finais medem exatamente 800 × 600 pixels, confirmados a partir do conteúdo dos arquivos. Cada patrimônio referencia uma foto própria. Uma verificação de IDs de origem e do conteúdo confirma que nenhuma foto foi reutilizada. Cada URL do bucket público do Supabase retorna a imagem correspondente sem autenticação.

### CA-05 — Carga repetível

Após duas execuções com as mesmas entradas em ambiente local ou descartável, permanecem 12 patrimônios distintos da prática no tenant e 12 objetos associados, com os mesmos identificadores e caminhos. Registros e arquivos preexistentes são preservados. Se um registro divergir dos dados iniciais, a carga sinaliza a divergência e preserva seu conteúdo.

### CA-06 — Conta do professor

A conta `marcelo.grilo@institutojef.org.br` está vinculada ao tenant `suporte_ti` como colaborador e tem zero empréstimos no ambiente da entrega. O operador confirma o acesso pelo login existente no link da Vercel sem registrar a senha no relatório. Os testes de empréstimo usam uma conta separada.

### CA-07 — Separação entre preparação e publicação

O agente consegue preparar e validar as imagens e o lote em ambiente local ou descartável sem credenciais de escrita no deploy. O operador executa a carga, o upload e o provisionamento em produção. A evidência identifica quem executou cada etapa e mantém senhas, chaves e tokens fora do código, dos logs e do histórico do Git.

## Evidência para aprovação da implementação

- Execute os testes identificados pelos CAs em ambiente isolado. Para os critérios de produção, registre a confirmação do operador e a evidência sanitizada.
- Use o `verificador-spec` em contexto separado, com a spec, o escopo das mudanças e as evidências disponíveis. Guarde a tabela de resultados para o `ENTREGA.md`.
- Se a solução aprovada exigir alterar o schema, apresente o DDL e o efeito sobre RLS e isolamento antes de gerar a migration. Siga a [regra de migrations](../../../rules/migration.md).
