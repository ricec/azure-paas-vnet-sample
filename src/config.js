const env = process.env.RESOURCE_ENV || 'dev';
module.exports = require(`../config/${env}`);
