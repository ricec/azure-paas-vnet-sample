const fs = require('fs');
const azureStorage = require('azure-storage');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const storageHelper = require('../util/storageHelper');

class DeploymentEnvironment {
  constructor(armClient, config) {
    this._armClient = armClient;
    this._groupName = config.deployment.rg;
    this._deployTags = config.deployment.tags;
    this._storageAccountName = config.deployment.storageAccountName;
    this._templatesContainer = config.deployment.armTemplatesContainer;
    this._templatePath = 'src/resources/templates/modules/microsoft.storage/storage-encrypt-httpsonly.json'
    this._deployStorageDiagnosticsRetention = config.monitoring.retention.deployStorageDiagnostics;
  }

  async setupStorage() {
    // Deploy storage account
    const template = JSON.parse(fs.readFileSync(this._templatePath, 'utf8'));
    await this._armClient.deployments.createOrUpdate(
      this._groupName,
      `${this._groupName}-storage-deploy`,
      {
        properties: {
          template: template,
          parameters: {
            storageAccountName: { value: this._storageAccountName },
            tags: { value: this._deployTags }
          },
          mode: 'Incremental'
        }
      }
    );

    const blobService = await this.getBlobService();

    // Create templates container
    const createContainerPromise = new Promise((resolve, reject) => {
      blobService.createContainerIfNotExists(
        this._templatesContainer,
        (err, result, response) => { err ? reject(err) : resolve(result) });
    });
    const diagnosticsPromise = storageHelper.configureBlobDiagnostics(blobService, this._deployStorageDiagnosticsRetention);

    await Promise.all([createContainerPromise, diagnosticsPromise]);
  }

  async getBlobService() {
    if (!this._blobService) {
      const connectionString = await storageHelper.getConnectionString(this._groupName, this._storageAccountName);
      this._blobService = azureStorage.createBlobService(connectionString);
    }

    return this._blobService;
  }

  async getTemplatesUrl() {
    const service = await this.getBlobService();
    return `${service.getUrl(this._templatesContainer)}/`;
  }

  async getTemplatesToken() {
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 60);

    const permissions = azureStorage.BlobUtilities.SharedAccessPermissions;
    var sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: permissions.READ + permissions.WRITE,
        Start: startDate,
        Expiry: expiryDate
      }
    };

    const service = await this.getBlobService();
    return service.generateSharedAccessSignature(
      this._templatesContainer,
      null,
      sharedAccessPolicy
    );
  }
}

module.exports = DeploymentEnvironment;
