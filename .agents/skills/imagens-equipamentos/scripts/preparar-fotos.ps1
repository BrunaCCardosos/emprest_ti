#requires -Version 7.0
param(
  [Parameter(Mandatory)]
  [ValidateSet('Buscar', 'Preparar')]
  [string] $Acao,
  [switch] $Ampliar,
  [switch] $Foco,
  [string] $Pasta = (Join-Path $env:LOCALAPPDATA 'EmpresTI/imagens-equipamentos')
)

$ErrorActionPreference = 'Stop'
$equipamentos = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../references/equipamentos.json') -Raw | ConvertFrom-Json
$Pasta = [IO.Path]::GetFullPath($Pasta)
$candidatasPath = Join-Path $Pasta 'candidatas.json'
$extrasPath = Join-Path $Pasta 'candidatas-extras.json'
$focoPath = Join-Path $Pasta 'candidatas-foco.json'

function Test-PixabayUrl([uri] $Url) {
  $Url -and $Url.IsAbsoluteUri -and $Url.Scheme -eq 'https' -and
    ($Url.Host -eq 'pixabay.com' -or $Url.Host.EndsWith('.pixabay.com')) -and !$Url.UserInfo
}

if ($Acao -eq 'Buscar') {
  if ($Ampliar -and $Foco) { throw 'Use uma opção de busca por vez.' }
  $buscas = $equipamentos
  $saida = $candidatasPath
  $limite = 8
  if ($Ampliar) {
    $buscas = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../references/buscas-complementares.json') -Raw | ConvertFrom-Json
    $saida = $extrasPath
    $limite = 12
  } elseif ($Foco) {
    $buscas = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../references/buscas-finais.json') -Raw | ConvertFrom-Json
    $saida = $focoPath
    $limite = 20
  }
  if ((Test-Path -LiteralPath $saida -PathType Leaf) -and
      (Get-Item -LiteralPath $saida).LastWriteTimeUtc -gt [datetime]::UtcNow.AddHours(-24)) {
    Write-Output $saida
    return
  }
  if ([string]::IsNullOrWhiteSpace($env:PIXABAY_API_KEY)) {
    throw 'Defina PIXABAY_API_KEY nesta sessão do PowerShell.'
  }
  $key = [uri]::EscapeDataString($env:PIXABAY_API_KEY.Trim())
  $candidatas = @(foreach ($item in $buscas) {
    $query = [uri]::EscapeDataString($item.query)
    try {
      $result = Invoke-RestMethod -Uri "https://pixabay.com/api/?key=$key&q=$query&image_type=photo&orientation=horizontal&min_width=800&min_height=600&safesearch=true&per_page=$limite" -MaximumRedirection 0 -TimeoutSec 30
    } catch {
      throw "Falha na busca do Pixabay para $($item.patrimony). Confira a chave e a conexão."
    }
    foreach ($hit in $result.hits) {
      if ((Test-PixabayUrl $hit.pageURL) -and (Test-PixabayUrl $hit.largeImageURL)) {
        [ordered]@{
          patrimony = $item.patrimony
          pixabayId = $hit.id
          author = $hit.user
          sourceUrl = $hit.pageURL
          downloadUrl = $hit.largeImageURL
        }
      }
    }
  })
  [void][IO.Directory]::CreateDirectory($Pasta)
  $unicas = @($candidatas | Group-Object -Property { "$($_.patrimony):$($_.pixabayId)" } | ForEach-Object { $_.Group[0] })
  ConvertTo-Json -InputObject $unicas -Depth 4 | Set-Content -LiteralPath $saida -Encoding utf8
  Write-Output $saida
  return
}

$null = Get-Command ffmpeg, ffprobe -CommandType Application
$revisao = Get-Content -LiteralPath (Join-Path $Pasta 'revisao.json') -Raw | ConvertFrom-Json
$approved = @($revisao.approved)
if ([string]::IsNullOrWhiteSpace($revisao.reviewedBy) -or $approved.Count -ne $equipamentos.Count) {
  throw 'Registre o responsável e uma aprovação para cada patrimônio.'
}
$rejected = @($revisao.rejected | Where-Object { $_ })
foreach ($item in $rejected) {
  if ($item.patrimony -notin $equipamentos.patrimony -or $item.pixabayId -notmatch '^[1-9]\d*$' -or
      [string]::IsNullOrWhiteSpace($item.reason) -or $item.pixabayId -in $approved.pixabayId) {
    throw 'Há uma rejeição incompleta ou que conflita com uma aprovação.'
  }
}

$ids = [Collections.Generic.HashSet[string]]::new()
foreach ($item in $equipamentos) {
  $match = @($approved | Where-Object patrimony -CEQ $item.patrimony)
  if ($match.Count -ne 1 -or $match[0].pixabayId -notmatch '^[1-9]\d*$' -or !$ids.Add([string]$match[0].pixabayId)) {
    throw "Seleção ausente, inválida ou repetida para $($item.patrimony)."
  }
}

