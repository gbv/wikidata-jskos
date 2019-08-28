const _ = require("lodash")

// Load default config
const configDefault = require("./config.default.json")
// Current environment
const env = process.env.NODE_ENV || "development"
// Load environment config
let configEnv
try {
  configEnv = require(`./config.${env}.json`)
} catch(error) {
  configEnv = {}
}
// Load user config
let configUser
try {
  configUser = require("./config.json")
} catch(error) {
  configUser = {}
}

// Backwards compatibility with env variable for port
require("dotenv").config()
if (!configUser.port && process.env.PORT) {
  configUser.port = process.env.PORT
}

let config = _.defaultsDeep({ env }, configEnv, configUser, configDefault)

// Set baseUrl to localhost if not set
if (!config.baseUrl) {
  config.baseUrl = `http://localhost:${config.port}/`
}
if (!config.baseUrl.endsWith("/")) {
  config.baseUrl += "/"
}

// Set config.wikibase.api if not set
if (!config.wikibase.api) {
  config.wikibase.api = `${config.wikibase.instance}/w/api.php`
}

// Set auth capabilities if possible (config.auth.key, config.oauth.consumer_key, and config.oauth.consumer_secret are necessary)
if (config.auth.key && config.oauth.consumer_key && config.oauth.consumer_secret) {
  config.auth.canSaveMappings = true
  config.auth.canRemoveMappings = true
  config.mappings.create = {
    auth: true,
    identityProviders: config.identityProviders,
  }
  config.mappings.update = {
    auth: true,
    crossUser: true,
    identityProviders: config.identityProviders,
  }
  config.mappings.delete = {
    auth: true,
    crossUser: true,
    identityProviders: config.identityProviders,
  }
}

const log = (...args) => {
  if (env != "test" || config.verbosity) {
    console.log(...args)
  }
}
config.log = log

module.exports = config
