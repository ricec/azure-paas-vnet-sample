const fs = require('fs-extra');
const glob = require('glob');
const Compiler = require('./compiler');

class Builder {
  constructor(pipelineContext) {
    const conf = pipelineContext.config;
    this._outputDir = `./tmp/${conf.deployment.buildOutputTempDir}`;
    this._inputDir = conf.deployment.buildInputDir;
    this._compiler = new Compiler(conf);
  }

  async clean() {
    await fs.remove(this._outputDir);
  }

  async build() {
    await fs.copy(this._inputDir, this._outputDir);
    await new Promise((resolve, reject) => {
      glob(`${this._outputDir}/**/*.json`, (err, files) => {
        const promises = files.map(filePath => this._compiler.compile(filePath));
        Promise.all(promises);
        resolve();
      });
    });
  }
}

module.exports = Builder;
