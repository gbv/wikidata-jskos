const wdk = require("wikidata-sdk")

function sparqlRows(sparql, promiseRequest) {
  const url = wdk.sparqlQuery(sparql)
  return promiseRequest(url).then(res => res.results.bindings)
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
  sparqlRows,
  selectedLanguages,
  labelFromSparql
}

