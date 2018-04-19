const armResource = require("azure-arm-resource");
const Auth = require('./util/auth');
const DeploymentEnvironment = require('./deploymentEnvironment');
const secretsHelper = require('./util/secretsHelper');

class PipelineContext {
  constructor(config, isInitialSetup) {
    this.config = config;
    this.isInitialSetup = isInitialSetup;
  }

  async _initialize() {
    console.log('Authenticating & acquiring account info...');
    this.account = await new Auth().loadFromCli();
    this.armClient = new armResource.ResourceManagementClient(
      this.account.credentials,
      this.account.id
    );

    this.deployEnv = new DeploymentEnvironment(this.armClient, this.config);
    this.config.templatesUrl =  await this.deployEnv.getTemplatesUrl();
    this.config.templatesToken = await this.deployEnv.getTemplatesToken();

    // During initial setup, these certificates don't yet exist, so we can't add their public keys to the build context
    if (!this.isInitialSetup) {
      const keyVaultName = this.config.secrets.keyVaultName;
      this.config.apiSslPublicKey = await secretsHelper.getCertPublicKey(keyVaultName, this.config.app.apim.cert.name);
      this.config.aseSslPublicKey = await secretsHelper.getCertPublicKey(keyVaultName, this.config.app.ase.cert.name);
    }
  }
}

module.exports = {
  acquire: async function(config) {
    const ctx = new PipelineContext(config, false);
    await ctx._initialize();

    return ctx;
  },
  acquireForSetup: async function(config) {
    const ctx = new PipelineContext(config, true);
    await ctx._initialize();

    return ctx;
  }
};
