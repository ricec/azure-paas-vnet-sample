const MsRest = require('ms-rest-azure');
const Adal = require('adal-node');
const os = require('os');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class Auth {
  constructor(tokenFilePath) {
    this._tokenFile = tokenFilePath || `${os.homedir()}/.azure/accessTokens.json`;
  }

  async loadFromCli() {
    const account = await this._loadAccount();
    const tokenCache = await this._generateTokenCache();
    account.credentials = new MsRest.DeviceTokenCredentials({
      username: account.user.name,
      domain: account.tenantId,
      tokenCache: tokenCache
    });

    return account;
  }

  async _loadAccount() {
    // Make sure we have a fresh access token
    await exec('az account get-access-token');
    const accountString = (await exec('az account show')).stdout;
    return JSON.parse(accountString);
  }

  async _generateTokenCache() {
    const tokens = this._readTokens();
    const cache = new Adal.MemoryCache();

    return await new Promise((resolve, reject) => {
      cache.add(tokens, error => error ? reject(error) : resolve(cache));
    });
  }

  _readTokens() {
    if (fs.existsSync(this._tokenFile)) {
      try {
        return JSON.parse(fs.readFileSync(this._tokenFile));
      } catch(error) {
        console.log(`Error parsing token file ${this._tokenFile}. Please make sure the Azure CLI is installed and you have logged in via az login.`);
        throw error;
      }
    }
  }
}

module.exports = Auth;
