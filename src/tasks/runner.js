const armResource = require("azure-arm-resource");
const Auth = require('../util/auth');
const config = require('../config');
const { DeploymentEnvironment, GroupManager, Vault, Deployer } = require('../resources');
const { Builder, Publisher } = require('../build');

class Runner {
  async _initialize(isInitialSetup) {
    console.log('Authenticating & acquiring account info...');
    this.account = await new Auth().loadFromCli();
    this.armClient = new armResource.ResourceManagementClient(
      this.account.credentials,
      this.account.id
    );
    this.deployEnv = new DeploymentEnvironment(this.armClient, config);
    this.vault = new Vault(config);
  }

  async runSetup() {
    await this._initialize(true);

    console.log('Creating resource groups...');
    const manager = new GroupManager(this.armClient, config);
    await manager.createGroups();

    console.log('Setting up deployment environment...');
    await this.deployEnv.setupStorage();

    const buildContext = await this._getBuildContext();
    await this._publishTemplates(buildContext);

    console.log('Deploying initial resources...');
    const deployer = new Deployer(this.armClient, config);
    await deployer.deploy(buildContext, ['init']);

    console.log('Setting up secrets...');
    await this.vault.grantCertAccess(this.account.user.name);
    await this.vault.setupSecrets();
  }

  async runDeploy() {
    await this._initialize(false);
    await this.vault.grantCertAccess(this.account.user.name);

    // Include public key in build context for use in deployment
    const buildContext = await this._getBuildContext();
    buildContext.apiSslPublicKey = await this.vault.getCertPublicKey(config.app.apim.cert.name);
    buildContext.aseSslPublicKey = await this.vault.getCertPublicKey(config.app.ase.cert.name);

    await this._publishTemplates(buildContext);

    console.log('Deploying resources from templates...');
    const deployer = new Deployer(this.armClient, config);
    await deployer.deploy(buildContext, ['deploy']);
  }

  async runTeardown() {
    await this._initialize();

    console.log('Deleting resources...');
    const manager = new GroupManager(this.armClient, config);
    await manager.deleteGroups();
  }

  async _publishTemplates(buildContext) {
    console.log('Building templates...');
    var builder = new Builder(buildContext, config);
    await builder.clean();
    await builder.build();

    console.log('Publishing templates to Azure storage...');
    var publisher = new Publisher(this.deployEnv, config);
    await publisher.clean();
    await publisher.publish();
  }

  async _getBuildContext() {
    if (!this._buildContext) {
      const templatesUrl = await this.deployEnv.getTemplatesUrl();
      const templatesToken = await this.deployEnv.getTemplatesToken();

      this._buildContext = {
        templatesUrl: templatesUrl,
        templatesToken: templatesToken,
        subscriptionId: this.account.id,
        isInitialSetup: this.isInitialSetup
      };
    }

    return this._buildContext;
  }
}

module.exports = new Runner();
