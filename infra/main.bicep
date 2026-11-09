// Phobos en production : une App Service Linux (.NET 10) qui sert l'API et le site,
// PostgreSQL Flexible Server pour le catalogue, un partage Azure Files monté pour les images.
// Déploiement : voir infra/bootstrap.sh.

@description('Préfixe des noms de ressources (minuscules, sans tiret pour le stockage).')
@minLength(3)
@maxLength(12)
param prefix string = 'phobos'

param location string = resourceGroup().location

@description('Administrateur PostgreSQL. L\'API se connecte avec ce compte (v1).')
param postgresAdminLogin string = 'phobosadmin'

@secure()
param postgresAdminPassword string

@description('Plan App Service. B1 suffit pour démarrer ; passer en B2 si la mémoire manque.')
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

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: '${prefix}-pg-${suffix}'
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '17'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    storage: { storageSizeGB: 32, autoGrow: 'Disabled' }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

// Autorise les services Azure (dont l'App Service) ; aucune IP publique n'est ouverte.
resource postgresAzureAccess 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: postgres
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: 'phobos'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
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
    serverFarmId: plan.id
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
        { name: 'Database__MigrateOnStartup', value: 'true' }
        { name: 'Database__SeedOnStartup', value: 'true' }
        { name: 'Media__RootPath', value: mediaMountPath }
      ]
      connectionStrings: [
        {
          // Type Custom : exposé en CUSTOMCONNSTR_Phobos, lu par .NET comme ConnectionStrings:Phobos.
          name: 'Phobos'
          type: 'Custom'
          connectionString: 'Host=${postgres.properties.fullyQualifiedDomainName};Database=${database.name};Username=${postgresAdminLogin};Password=${postgresAdminPassword};Ssl Mode=Require'
        }
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
output postgresServerName string = postgres.name
