#!/usr/bin/env node

const PipelineContext = require('../pipelineContext');
const Pipeline = require('../pipeline');
const config = require('../config');

async function runTeardown() {
  const ctx = await PipelineContext.acquire(config);

  console.log('Deleting resources...');
  await ctx.deployEnv.deleteGroups();
}

runTeardown();
