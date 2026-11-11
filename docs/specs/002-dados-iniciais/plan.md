# Plano — 002 Dados iniciais

1. Acrescentar a categoria `CABLE` e o campo opcional `photo_path` em uma migration nova do Prisma. Validar no PostgreSQL local a categoria, a coluna, a preservação dos registros e a continuidade do RLS e da chave de patrimônio por tenant (CA-01, CA-04, CA-05).
2. Preparar a skill `imagens-equipamentos`. Usar o FFmpeg e o ffprobe já disponíveis na máquina para recortar e conferir as dimensões, sem adicionar dependência à aplicação. Validar origem, revisão visual, unicidade e manifesto de créditos. Produzir os arquivos localmente (CA-03, CA-04, CA-07).
3. Preparar e testar a carga repetível do tenant `suporte_ti` e dos 12 equipamentos. Preservar registros existentes, sinalizar divergências e comprovar que a carga cria zero empréstimos (CA-01, CA-02, CA-05).
4. Entregar ao operador o procedimento de carga, upload e provisionamento da conta do professor. Registrar evidências sanitizadas do acesso, das fotos públicas e da repetição da carga (CA-04 a CA-07).
5. Encaminhar a implementação e as evidências ao `verificador-spec` e registrar o resultado da spec no `ENTREGA.md`.
