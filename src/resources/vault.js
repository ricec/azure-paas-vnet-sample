const fs = require('fs');
const AzCommand = require('../util/azCommand');

class Vault {
  constructor(config) {
    this._keyVaultName = config.secrets.keyVaultName;
    this._apiCert = config.app.apim.cert;
    this._aseCert = config.app.ase.cert;
  }

  async grantCertAccess(username) {
    await AzCommand.exec('keyvault set-policy', {
      name: this._keyVaultName,
      upn: username,
      'certificate-permissions': ['get', 'upload']
    });
  }

  async setupSecrets() {
    await this._setupCert(this._apiCert);
    await this._setupCert(this._aseCert);
  }

  async getCertPublicKey(secretName) {
    return await AzCommand.exec('keyvault certificate show', {
      name: secretName,
      'vault-name': this._keyVaultName,
      query: 'cer',
      output: 'tsv'
    });
  }

  async _setupCert(certConfig) {
    const policyJson = JSON.stringify(this._getCertPolicy(certConfig.cn, certConfig.san));
    await AzCommand.exec('keyvault certificate create', {
      name: certConfig.name,
      policy: policyJson,
      'vault-name': this._keyVaultName
    });
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
