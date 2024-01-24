const _ = require("lodash")
require("dotenv").config()

// Load default config
const configDefault = require("./config.default.json")

// Load configuration from environment variables
const configEnvVariables = {
  env: process.env.NODE_ENV || "development",
  title: process.env.TITLE,
  wikibase: {
    instance: process.env.WIKIBASE_INSTANCE,
    sparqlEndpoint: process.env.WIKIBASE_SPARQL,
    api: process.env.WIKIBASE_API,
  },
  verbosity: process.env.VERBOSITY,
  baseUrl: process.env.BASE_URL,
  port: process.env.PORT,
  auth: {
    algorithm: process.env.AUTH_ALGORITHM,
    key: process.env.AUTH_KEY,
  },
  oauth: {
    consumer_key: process.env.OAUTH_KEY,
    consumer_secret: process.env.OAUTH_SECRET,
  },
}
const env = configEnvVariables.env

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

let config = _.defaultsDeep(configEnvVariables, configEnv, configUser, configDefault)

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

// Set capabilities for clients
// JSKOS API version and server version from package.json
config.version = require("./package.json").apiVersion
config.serverVersion = require("./package.json").version
// Concepts (read only)
config.concepts = {
  read: {
    auth: false
  }
}
// Mappings (read only by default)
config.mappings = {
  read: {
    auth: false
  },
  fromSchemeWhitelist: [
    {
      uri: "http://bartoc.org/en/node/1940"
    }
  ],
  toSchemeWhitelist: [],
  anonymous: true,
  cardinality: "1-to-1"
}
// Identity requirements
config.identities = null
config.identityProviders = ["wikidata"]

// Set auth capabilities if possible (config.auth.key, config.oauth.consumer_key, and config.oauth.consumer_secret are necessary)
if (config.auth.key && config.oauth.consumer_key && config.oauth.consumer_secret) {
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
