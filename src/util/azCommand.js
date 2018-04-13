const _ = require('lodash');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class AzCommand {
  static async exec(command, args) {
    const argString = _.entries(args).map(arr => {
      const values = Array.isArray(arr[1]) ? arr[1] : Array(arr[1]);
      const valueString = values.map(str => `"${str}"`).join(' ');

      return `--${arr[0]} ${valueString}`
    }).join(' ');
    return (await exec(`az ${command} ${argString}`)).stdout;
  }
}

module.exports = AzCommand;
