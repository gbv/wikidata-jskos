const wdk = require("wikidata-sdk")
const request = require("request-promise-native")
const debug = require("./debug")
const querystring = require("querystring")

const headers = { 'User-Agent': 'wikidata-jskos' }

function httpRequest (url, query = {}) {
  const uri = url + querystring.stringify(query)
  debug.http(uri)
  return request({uri, headers, json: true})
}

function sparqlRequest (sparql) {
  debug.sparql(sparql)
  const url = wdk.sparqlQuery(sparql)
  return httpRequest(url).then(res => {
    return res.results.bindings
  })
}

module.exports = { httpRequest, sparqlRequest }
