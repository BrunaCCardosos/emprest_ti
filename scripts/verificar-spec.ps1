param(
  [Parameter(Mandatory)][string] $Spec,
  [Parameter(Mandatory)][string] $Escopo
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if ($Spec -notmatch '^docs/specs/\d{3}-[a-z0-9-]+/spec\.md$' -or
    !(Test-Path -LiteralPath (Join-Path $root $Spec) -PathType Leaf)) {
  throw 'Informe o caminho de uma spec deste repositório.'
}

$prompt = @"
Aja conforme agents/verificador-spec.md.
Spec: $Spec
Escopo: $Escopo
Use somente leitura e evidências sanitizadas. Preserve a execução isolada.
Não leia arquivos .env, não solicite credenciais e não use acesso de produção.
"@
$options = @('--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '--disable', 'apps', '--disable', 'plugins', '--disable', 'request_permissions_tool', '-C', $root)
& codex @options $prompt
exit $LASTEXITCODE
