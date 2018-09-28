const { port } = require("./lib/config.js")
const app = require("express")()
const wds = require("./lib/wikidata-wrapper")
const examples = require("./lib/examples.json")
const { addContext } = require("jskos-tools")

function errorHandler(res) {
  return (err) => {
    console.error(err)
    res.status(err.status || 500).json({status: err.status, message: err.message})
  }
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
wds.getMappingSchemes({language:"en", maxAge:0})
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

    // root endpoint
    app.get("/", (req, res) => {
      // TODO: send HTML view with clickable links
      // TODO: add API documentation
      res.json({ examples })
    })

    // start application
    app.listen(port, () => {
      console.log(`listening on port ${port}`)
    })
  })
