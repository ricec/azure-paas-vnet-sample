#!/usr/bin/env node

const PipelineContext = require('../pipelineContext');
const Pipeline = require('../pipeline');
const config = require('./config');
const secretsHelper = require('../util/secretsHelper');

async function runSetup() {
  const ctx = await PipelineContext.acquireForSetup(config);

  console.log('Setting up deployment environment...');
  await ctx.deployEnv.setup();

  const pipeline = new Pipeline(ctx, ['init']);
  await pipeline.run();

  const keyVaultName = config.secrets.keyVaultName;
  const apiCert = config.app.apim.cert;
  const aseCert = config.app.ase.cert;

  console.log('Setting up secrets...');
  await secretsHelper.grantCertAccess(ctx.account.user.name);
  await secretsHelper.generateCert(keyVaultName, apiCert);
  await secretsHelper.generateCert(keyVaultName, aseCert);
}

runSetup();
