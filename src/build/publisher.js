const util = require('util');
const exec = util.promisify(require('child_process').exec);
const storageHelper = require('../util/storageHelper');

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
    const cliCommand = `az storage blob delete-batch \\
      --source "${this._templatesContainer}" \\
      --connection-string "${connectionString}"`;

    await exec(cliCommand);
  }

  async publish() {
    const connectionString = await this._getConnectionString();
    const cliCommand = `az storage blob upload-batch \\
      --source "${this._buildOutputDir}" \\
      --destination "${this._templatesContainer}" \\
      --connection-string "${connectionString}"`

    await exec(cliCommand);
  }

  async _getConnectionString() {
    return await storageHelper.getConnectionString(this._deployGroupName, this._deployStorageAccountName);
  }
}

module.exports = Publisher;
