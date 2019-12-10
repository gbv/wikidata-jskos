const config = require("./config")
const port = config.port
const _ = require("lodash")
const express = require("express")
const bodyParser = require("body-parser")
const app = express()
app.set("json spaces", 2)
const { WikidataService } = require("./lib/wikidata-wrapper")
const { loadMappingSchemes } = require("./lib/mapping-schemes")
const { addContext, addMappingIdentifiers } = require("jskos-tools")
const path = require("path")

if (config.auth.key && config.oauth.consumer_key && config.oauth.consumer_secret) {
  config.log("Authentication and therefore saving/removing mappings is configured.")
} else {
  config.log("Note: To allow saving/removing mappings, authentication has to be configured (see documentation).")
}

function errorHandler (res) {
  return (err) => {
    console.error(err)
    res.status(err.status || 500).json({ status: err.status, message: err.message })
  }
}

// Prepare authorization via JWT
const passport = require("passport")
let auth
if (config.auth.algorithm && config.auth.key) {
  const JwtStrategy = require("passport-jwt").Strategy,
    ExtractJwt = require("passport-jwt").ExtractJwt
  var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.auth.key,
    algorithms: [config.auth.algorithm]
  }
  try {
    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
      done(null, jwt_payload.user)
    }))
    // Use like this: app.get("/secureEndpoint", auth, (req, res) => { ... })
    // res.user will contain the current authorized user.
    auth = passport.authenticate("jwt", { session: false })
  } catch(error) {
    console.error("Error setting up JWT authentication")
  }
}

// serve static files from assets directory
app.use(express.static(path.join(__dirname, "/assets")))

// add default JSKOS headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,PATCH,DELETE")
  res.setHeader("Access-Control-Expose-Headers", "X-Total-Count, Link")
  res.setHeader("Content-Type", "application/ld+json")
  next()
})

// Add body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use((req, res, next) => {
  if (req.query) {
    // Limit for pagination
    const defaultLimit = 1000
    req.query.limit = parseInt(req.query.limit)
    req.query.limit = (req.query.limit && req.query.limit > 0) ? req.query.limit : defaultLimit
    // Offset for pagination
    const defaultOffset = 0
    req.query.offset = parseInt(req.query.offset)
    req.query.offset = (req.query.offset && req.query.offset >= 0) ? req.query.offset : defaultOffset
  }
  next()
})

const addPaginationHeaders = (req, res, data) => {
  const limit = req.query.limit
  const offset = req.query.offset
  const total = parseInt((data && data.totalCount) || (data && data.length))
  if (req == null || res == null || limit == null || offset == null || total == null) {
    return
  }
  const baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1) + req.path
  const url = (query, rel) => {
    let url = baseUrl
    let index = 0
    _.forOwn(query, (value, key) => {
      url += `${(index == 0 ? "?" : "&")}${key}=${encodeURIComponent(value)}`
      index += 1
    })
    return `<${url}>; rel="${rel}"`
  }
  // Set X-Total-Count header
  res.set("X-Total-Count", total)
  let links = []
  let query = _.cloneDeep(req.query)
  query.limit = limit
  // rel: first
  query.offset = 0
  links.push(url(query, "first"))
  // rel: prev
  if (offset > 0) {
    query.offset = Math.max(offset - limit, 0)
    links.push(url(query, "prev"))
  }
  // rel: next
  if (limit + offset < total) {
    query.offset = offset + limit
    links.push(url(query, "next"))
  }
  // rel: last
  let current = 0
  while (current + limit < total) {
    current += limit
  }
  query.offset = current
  links.push(url(query, "last"))
  // Set Link header
  res.set("Link", links.join(","))
}

function rewriteMappingUri(mapping) {
  const { uri } = mapping
  if (uri.startsWith("http://www.wikidata.org/entity/statement/")) {
    mapping.uri = `${config.baseUrl}mappings/${uri.substring(41)}`
    mapping.identifier = [uri]
    mapping = addMappingIdentifiers(mapping)
  }
  return mapping
}

const endpoints = {
  "/suggest": "suggestSearch",
  "/concept": "getConcepts",
  "/data": "getConcepts",
  "/mappings": "getMappings",
  "/mappings/voc": "promiseSchemes",
}

// load schemes
const schemes = loadMappingSchemes()

// initialize service
const service = new WikidataService(schemes)
config.log(`loaded ${schemes.length} mapping schemes`)

// enable endpoints
for (let path in endpoints) {
  app.get(path, (req, res) => {
    service[endpoints[path]](req.query)
      .then(jskos => path === "/mappings" ? jskos.map(rewriteMappingUri) : jskos)
      .then(addContext)
      .then(jskos => {
        if (_.isArray(jskos)) {
          // Split result if necessary
          if (jskos.totalCount == null || jskos.length > jskos.totalCount) {
            let totalCount = jskos.totalCount || jskos.length
            jskos = jskos.slice(req.query.offset, req.query.offset + req.query.limit)
            jskos.totalCount = totalCount
          }
          // Add pagination headers
          addPaginationHeaders(req, res, jskos)
        }
        res.json(jskos)
      })
      .catch(errorHandler(res))
  })
}

// status endpoint
app.get("/status", (req, res) => {
  let status = {
    config: _.omit(config, ["verbosity", "port", "mongo", "oauth", "wikibase"])
  }
  let baseUrl = status.config.baseUrl
  if (status.config.concepts) {
    // Add endpoints related to concepts
    status.data = `${baseUrl}data`
    status.suggest = `${baseUrl}suggest?search={searchTerms}`
  }
  if (status.config.mappings) {
    // Add endpoints related to mappings
    status.mappings = `${baseUrl}mappings`
    status.config.mappings.toSchemeWhitelist = Object.values(service.schemes).map(scheme => ({ uri: scheme.uri, identifier: scheme.identifier }))
  }
  status.ok = 1
  res.json(status)
})

// get single mapping
app.get("/mappings/:_id", (req, res) => {
  service.getMapping(req.params._id)
    .then(addContext)
    .then(rewriteMappingUri)
    .then(jskos => res.json(jskos))
    .catch(errorHandler(res))
})

if (auth) {

  // save a new mapping
  app.post("/mappings", auth, (req, res) => {
    service.saveMapping({
      user: req.user,
      body: req.body,
    })
      .then(addContext)
      .then(jskos => res.status(201).json(jskos))
      .catch(errorHandler(res))
  })

  // edit mapping
  app.put("/mappings/:_id", auth, (req, res) => {
    service.saveMapping({
      _id: req.params._id,
      user: req.user,
      body: req.body,
    })
      .then(addContext)
      .then(jskos => res.json(jskos))
      .catch(errorHandler(res))
  })

  // delete mapping endpoint
  app.delete("/mappings/:_id", auth, (req, res) => {
    service.deleteMapping({
      _id: req.params._id,
      user: req.user,
    })
      .then(() => res.sendStatus(204))
      .catch(errorHandler(res))
  })

}

// start application
app.listen(port, () => {
  config.log(`listening on port ${port}`)
})
