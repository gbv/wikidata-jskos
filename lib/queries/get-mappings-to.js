const { labelFromSparql } = require("../utils.js")
const { sparqlRequest } = require("../utils/request.js")
const { addMappingIdentifiers } = require("jskos-tools")


function getMappingsTo(args, schemes) {
  const { to, languages } = args  // TODO: add toScheme

  const concept = schemes.detectConcept(to)
  if (!concept) {
    return Promise.resolve([])
  }

  const scheme = schemes.schemes[concept.inScheme[0].uri]
  const pid = scheme ? scheme.IDPROP.id : undefined

  if (!pid) {
    return Promise.resolve([])
  }

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
        const entity = {
          uri: row.entity.value,
          inScheme: [
            {
              uri: "http://bartoc.org/en/node/1940",
              notation: ["WD"]
            },
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
          to: { memberSet: [ concept ] },
        }
      }).map(addMappingIdentifiers)
    })
}

module.exports = getMappingsTo
