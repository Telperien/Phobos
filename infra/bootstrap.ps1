<#
.SYNOPSIS
  Met en place Phobos sur Azure : ressources (main.bicep), identité GitHub Actions sans secret (OIDC),
  variables du dépôt, envoi des images.

.DESCRIPTION
  Prérequis : Azure CLI (`az login` fait, bon abonnement sélectionné), GitHub CLI (`gh auth login`).
  Relançable : Bicep ne recrée rien, l'identité et ses droits sont réutilisés.
  Pas de base de données : le catalogue est embarqué dans l'API (content/phobias/).
  Pour envoyer seulement de nouvelles images : ./infra/upload-media.ps1

.EXAMPLE
  ./infra/bootstrap.ps1
  ./infra/bootstrap.ps1 -SkipMedia
  ./infra/bootstrap.ps1 -AppServicePlanId (az appservice plan show -g rg-yvelines-projet2 -n asp-yvelines2 --query id -o tsv)
#>
param(
    [string]$ResourceGroup = 'rg-phobos',
    [string]$Location = 'francecentral',
    [string]$Repo = 'Telperien/Phobos',
    [string]$AppServicePlanId = '',
    [switch]$SkipMedia
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$subscriptionId = az account show --query id -o tsv
$tenantId = az account show --query tenantId -o tsv
Write-Host "Abonnement : $(az account show --query name -o tsv) ($subscriptionId)"

Write-Host "1/5 Groupe de ressources $ResourceGroup ($Location)"
az group create --name $ResourceGroup --location $Location --output none

Write-Host '2/5 Ressources (App Service, stockage des images)'
$outputs = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file (Join-Path $PSScriptRoot 'main.bicep') `
    --parameters "appServicePlanId=$AppServicePlanId" `
    --query properties.outputs -o json | ConvertFrom-Json
$webAppName = $outputs.webAppName.value
$webAppId = az webapp show --resource-group $ResourceGroup --name $webAppName --query id -o tsv

Write-Host '3/5 Identité de déploiement GitHub Actions (OIDC, sans secret)'
$appName = "github-$($Repo.Replace('/', '-'))-deploy"
$clientId = az ad app list --display-name $appName --query '[0].appId' -o tsv
if (-not $clientId) {
    $clientId = az ad app create --display-name $appName --query appId -o tsv
    az ad sp create --id $clientId --output none
}
$subject = "repo:${Repo}:environment:production"
$existing = az ad app federated-credential list --id $clientId --query "[?subject=='$subject'] | length(@)" -o tsv
if ($existing -eq '0') {
    $credential = @{
        name      = 'github-production'
        issuer    = 'https://token.actions.githubusercontent.com'
        subject   = $subject
        audiences = @('api://AzureADTokenExchange')
    } | ConvertTo-Json -Compress
    $credentialFile = New-TemporaryFile
    Set-Content -Path $credentialFile -Value $credential
    az ad app federated-credential create --id $clientId --parameters "@$credentialFile" --output none
    Remove-Item $credentialFile
}
# Droit limité au seul site : l'identité peut déployer, rien d'autre.
$principalId = az ad sp show --id $clientId --query id -o tsv
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal `
    --role 'Website Contributor' --scope $webAppId --output none

Write-Host "4/5 Variables du dépôt $Repo et environnement production"
gh api --method PUT "repos/$Repo/environments/production" --silent
gh variable set AZURE_CLIENT_ID --repo $Repo --body $clientId
gh variable set AZURE_TENANT_ID --repo $Repo --body $tenantId
gh variable set AZURE_SUBSCRIPTION_ID --repo $Repo --body $subscriptionId
gh variable set AZURE_WEBAPP_NAME --repo $Repo --body $webAppName

if ($SkipMedia) {
    Write-Host '5/5 Images : ignoré (-SkipMedia)'
} else {
    Write-Host '5/5 Images'
    & (Join-Path $PSScriptRoot 'upload-media.ps1') -ResourceGroup $ResourceGroup
}

Write-Host ''
Write-Host "Prêt. Site : $($outputs.webAppUrl.value)"
Write-Host 'Le site sera en ligne au premier passage du workflow CI/CD sur main (ou Actions > CI/CD > Run workflow).'
