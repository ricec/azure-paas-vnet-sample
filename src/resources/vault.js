const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class Vault {
  constructor(config) {
    this._keyVaultName = config.secrets.keyVaultName;
    this._apiCert = config.app.apim.cert;
    this._aseCert = config.app.ase.cert;
  }

  async grantCertAccess(username) {
    const cliCommand = `az keyvault set-policy \\
      --name "${this._keyVaultName}" \\
      --upn "${username}" \\
      --certificate-permissions get import`;

    await exec(cliCommand);
  }

  async setupSecrets() {
    await this._setupCert(this._apiCert);
    await this._setupCert(this._aseCert);
  }

  async getCertPublicKey(secretName) {
    const cliCommand = `az keyvault certificate show \\
      --name "${secretName}" \\
      --vault-name "${this._keyVaultName}" \\
      --query cer \\
      --output tsv`;

    return (await exec(cliCommand)).stdout;
  }

  async _setupCert(certConfig) {
    const policyJson = JSON.stringify(this._getCertPolicy(certConfig.cn, certConfig.san));
    const cliCommand = `az keyvault certificate create \\
      --name "${certConfig.name}" \\
      --policy '${policyJson}' \\
      --vault-name "${this._keyVaultName}"`;

    await exec(cliCommand);
  }

  _getCertPolicy(commonName, altName) {
    return {
      issuerParameters: {
        name: "Self"
      },
      keyProperties: {
        exportable: true,
        keySize: 4096,
        keyType: "RSA",
        reuseKey: false
      },
      x509CertificateProperties: {
        subject: `CN=${commonName}`,
        subjectAlternativeNames: {
          dnsNames: [altName]
        },
        validityInMonths: 12
      }
    }
  }
}

module.exports = Vault;
