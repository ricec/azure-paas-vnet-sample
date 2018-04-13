const AzCommand = require('./azCommand');

class StorageHelper {
  async getConnectionString(resourceGroup, storageAccount) {
    return (await AzCommand.exec('storage account show-connection-string', {
      'resource-group': resourceGroup,
      name: storageAccount,
      output: 'tsv',
      query: 'connectionString'
    })).trim();
  }

  async configureBlobDiagnostics(blobService, retention) {
    await new Promise((resolve, reject) => {
      blobService.setServiceProperties({
        Logging: {
          Version: '1.0',
          Delete: true,
          Read: true,
          Write: true,
          RetentionPolicy: {
            Enabled: true,
            Days: retention,
          },
        },
        HourMetrics: {
          Version: '1.0',
          Enabled: true,
          IncludeAPIs: true,
          RetentionPolicy: {
            Enabled: true,
            Days: retention,
          },
        }
      },
      (err, result, response) => { err ? reject(err) : resolve(result) })
    });
  }
}

module.exports = new StorageHelper();
