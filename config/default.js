function config(environment, domain) {
  const prefix = `rxng-${environment}`;
  const alphanumPrefix = prefix.replace(/-/g, '');
  const baseTags = {
    Environment: environment,
    OwnerTeam: 'TheTeam',
    ProductName: 'TheProduct',
    CostCenter: '11111'
  };
  const conf = {
    location: 'South Central US',
    deployment: {
      rg: `${prefix}-deploy`,
      storageAccountName: `${alphanumPrefix}deploy`,
      armTemplatesContainer: 'arm-templates',
      buildOutputTempDir: 'build',
      buildInputDir: 'src/resources/templates',
      tags: { Tier: 'Deploy', ...baseTags }
    },
    secrets: {
      rg: `${prefix}-ops`,
      keyVaultName: `${prefix}-vault`,
      keyVaultSku: 'standard',
      tags: { Tier: 'Ops', ...baseTags }
    },
    monitoring: {
      rg: `${prefix}-ops`,
      appInsightsName: `${prefix}-insights`,
      appInsightsPlan: 1,
      omsWorkspaceName: `${prefix}-oms`,
      logsStorageAccountName: `${alphanumPrefix}logs`,
      retention: {
        oms: 7,
        waf: 365,
        devGateway: 365,
        apim: 365,
        vault: 365,
        nsg: 365,
        logsStorageDiagnostics: 365,
        deployStorageDiagnostics: 90
      },
      tags: { Tier: 'Ops', ...baseTags }
    },
    networking: {
      rg: `${prefix}-networking`,
      vnetName: `${prefix}-vnet`,
      vnetAddressPrefix: '172.16.0.0/16',
      dnsServers: ['172.16.3.4'],
      defaultSubnetName: `${prefix}-default`,
      defaultSubnetAddressPrefix: '172.16.3.0/24',
      apimSubnetName: `${prefix}-apim`,
      apimNsgName: `${prefix}-apim-nsg`,
      apimSubnetAddressPrefix: '172.16.2.0/24',
      aseSubnetName: `${prefix}-web`,
      aseNsgName: `${prefix}-web-nsg`,
      aseSubnetAddressPrefix: '172.16.1.0/24',
      waf: {
        name: `${prefix}-waf`,
        sku: 'WAF_Medium',
        capacity: 1,
        subnetName: `${prefix}-waf`,
        nsgName: `${prefix}-waf-nsg`,
        subnetAddressPrefix: '172.16.0.0/24',
        publicIpName: `${prefix}-waf-ip`,
      },
      devGateway: {
        name: `${prefix}-dev-gateway`,
        sku: 'Standard_Small',
        capacity: 1,
        subnetName: `${prefix}-dev-gateway`,
        nsgName: `${prefix}-dev-gateway-nsg`,
        subnetAddressPrefix: '172.16.4.0/24',
        publicIpName: `${prefix}-dev-gateway-ip`,
      },
      tags: { Tier: 'Networking', ...baseTags }
    },
    app: {
      rg: `${prefix}-app`,
      ase: {
        name: `${prefix}-ase`,
        domain: `ase.${domain}`,
        ipAddress: '172.16.1.11'
      },
      apim: {
        name: `${prefix}-apim`,
        publisherEmail: 'chrrice@microsoft.com',
        publisherName: 'Chris Rice',
        sku: 'Developer',
        skuCount: 1,
        domain: `api.${domain}`,
        portalSubdomain: 'docs',
        scmSubdomain: 'scm'
      },
      workService: {
        name: 'chrrice-test-rxng'
      },
      tags: { Tier: 'App', ...baseTags }
    }
  };

  conf.app.ase.cert = {
    name: conf.app.ase.domain.replace(/\./g, '-'),
    cn: ['*', conf.app.ase.domain].join('.'),
    san: ['*.scm', conf.app.ase.domain].join('.')
  };

  conf.app.apim.cert = {
    name: conf.app.apim.domain.replace(/\./g, '-'),
    cn: conf.app.apim.domain,
    san: ['*', conf.app.apim.domain].join('.')
  };

  return conf;
}

const _ = require('lodash');
module.exports = {
  extend: function(environment, domain, overrides) {
    return _.merge(config(environment, domain), overrides)
  }
}
