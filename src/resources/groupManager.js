const _ = require('lodash');

class GroupManager {
  constructor(armClient, config) {
    this._location = config.location;
    this._groupNames = [
      config.deployment.rg,
      config.secrets.rg,
      config.monitoring.rg,
      config.networking.rg,
      config.app.rg
    ];
    this._client = armClient;
  }

  async createGroups() {
    const params = { location: this._location }
    const promises = _.uniq(this._groupNames).map(name => {
      return this._client.resourceGroups.createOrUpdate(name, params);
    });

    await Promise.all(promises);
  }

  async deleteGroups() {
    _.uniq(this._groupNames).reverse().forEach(async name => {
      try {
        await this._client.resourceGroups.deleteMethod(name);
      } catch(error) {
        console.log(`Failed to delete resource group ${name}.`);
        console.log(error.message);
      }
    });
  }
}

module.exports = GroupManager;
