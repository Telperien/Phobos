// Phobos en production : une App Service Linux (.NET 10) qui sert l'API, le site et le catalogue
// (fichiers content/phobias/ embarqués dans l'API, sans base de données), et un partage Azure Files monté pour les images.
// Déploiement : voir infra/bootstrap.ps1.

@description('Préfixe des noms de ressources (minuscules, sans tiret pour le stockage).')
@minLength(3)
@maxLength(12)
param prefix string = 'phobos'

param location string = resourceGroup().location

@description('Plan App Service existant à partager (id complet, même région). Vide : un plan dédié est créé.')
param appServicePlanId string = ''

@description('Taille du plan dédié, si aucun plan existant n\'est fourni.')
param appServiceSku string = 'B1'

var suffix = uniqueString(resourceGroup().id)
var webAppName = '${prefix}-${suffix}'
var mediaMountPath = '/mounts/media'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: take('${prefix}media${suffix}', 24)
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource mediaShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileService
  name: 'media'
  properties: { shareQuota: 5 }
}

// Plan existant : seulement référencé, jamais modifié (ni taille, ni réglages, ni autres sites).
resource plan 'Microsoft.Web/serverfarms@2024-04-01' = if (empty(appServicePlanId)) {
  name: '${prefix}-plan-${suffix}'
  location: location
  kind: 'linux'
  sku: { name: appServiceSku }
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: empty(appServicePlanId) ? plan.id : appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      http20Enabled: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/api/health'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'Media__RootPath', value: mediaMountPath }
        // Absolute links (canonical, language versions, link previews) behind the App Service proxy.
        { name: 'Site__PublicUrl', value: 'https://${webAppName}.azurewebsites.net/' }
      ]
    }
  }
}

resource mediaMount 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'azurestorageaccounts'
  properties: {
    media: {
      type: 'AzureFiles'
      accountName: storage.name
      shareName: mediaShare.name
      mountPath: mediaMountPath
      accessKey: storage.listKeys().keys[0].value
    }
  }
}

output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output storageAccountName string = storage.name
