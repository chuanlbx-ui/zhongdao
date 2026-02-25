param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("staging", "prod")]
  [string]$EnvName,
  [Parameter(Mandatory = $true)]
  [string]$ImageTag
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..\\..")

bash (Join-Path $scriptDir "deploy.sh") --env $EnvName --image-tag $ImageTag
