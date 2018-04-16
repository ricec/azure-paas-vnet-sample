module.exports = function(context) {
  const { prefix, baseTags } = context;
  return {
    rg: `${prefix}-ops`,
    keyVaultName: `${prefix}-vault`,
    keyVaultSku: 'standard',
    tags: { Tier: 'Ops', ...baseTags }
  };
}
