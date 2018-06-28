const config = require("config")
const app = require("express")()
const WikidataWrapper = require("./lib/wikidata-wrapper")

var wrapper

function errorHandler(res) {
  return (err) => {
    console.error(err)
    res.status(err.status || 500).json({status: err.status, message: err.message})
  }
}

function addContext(set) {
  if (set instanceof Array) {
    set.forEach(item => {
      item["@context"] = "https://gbv.github.io/jskos/context.json"
    })
  }
  return set
}

// add default headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/ld+json")
  next()
})

const endpoints = {
  "/concept": "getConcepts",
  "/mapping": "getMappings",
  "/scheme":  "getSchemes"
}

// load schemes
WikidataWrapper.getMappingSchemes()
  .then( schemes => {
    wrapper = new WikidataWrapper(schemes)
    console.log(`loaded ${schemes.length} mapping schemes`)
  })
  .then( () => {

    // enable endpoints
    for (let path in endpoints) {
      app.get(path, (req, res) => {
        wrapper[endpoints[path]](req.query)
          .then(addContext)
          .then(jskos => res.json(jskos))
          .catch(errorHandler(res))
      })
    }

    // start application
    app.listen(config.port, () => {
      console.log(`listening on port ${config.port}`)
    })
  })
