<#
.SYNOPSIS
  Prépare les images (media-src → media, en WebP) puis les envoie sur le partage Azure Files 'media'.

.DESCRIPTION
  Prérequis : Azure CLI (`az login` fait), Node 24 et `npm install` fait dans web/.
  S'arrête avant tout envoi si une image déclarée manque ou si une image du web n'a pas sa licence.
  Les fichiers déjà présents sur le partage sont remplacés ; rien n'y est supprimé.

.EXAMPLE
  ./infra/upload-media.ps1
#>
param(
    [string]$ResourceGroup = 'rg-phobos'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$root = Join-Path $PSScriptRoot '..'
npm --prefix (Join-Path $root 'web') run media

$mediaFolder = Join-Path $root 'media'
if (-not (Test-Path $mediaFolder)) {
    Write-Host 'Aucune image préparée : rien à envoyer.'
    return
}

$storageName = az storage account list --resource-group $ResourceGroup --query "[?starts_with(name, 'phobos')].name | [0]" -o tsv
$key = az storage account keys list --account-name $storageName --query '[0].value' -o tsv
Write-Host "Envoi de $mediaFolder vers le partage 'media' de $storageName"
# az writes its progress to stderr, which Windows PowerShell 5.1 takes as a failure under 'Stop':
# judge the upload by its exit code instead.
$ErrorActionPreference = 'Continue'
az storage file upload-batch --account-name $storageName --account-key $key `
    --destination media --source $mediaFolder --output none --only-show-errors 2>&1 | Out-Host
$uploadExitCode = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($uploadExitCode -ne 0) { throw "L'envoi des images a échoué (code $uploadExitCode)." }
Write-Host 'Images envoyées.'
