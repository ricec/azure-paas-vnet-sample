const Builder = require('./builder');
const Publisher = require('./publisher');
const Deployer = require('./deployer');

class Pipeline {
  constructor(pipelineContext, phases) {
    this._pipelineContext = pipelineContext;
    this._phases = phases;
  }

  async run() {
    await this._pipelineContext.prepareConfig();
    await this.build();
    await this.publish();
    await this.deploy();
  }

  async build() {
    console.log('Building templates...');
    const builder = new Builder(this._pipelineContext);
    await builder.clean();
    await builder.build();
  }

  async publish() {
    console.log('Publishing templates to Azure storage...');
    const publisher = new Publisher(this._pipelineContext);
    await publisher.clean();
    await publisher.publish();
  }

  async deploy() {
    console.log('Deploying resources...');
    const deployer = new Deployer(this._pipelineContext);
    await deployer.deploy(this._phases);
  }
}

module.exports = Pipeline;
