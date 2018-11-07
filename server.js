const { port } = require('./lib/config.js')
const express = require('express')
const app = express()
const wds = require('./lib/wikidata-wrapper')
const { WikidataJSKOSService } = wds
const { addContext } = require('jskos-tools')
const path = require('path')

function errorHandler (res) {
  return (err) => {
    console.error(err)
    res.status(err.status || 500).json({ status: err.status, message: err.message })
  }
}

// serve static files from assets directory
app.use(express.static(path.join(__dirname, '/assets')))

// add default JSKOS headers
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/ld+json')
  next()
})

const endpoints = {
  '/data': 'getConcepts', // TODO: remove this
  '/concept': 'getConcepts',
  '/mappings': 'getMappings',
  '/mappings/voc': 'promiseSchemes'
}

// load schemes
wds.getMappingSchemes({ language: 'en', maxAge: 0 })
  .then(schemes => {
    // initialize service
    const service = new WikidataJSKOSService(schemes)
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
    app.listen(port, () => {
      console.log(`listening on port ${port}`)
    })
  })
