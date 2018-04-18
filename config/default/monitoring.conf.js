module.exports = function(context) {
  const { prefix, alphanumPrefix, baseTags } = context;
  return {
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
      deployStorageDiagnostics: 90,
      appServices: 365
    },
    tags: { Tier: 'Ops', ...baseTags }
  };
}
