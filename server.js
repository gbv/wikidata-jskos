const config = require("config")
const app = require("express")()
const wds = require("./lib/wikidata-wrapper")

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
wds.getMappingSchemes({language:"en"})
  .then( schemes => {

    // initialize service
    const service = new wds.service(schemes)
    console.log(`loaded ${schemes.length} mapping schemes`)

    // enable endpoints
    for (let path in endpoints) {
      app.get(path, (req, res) => {
        service[endpoints[path]](req.query)
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
