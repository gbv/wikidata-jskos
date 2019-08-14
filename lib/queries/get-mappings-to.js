const { labelFromSparql } = require("../utils")
const { sparqlRequest } = require("../utils/request")
const { addMappingIdentifiers, defaultMappingType } = require("jskos-tools")
const config = require("../../config")

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

  // Question: Is the change from P1709 to P2699 for the type correct? It returns the correct results at least.
  const sparql = `
    SELECT ?entity ?statement ?entityLabel ?type WHERE {
      ?entity wdtn:${pid} <${concept.uri}> .
      ?entity p:${pid} ?statement .
      OPTIONAL {
        ?statement pq:P4390 [ wdt:P2699 ?type ]
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
        return {
          // Question: Should we leave this or rather change the query?
          // Note that we need both the Wikidata statement URI and the one for wikidata-jskos.
          uri: row.statement.value.replace("http://www.wikidata.org/entity/statement/", config.baseUrl + "mappings/"),
          identifier: [ row.statement.value ],
          from: { memberSet: [ entity ] },
          to: { memberSet: [ concept ] },
          type: row.type ? [ row.type.value ] : [ defaultMappingType.uri ],
        }
      }).map(addMappingIdentifiers)
    })
}

module.exports = getMappingsTo
