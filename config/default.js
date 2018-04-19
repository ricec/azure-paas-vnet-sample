function config(environment, domain) {
  const context = {
    environment: environment,
    domain: domain,
    prefix: `sampleapp-${environment}`,
    baseTags: {
      Environment: environment,
      OwnerTeam: 'TheTeam',
      ProductName: 'TheProduct',
      CostCenter: '11111'
    }
  };
  context.alphanumPrefix = context.prefix.replace(/-/g, '');

  const conf = {
    location: 'South Central US',
    deployment: require('./default/deploy.conf')(context),
    secrets: require('./default/secrets.conf')(context),
    monitoring: require('./default/monitoring.conf')(context),
    networking: require('./default/networking.conf')(context),
    app: require('./default/app.conf')(context),
    services: require('./default/services.conf')(context)
  };

  conf.resourceGroups = [
    conf.deployment.rg,
    conf.secrets.rg,
    conf.monitoring.rg,
    conf.networking.rg,
    conf.app.rg
  ];
}

const _ = require('lodash');
module.exports = {
  extend: function(environment, domain, overrides) {
    return _.merge(config(environment, domain), overrides)
  }
};
