const wdk = require("wikidata-sdk")
const breq = require("bluereq")
const debug = require("./debug")
const querystring = require("querystring")

function httpRequest (url, query = {}) {
  url = url + querystring.stringify(query)
  debug.http(url)
  return breq.get(url).get("body")
}

function sparqlRequest (sparql) {
  debug.sparql(sparql)
  const url = wdk.sparqlQuery(sparql)
  return httpRequest(url).then(res => res.results.bindings)
}

module.exports = { httpRequest, sparqlRequest }
