import wdk from "./wdk.js"
import request from "request-promise-native"
import debug from "./debug.js"
import querystring from "querystring"

const headers = { "User-Agent": "wikidata-jskos" }

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

export { httpRequest, sparqlRequest }
