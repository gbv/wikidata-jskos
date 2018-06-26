const config = require("config")
const app = require("express")()
const WikidataWrapper = require("./lib/wikidata-wrapper")
const wrapper = new WikidataWrapper()

// add default headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/ld+json")
  next()
})

// provide mapping endpoint
app.get("/mappings", (req, res) => {
  wrapper.getMappings(req.query)
    .then(mappings => {
      // add default JSKOS field
      mappings.forEach(mapping => {
        mapping["@context"] = "https://gbv.github.io/jskos/context.json"
      })
      res.json(mappings)
    })
    .catch(err => {
      res.status(err.status || 500).json({status: err.status, message: err.message})
    })
})

// start application
app.listen(config.port, () => {
  console.log(`listening on port ${config.port}`)
})