$reviewHash = (Get-FileHash -LiteralPath (Join-Path $Pasta 'revisao.json')).Hash
$lote = Join-Path $Pasta 'lote'
if (Test-Path -LiteralPath $lote) {
  $manifesto = Get-Content -LiteralPath (Join-Path $lote 'manifesto.json') -Raw | ConvertFrom-Json
  if ($manifesto.reviewHash -cne $reviewHash -or @($manifesto.items).Count -ne $equipamentos.Count) {
    throw 'O lote existente não corresponde à revisão. Use outra pasta de trabalho.'
  }
  foreach ($item in $equipamentos) {
    $entry = @($manifesto.items | Where-Object patrimony -CEQ $item.patrimony)
    $file = Join-Path $lote "$($item.patrimony).jpg"
    if ($entry.Count -ne 1 -or (Get-FileHash -LiteralPath $file).Hash -cne $entry[0].sha256) {
      throw "Arquivo alterado no lote existente: $($item.patrimony)."
    }
  }
  Write-Output (Join-Path $lote 'manifesto.json')
  return
}

$candidatas = @(foreach ($path in @($candidatasPath, $extrasPath, $focoPath)) {
  if (Test-Path -LiteralPath $path -PathType Leaf) {
    Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
  }
}) | Group-Object -Property { "$($_.patrimony):$($_.pixabayId)" } | ForEach-Object { $_.Group[-1] }
$stage = Join-Path $Pasta ('preparo-' + [guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($stage)
$originais = [Collections.Generic.HashSet[string]]::new()
$finais = [Collections.Generic.HashSet[string]]::new()
try {
  $items = foreach ($item in $equipamentos) {
    $id = ($approved | Where-Object patrimony -CEQ $item.patrimony).pixabayId
    $candidate = @($candidatas | Where-Object { $_.patrimony -ceq $item.patrimony -and $_.pixabayId -eq $id })
    if ($candidate.Count -ne 1 -or [string]::IsNullOrWhiteSpace($candidate[0].author) -or
        !(Test-PixabayUrl $candidate[0].sourceUrl) -or !(Test-PixabayUrl $candidate[0].downloadUrl)) {
      throw "Origem ou crédito inválido para $($item.patrimony)."
    }
    $source = Join-Path $stage "$($item.patrimony).source"
    $output = Join-Path $stage "$($item.patrimony).jpg"
    try {
      Invoke-WebRequest -Uri $candidate[0].downloadUrl -OutFile $source -MaximumRedirection 0 -TimeoutSec 30
    } catch {
      throw "Falha ao baixar a foto aprovada de $($item.patrimony). Confira se a busca ainda está válida."
    }
    if (!$originais.Add((Get-FileHash -LiteralPath $source).Hash)) {
      throw "Foto de origem duplicada para $($item.patrimony)."
    }
    ffmpeg -nostdin -loglevel error -i $source -vf 'scale=800:600:force_original_aspect_ratio=increase,crop=800:600,setsar=1' -frames:v 1 -map_metadata -1 -q:v 2 $output
    if ($LASTEXITCODE -ne 0) { throw "Falha ao preparar $($item.patrimony)." }
    $size = ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of 'csv=s=x:p=0' $output
    if ($LASTEXITCODE -ne 0 -or $size -cne '800x600') { throw "Dimensões inválidas para $($item.patrimony)." }
    $hash = (Get-FileHash -LiteralPath $output).Hash
    if (!$finais.Add($hash)) { throw "Foto final duplicada para $($item.patrimony)." }
    [IO.File]::Delete($source)
    [ordered]@{
      patrimony = $item.patrimony
      photoPath = "suporte_ti/$($item.patrimony).jpg"
      pixabayId = $id
      author = $candidate[0].author
      sourceUrl = $candidate[0].sourceUrl
      license = 'Pixabay Content License'
      licenseUrl = 'https://pixabay.com/service/license-summary/'
      width = 800
      height = 600
      sha256 = $hash
    }
  }
  @{
    reviewedBy = $revisao.reviewedBy
    reviewHash = $reviewHash
    rejected = $rejected
    items = @($items)
  } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $stage 'manifesto.json') -Encoding utf8
  New-Item -ItemType Directory -Path $lote | Out-Null
  try {
    foreach ($item in $equipamentos) {
      $name = "$($item.patrimony).jpg"
      [IO.File]::Copy((Join-Path $stage $name), (Join-Path $lote $name))
    }
    [IO.File]::Copy((Join-Path $stage 'manifesto.json'), (Join-Path $lote 'manifesto.json'))
  } catch {
    foreach ($file in [IO.Directory]::EnumerateFiles($lote)) { [IO.File]::Delete($file) }
    [IO.Directory]::Delete($lote)
    throw
  }
} finally {
  if ([IO.Directory]::Exists($stage)) {
    foreach ($file in [IO.Directory]::EnumerateFiles($stage)) { [IO.File]::Delete($file) }
    [IO.Directory]::Delete($stage)
  }
}
Write-Output (Join-Path $lote 'manifesto.json')
