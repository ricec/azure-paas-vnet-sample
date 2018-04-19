#!/usr/bin/env node

const PipelineContext = require('../pipelineContext');
const Pipeline = require('../pipeline');
const config = require('../config');

async function runDeploy() {
  const ctx = await PipelineContext.acquire(config);

  const pipeline = new Pipeline(ctx, ['deploy']);
  await pipeline.run();
}

runDeploy();
