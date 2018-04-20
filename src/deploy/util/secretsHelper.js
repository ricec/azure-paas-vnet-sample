const AzCommand = require('./azCommand');

class SecretsHelper {
  async grantCertAccess(keyVaultName, username) {
    await AzCommand.exec('keyvault set-policy', {
      name: keyVaultName,
      upn: username,
      'certificate-permissions': ['get', 'create']
    });
  }

  async getCertPublicKey(keyVaultName, secretName) {
    return await AzCommand.exec('keyvault certificate show', {
      name: secretName,
      'vault-name': keyVaultName,
      query: 'cer',
      output: 'tsv'
    });
  }

  async generateCert(keyVaultName, certConfig) {
    const policyJson = JSON.stringify(this._getCertPolicy(certConfig.cn, certConfig.san));
    await AzCommand.exec('keyvault certificate create', {
      name: certConfig.name,
      policy: policyJson,
      'vault-name': keyVaultName
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

module.exports = new SecretsHelper();
