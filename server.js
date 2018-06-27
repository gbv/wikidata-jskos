const config = require("config")
const app = require("express")()
const WikidataWrapper = require("./lib/wikidata-wrapper")

var wrapper

function errorHandler(res) {
  return (err) => {
    res.status(err.status || 500).json({status: err.status, message: err.message})
  }
}

function addContext(set) {
  set.forEach(item => {
    item["@context"] = "https://gbv.github.io/jskos/context.json"
  })
  return set
}

// add default headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/ld+json")
  next()
})

// provide mapping endpoint
app.get("/mappings", (req, res) => {
  wrapper.getMappings(req.query)
    .then(addContext)
    .then(jskos => res.json(jskos))
    .catch(errorHandler(res))
})

// provide schemes endpoint
app.get("/schemes", (req, res) => {
  wrapper.getSchemes(req.query)
    .then(addContext)
    .then(jskos => res.json(jskos))
    .catch(errorHandler(res))
})

// load schemes and start application
WikidataWrapper.getMappingSchemes()
  .then( schemes => {
    wrapper = new WikidataWrapper(schemes)
    console.log(`loaded ${schemes.length} mapping schemes, see endpoint /voc`)
  })
  .then( () => {
    app.listen(config.port, () => {
      console.log(`listening on port ${config.port}`)
    })
  })
