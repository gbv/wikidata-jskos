const wdk = require("wikidata-sdk")
const breq = require("bluereq")
const debug = require("./debug")

function promiseRequest(url) {
  debug.http(url)
  return breq.get(url).get("body")
}

function sparqlRows(sparql, promiseRequest) {
  const url = wdk.sparqlQuery(sparql)
  debug.sparql(sparql)
  return promiseRequest(url)
    .then(res => res.results.bindings)
}

const languageRegex = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/

function selectedLanguages(query) {
  var languages = query.language || query.languages
  if (languages) {
    if (!Array.isArray(languages)) {
      languages = languages.split(",")
    }
    return languages.filter(lang => languageRegex.test(lang))
  } else {
    return []
  }
}

function labelFromSparql(label) {
  if (label !== undefined && label["xml:lang"]) {
    const prefLabel = {"-":"?"}
    prefLabel[label["xml:lang"]] = label.value
    return prefLabel
  }
}

module.exports = {
  promiseRequest,
  sparqlRows,
  selectedLanguages,
  labelFromSparql
}

