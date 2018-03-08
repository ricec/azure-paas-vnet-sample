const storageHelper = require('../util/storageHelper');
const azureStorage = require('azure-storage');

class Deployer {
  constructor(armClient, config) {
    this._armClient = armClient;
    this._groupName = config.deployment.rg;
    this._logsStorageDiagnosticsRetention = config.monitoring.retention.logsStorageDiagnostics;
    this._logsStorageAccount = config.monitoring.logsStorageAccountName;
    this._monitoringRg = config.monitoring.rg;
  }

  async deploy(buildContext, phases) {
    const templateUrl = `${buildContext.templatesUrl}main.json?${buildContext.templatesToken}`;

    await this._armClient.deployments.createOrUpdate(
      this._groupName,
      `${this._groupName}-main-deploy`,
      {
        properties: {
          templateLink: { uri: templateUrl },
          parameters: {
            phases: {
              value: phases
            }
          },
          mode: 'Incremental'
        }
      }
    );

    const blobService = await this.getBlobService();
    await storageHelper.configureBlobDiagnostics(blobService, this._logsStorageDiagnosticsRetention);
  }

  async getBlobService() {
    if (!this._blobService) {
      const connectionString = await storageHelper.getConnectionString(this._monitoringRg, this._logsStorageAccount);
      this._blobService = azureStorage.createBlobService(connectionString);
    }

    return this._blobService;
  }
}

module.exports = Deployer;
