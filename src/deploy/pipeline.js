const Builder = require('./builder');
const Publisher = require('./publisher');
const Deployer = require('./deployer');

class Pipeline {
  constructor(pipelineContext, phases) {
    this._builder = new Builder(pipelineContext);
    this._publisher = new Publisher(pipelineContext);
    this._deployer = new Deployer(pipelineContext);
    this._phases = phases;
  }

  async run() {
    await this.build();
    await this.publish();
    await this.deploy();
  }

  async build() {
    console.log('Building templates...');
    await this._builder.clean();
    await this._builder.build();
  }

  async publish() {
    console.log('Publishing templates to Azure storage...');
    await this._publisher.clean();
    await this._publisher.publish();
  }

  async deploy() {
    console.log('Deploying resources...');
    await this._deployer.deploy(this._phases);
  }
}

module.exports = Pipeline;
