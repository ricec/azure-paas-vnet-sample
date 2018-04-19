const storageHelper = require('../util/storageHelper');
const AzCommand = require('../util/azCommand');

class Publisher {
  constructor(pipelineContext) {
    const conf = pipelineContext.config;
    this._deployGroupName = conf.deployment.rg;
    this._deployStorageAccountName = conf.deployment.storageAccountName;
    this._templatesContainer = conf.deployment.armTemplatesContainer;
    this._buildOutputDir = `./tmp/${conf.deployment.buildOutputTempDir}`;
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
