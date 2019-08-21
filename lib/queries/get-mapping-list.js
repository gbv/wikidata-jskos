const { sparqlRequest } = require("../utils/request")
const { mappingTypes } = require("../types")

/**
 * Get total number of Wikidata statements a property is used in.
 */
async function countPropertyUse (property) {
  const query = `SELECT (COUNT(*) AS ?count) { [] p:${property} [] }`
  return sparqlRequest(query).then(result => result[0].count.value)
}

/**
 * Get a list of mappings from Wikidata to concepts of toScheme.
 */
async function getMappingList (args, schemes) {
  let { fromScheme, toScheme, limit, offset } = args

  // only support mappings from Wikidata
  if (fromScheme && fromScheme !== "http://bartoc.org/en/node/1940") {
    return []
  }

  toScheme = schemes.schemes[toScheme]
  if (!toScheme) {
    return []
  }

  const prop = toScheme.PROPERTY
  const totalCount = await countPropertyUse(prop)

  // build and execute SPARQL query
  const order = totalCount <= 10000 ? "ORDER BY ?value" : ""
  const query = `
SELECT ?item ?value ?mappingType WHERE {
  ?item p:${prop} ?statement .
  ?statement ps:${prop} ?value .
  OPTIONAL { ?statement pq:P4390 ?mappingType }
} ${order}
LIMIT ${limit} OFFSET ${offset}`

  const mappings = await sparqlRequest(query)
    .then(rows => rows.map(row => {

      const to = toScheme.conceptFromNotation(row.value.value)
      if (!to) return // malformed notation in Wikidata

      var type
      if (row.mappingType) {
        type = mappingTypes[row.mappingType.value.split("/").pop()]
      }
      if (!type) {
        type = "http://www.w3.org/2004/02/skos/core#mappingRelation"
      }

      return mapping = {
        from: {
          memberSet: [ {
            uri: row.item.value,
          } ]
        },
        to: { memberSet: [ to ] },
        fromScheme: {
          uri: "http://bartoc.org/en/node/1940",
          notation: ["WD"]
        },
        toScheme: {
          uri: toScheme.uri,
          notation: toScheme.notation
        },
        type: [ type ]
      }
    }).filter(Boolean))

  mappings.totalCount = totalCount

  return mappings
}

module.exports = getMappingList
