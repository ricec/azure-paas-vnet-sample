module.exports = function(context) {
  const { prefix, baseTags } = context;
  return {
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
  };
}
