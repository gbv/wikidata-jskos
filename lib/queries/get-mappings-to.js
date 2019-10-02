const { labelFromSparql } = require("../utils")
const { sparqlRequest } = require("../utils/request")
const { defaultMappingType } = require("jskos-tools")

async function getMappingsTo (args, schemes) {
  const { fromScheme, languages } = args

  if (fromScheme && fromScheme !== "http://bartoc.org/en/node/1940") return []

  const to = (args.to || "").split("|").filter(Boolean)
  if (!to.length) return []

  // target concepts grouped by vocabulary, indexed by Wikidata property
  const toConcepts = {}

  if (args.toScheme) {
    const toScheme = schemes.getSchemeByIdentifier(args.toScheme)
    if (toScheme) {
      const property = schemes.schemes[toScheme.uri].PROPERTY
      if (property) {
        toConcepts[property] = to.map(
          id => toScheme.conceptFromUri(id) || toScheme.conceptFromNotation(id)
        )
      }
    }
  } else {
    const concepts = to.map(id => schemes.conceptFromUri(id)).filter(Boolean)
    concepts.forEach(c => {
      const property = schemes.schemes[c.inScheme[0].uri].PROPERTY
      if (property) {
        (toConcepts[property] = toConcepts[property] || []).push(c)
      }
    })
  }

  return Promise.all(
    Object.keys(toConcepts)
      .map(property => {
        const concepts = toConcepts[property]
        const scheme = ({uri, notation} = schemes.getSchemeOfProperty(property), {uri, notation})
        return getMappingsByProperty(property, concepts, scheme, languages)
      })
  ).then(arrays => [].concat.apply([], arrays))
}

async function getMappingsByProperty(pid, toConcepts, toScheme, languages) {
  if (!toConcepts.length) return []

  const concepts = toConcepts.reduce((obj, c) => { obj[c.uri] = c; return obj }, {})

  const sparql = `
    SELECT ?entity ?statement ?entityLabel ?type ?to WHERE {
      {
        `
    + toConcepts.map(c => `{ BIND(<${c.uri}> AS ?to) ?entity wdtn:${pid} ?to }`).join(" UNION\n        ")
    + `
      }
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
        }
        if (row.entityLabel) {
          entity.prefLabel = labelFromSparql(row.entityLabel)
        }
        const toConcept = concepts[row.to.value]
        return {
          uri: row.statement.value,
          from: { memberSet: [ entity ] },
          fromScheme: {
            uri: "http://bartoc.org/en/node/1940",
            notation: ["WD"]
          },
          to: { memberSet: [ toConcept ] },
          toScheme,
          type: row.type ? [ row.type.value ] : [ defaultMappingType.uri ],
        }
      })
    })
}

module.exports = getMappingsTo
