param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("staging", "prod")]
  [string]$EnvName,
  [Parameter(Mandatory = $false)]
  [string]$Target = "previous"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..\\..")

bash (Join-Path $scriptDir "rollback.sh") --env $EnvName --to $Target
