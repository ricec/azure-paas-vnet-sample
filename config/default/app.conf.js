module.exports = function(context) {
  const { prefix, baseTags, domain } = context;
  const conf = {
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
  };

  conf.ase.cert = {
    name: conf.ase.domain.replace(/\./g, '-'),
    cn: ['*', conf.ase.domain].join('.'),
    san: ['*.scm', conf.ase.domain].join('.')
  };

  conf.apim.cert = {
    name: conf.apim.domain.replace(/\./g, '-'),
    cn: conf.apim.domain,
    san: ['*', conf.apim.domain].join('.')
  };

  return conf;
}
