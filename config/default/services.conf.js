module.exports = function(context) {
  const { prefix, baseTags } = context;
  const tags = { Tier: 'App', ...baseTags };
  const conf = {
    plans: {
      default: {
        name: `${prefix}-default-asp`,
        tier: '1',
        capacity: 1,
        tags: tags
      }
    },
    workService: {
      name: 'work-service'
    },
    routingEngine: {
      name: 'routing-engine'
    }
  };

  conf.workService.tags = { Component: conf.workService.name, ...tags };
  conf.routingEngine.tags = { Component: conf.routingEngine.name, ...tags };

  return conf;
}
