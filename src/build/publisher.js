const storageHelper = require('../util/storageHelper');
const AzCommand = require('../util/azCommand');

class Publisher {
  constructor(deployEnv, config) {
    this._deployEnv = deployEnv;
    this._deployGroupName = config.deployment.rg;
    this._deployStorageAccountName = config.deployment.storageAccountName;
    this._templatesContainer = config.deployment.armTemplatesContainer;
    this._buildOutputDir = `./tmp/${config.deployment.buildOutputTempDir}`;
  }

  async clean() {
    const connectionString = await this._getConnectionString();
    await AzCommand.exec('storage blob delete-batch', {
      source: this._templatesContainer,
      'connection-string': connectionString
    });
  }

  async publish() {
    const connectionString = await this._getConnectionString();
    await AzCommand.exec('storage blob upload-batch', {
      source: this._buildOutputDir,
      destination: this._templatesContainer,
      'connection-string': connectionString
    });
  }

  async _getConnectionString() {
    return await storageHelper.getConnectionString(this._deployGroupName, this._deployStorageAccountName);
  }
}

module.exports = Publisher;
