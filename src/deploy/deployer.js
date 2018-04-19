const storageHelper = require('./util/storageHelper');
const azureStorage = require('azure-storage');

class Deployer {
  constructor(pipelineContext) {
    const conf = pipelineContext.config;
    this._armClient = pipelineContext.armClient;
    this._templateUrl = `${conf.templatesUrl}main.json?${conf.templatesToken}`;
    this._groupName = conf.deployment.rg;
    this._logsStorageDiagnosticsRetention = conf.monitoring.retention.logsStorageDiagnostics;
    this._logsStorageAccount = conf.monitoring.logsStorageAccountName;
    this._monitoringRg = conf.monitoring.rg;
  }

  async deploy(phases) {
    await this._armClient.deployments.createOrUpdate(
      this._groupName,
      `${this._groupName}-main-deploy`,
      {
        properties: {
          templateLink: { uri: this._templateUrl },
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
