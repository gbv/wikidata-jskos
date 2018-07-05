const { sparqlRows, selectedLanguages, labelFromSparql, promiseRequest } 
  = require("./utils.js")

/**
 * load schemes via SPARQL.
 */
function getMappingSchemes(query) {
  query = query || {}
  const languages = selectedLanguages(query)

  const sparql = `
    SELECT ?property ?scheme ?schemeLabel ?bartoc ?P1921 ?P1793 WHERE {
      ?property wdt:P1921 ?P1921 .
      ?property wdt:P1793 ?P1793 .
      ?property wdt:P1629 ?scheme .
      ?scheme wdtn:P2689 ?bartoc .
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${languages.join(",")}".
      }
    }`

  return sparqlRows(sparql, promiseRequest)
    .then(rows => {
      return rows.map(row => {
        const scheme = {
          uri: row.bartoc.value,
          identifier: [row.scheme.value],
          PROPERTY: row.property.value.split("/").pop(),
          P1793: row.P1793.value,
          P1921: row.P1921.value,
        }
        if (row.schemeLabel) {
          scheme.prefLabel = labelFromSparql(row.schemeLabel)
        }
        return scheme
      })
    })
}

module.exports = { getMappingSchemes }

