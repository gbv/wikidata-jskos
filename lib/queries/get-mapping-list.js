const { sparqlRequest } = require("../utils/request")
const { mappingTypes } = require("../types")
const { labelFromSparql } = require("../utils")
const languageFilter = require("../utils/languages")

async function getMappingList (args, schemes) {
  let { fromScheme, toScheme, languages, limit, offset } = args

  // only support mappings from Wikidata
  if (fromScheme && fromScheme !== "http://bartoc.org/en/node/1940") {
    return []
  }

  const prop = schemes.getPropertyOfScheme(toScheme)
  if (!prop) {
    return []
  }
  toScheme = schemes.getSchemeOfProperty(prop)

  // make sure we have non-negative numbers
  if (!(limit > 0)) limit = 1000
  if (!(offset >= 0)) offset = 0

  // build and execute SPARQL query
  const filter = languageFilter(languages)
  const order = toScheme.PROPERTY_USE <= 10000 ? 'ORDER BY ?value' : ''
  const query = `
SELECT ?item ?itemLabel ?value ?mappingType WHERE {
  ?item p:${prop} ?statement .
  ?statement ps:${prop} ?value .
  OPTIONAL { ?statement pq:P4390 ?mappingType }
  ${filter}
} ${order}
LIMIT ${limit} OFFSET ${offset}`

  const rows = await sparqlRequest(query)
  const mappings = rows.map(row => {
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
          prefLabel: labelFromSparql(row.itemLabel)
        } ]
      },
      to: { memberSet: [ to ] },
      type: [ type ]
    }
  }).filter(Boolean)

  mappings.totalCount = toScheme.PROPERTY_USE
  console.log(mappings.totalCount)

  return mappings
}

module.exports = getMappingList
