import wdk from "./wdk.js"
import debug from "./debug.js"
import querystring from "querystring"

const headers = { "User-Agent": "wikidata-jskos" }

async function httpRequest (url, query = {}) {
  const uri = url + querystring.stringify(query)
  debug.http(uri)
  const response = await fetch(uri, { headers })
  const result = await response.json()
  return result
}

async function sparqlRequest (sparql) {
  debug.sparql(sparql)
  const url = wdk.sparqlQuery(sparql)
  return httpRequest(url).then(res => {
    return res.results.bindings
  })
}

export { httpRequest, sparqlRequest }
