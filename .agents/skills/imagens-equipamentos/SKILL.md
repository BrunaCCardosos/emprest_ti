---
name: imagens-equipamentos
description: Prepara fotos de equipamentos do EmpresTI para a spec 002. Use para buscar no Pixabay, organizar a revisão visual, gerar arquivos de 800 × 600 e montar o manifesto de créditos.
---

# Imagens de equipamentos

1. Leia a [spec 002](../../../docs/specs/002-dados-iniciais/spec.md) e o [procedimento local](references/procedimento.md).
2. Execute a busca com o script da skill. Use apenas a API do Pixabay e a chave disponibilizada na variável de sessão `PIXABAY_API_KEY`. Mantenha a chave, o cache e as fotos de trabalho fora do Git.
3. Mostre as páginas de origem ao operador. Aprove uma foto por patrimônio após revisão visual. Rejeite pessoas, marcas, logotipos legíveis, texto e telas com conteúdo. Registre os IDs rejeitados e os motivos.
4. Prepare o lote com os IDs aprovados. O script confere unicidade, dimensões e créditos e gera caminhos estáveis por patrimônio. O operador confere o enquadramento final antes do upload.
5. Entregue os arquivos e o manifesto ao operador. O upload ao bucket público e a conferência das URLs cabem ao operador. Mantenha o ambiente da skill sem credenciais de escrita no deploy.

Informe quantas fotos foram aprovadas, quantas foram rejeitadas e por quê. Distinga as validações automatizadas da revisão visual.
