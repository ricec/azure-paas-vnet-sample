const defaultConfig = require('./default');
module.exports = defaultConfig.extend('prod', 'chrrice-prod.net', {
  app: {
    apim: {
      sku: 'Premium'
    }
  }
});
