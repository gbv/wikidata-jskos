const { labelFromSparql } = require("../utils")
const { sparqlRequest } = require("../utils/request")
const { addMappingIdentifiers } = require("jskos-tools")

function getMappingsTo (args, schemes) {
  const { fromScheme, to, toScheme, languages } = args

  const concept = schemes.conceptFromUri(to)
  if (!concept || (fromScheme && fromScheme !== "http://bartoc.org/en/node/1940")) {
    return Promise.resolve([])
  }

  const scheme = schemes.schemes[concept.inScheme[0].uri]
  if (!scheme || !scheme.PROPERTY || (toScheme && toScheme !== scheme.uri)) {
    return Promise.resolve([])
  }

  const pid = scheme.PROPERTY

  const sparql = `
    SELECT ?entity ?statement ?entityLabel ?type WHERE {
      ?entity wdtn:${pid} <${concept.uri}> .
      ?entity p:${pid} ?statement .
      OPTIONAL {
        ?statement pq:P4390 [ wdt:P1709 ?type ]
      }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${languages.join(",")}".
      }
    }`

  return sparqlRequest(sparql)
    .then(rows => {
      return rows.map(row => {
        let uri = row.entity.value
        const entity = {
          uri,
          notation: [uri.split("/").pop()],
          inScheme: [
            {
              uri: "http://bartoc.org/en/node/1940",
              notation: ["WD"]
            }
          ]
        }
        if (row.entityLabel) {
          entity.prefLabel = labelFromSparql(row.entityLabel)
        }
        if (row.type) {
          entity.type = [ row.type.value ]
        }
        return {
          uri: row.statement.value,
          from: { memberSet: [ entity ] },
          to: { memberSet: [ concept ] }
        }
      }).map(addMappingIdentifiers)
    })
}

module.exports = getMappingsTo
