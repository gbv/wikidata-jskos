import _ from "lodash"
import dotenv from "dotenv"
import process from "node:process"
import { readFile } from "node:fs/promises"

const fileUrl = new URL("./config.default.json", import.meta.url)
// Load default config
const configDefault = JSON.parse(await readFile(fileUrl, "utf8"))

dotenv.config()

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
  const fileUrl = new URL(`./config.${env}.json`, import.meta.url)
  configEnv = JSON.parse(await readFile(fileUrl, "utf-8"))
} catch (error) {
  configEnv = {}
}

// Load user config
let configUser
try {
  const fileUrl = new URL("./config.json", import.meta.url)
  configUser = JSON.parse(await readFile(fileUrl, "utf-8"))

} catch (error) {
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
const fileUrlPkg = new URL("./package.json", import.meta.url)
const pkg = JSON.parse(await readFile(fileUrlPkg, "utf-8"))

config.version  = pkg.apiVersion
config.serverVersion = pkg.version

// Concepts (read only)
config.concepts = {
  read: {
    auth: false,
  },
}
// Mappings (read only by default)
config.mappings = {
  read: {
    auth: false,
  },
  fromSchemeWhitelist: [
    {
      uri: "http://bartoc.org/en/node/1940",
    },
  ],
  toSchemeWhitelist: [],
  anonymous: true,
  cardinality: "1-to-1",
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

export default config
