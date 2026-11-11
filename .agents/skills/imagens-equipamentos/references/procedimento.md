# Preparação local das fotos

Use PowerShell 7 e os executáveis `ffmpeg` e `ffprobe` disponíveis na máquina de preparação. O recorte é central, com proporção preservada. O resultado é JPEG de 800 × 600 pixels. A aplicação e o deploy dispensam essa ferramenta.

## Buscar

Abra a [documentação da API do Pixabay](https://pixabay.com/api/docs/) com sua conta. Carregue a chave no PowerShell sem registrá-la no histórico.

```powershell
$env:PIXABAY_API_KEY = Read-Host 'Chave Pixabay' -MaskInput
$script = '.agents/skills/imagens-equipamentos/scripts/preparar-fotos.ps1'
& $script -Acao Buscar
Remove-Item Env:PIXABAY_API_KEY
```

A busca grava `candidatas.json` e reaproveita o resultado por 24 horas. A pasta de trabalho padrão é `%LOCALAPPDATA%/EmpresTI/imagens-equipamentos`, fora do repositório.

Para ampliar a busca dos itens com pouca cobertura, execute `& $script -Acao Buscar -Ampliar` com a chave na mesma sessão. A lista complementar usa dois termos mais específicos por patrimônio e grava `candidatas-extras.json` separadamente. O preparo consulta os dois arquivos e deduplica pelo par patrimônio e ID do Pixabay.

Para os dois itens ainda em revisão, execute `& $script -Acao Buscar -Foco`. Essa rodada pesquisa o notebook `TI-0004` e a câmera compacta `TI-0012` e grava `candidatas-foco.json`. O preparo também consulta esse arquivo.

## Revisar e preparar

Abra as páginas de origem em `candidatas.json`. Confira o enquadramento, o conteúdo e a licença. Salve `revisao.json` na pasta de trabalho com o nome do responsável, uma aprovação por patrimônio e as rejeições. Repita a estrutura abaixo para os 12 patrimônios, com os IDs reais.

```json
{
  "reviewedBy": "Responsável pela revisão",
  "approved": [{ "patrimony": "TI-0001", "pixabayId": 12345 }],
  "rejected": [{ "patrimony": "TI-0001", "pixabayId": 67890, "reason": "Logo legível" }]
}
```

```powershell
& $script -Acao Preparar
```

O script baixa somente as fotos selecionadas, confere IDs e conteúdo duplicado, mede os JPEGs e gera `lote/manifesto.json`. Uma segunda execução com a mesma revisão confere o lote existente. Para outra seleção, use outra pasta de trabalho. Se os links temporários expirarem, atualize a busca e confirme os IDs.

O operador confere o recorte e envia os JPEGs ao bucket público usando os caminhos do manifesto. Depois confirma cada URL pública sem login. O script acessa o Pixabay e o disco local. O catálogo usará as URLs do Storage e a indicação “Fotos: Pixabay”.
