const fs = require('fs-extra');
const glob = require('glob');
const Compiler = require('./compiler');

class Builder {
  constructor(buildContext, config) {
    this._outputDir = `./tmp/${config.deployment.buildOutputTempDir}`;
    this._inputDir = config.deployment.buildInputDir;
    this._compiler = new Compiler(Object.assign({}, config, buildContext));
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
