// src/authorization/index.js
const logger = require("../logger");

// Prefer Amazon Cognito
if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  module.exports = require("./cognito");
  logger.info("Using Amazon Cognito for authorization");
}
// Also allow for an .htpasswd file to be used, but not in production
else if (process.env.HTPASSWD_FILE && process.env.NODE_ENV === "development") {
  module.exports = require("./basic-auth");
  logger.info("Using .htpasswd file for authorization");
}
// In all other cases, we need to stop now and fix our config
else {
  throw new Error("missing env vars: no authorization configuration found");
}
