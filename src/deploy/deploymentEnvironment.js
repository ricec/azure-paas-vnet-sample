const fs = require('fs');
const azureStorage = require('azure-storage');
const _ = require('lodash');
const storageHelper = require('./util/storageHelper');

class DeploymentEnvironment {
  constructor(armClient, config) {
    this._armClient = armClient;
    this._groupName = config.deployment.rg;
    this._deployTags = config.deployment.tags;
    this._storageAccountName = config.deployment.storageAccountName;
    this._templatesContainer = config.deployment.armTemplatesContainer;
    this._templatePath = 'src/templates/modules/microsoft.storage/storage-encrypt-httpsonly.json'
    this._deployStorageDiagnosticsRetention = config.monitoring.retention.deployStorageDiagnostics;
    this._location = config.location;
    this._groupNames = config.resourceGroups;
  }

  async setup() {
    await this._createGroups();
    await this._setupStorage();
  }

  async teardown() {
    await this._deleteGroups();
  }

  async _createGroups() {
    console.log('Creating resource groups...');
    const params = { location: this._location }
    const promises = _.uniq(this._groupNames).map(name => {
      return this._armClient.resourceGroups.createOrUpdate(name, params);
    });

    await Promise.all(promises);
  }

  async _deleteGroups() {
    _.uniq(this._groupNames).reverse().forEach(async name => {
      try {
        await this._armClient.resourceGroups.deleteMethod(name);
      } catch(error) {
        console.log(`Failed to delete resource group ${name}.`);
        console.log(error.message);
      }
    });
  }

  async _setupStorage() {
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
