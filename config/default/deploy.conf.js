module.exports = function(context) {
  const { prefix, alphanumPrefix, baseTags } = context;
  return {
    rg: `${prefix}-deploy`,
    storageAccountName: `${alphanumPrefix}deploy`,
    armTemplatesContainer: 'arm-templates',
    buildOutputTempDir: 'build',
    buildInputDir: 'src/templates',
    tags: { Tier: 'Deploy', ...baseTags }
  };
}
