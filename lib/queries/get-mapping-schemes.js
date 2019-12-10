const { labelFromSparql } = require("../utils")
const { sparqlRequest } = require("../utils/request")
const WikidataConceptScheme = require("../wikidata-concept-scheme")

/**
 * Load mapping schemes via SPARQL in JSKOS format.
 */
function getMappingSchemes () {
  const subqueries = []

  subqueries.push(`
      OPTIONAL {
        SELECT ?property (SAMPLE(?number) AS ?extent) {
        ?property wdt:P4876|wdt:P1114 ?number
        } GROUP BY ?property
      }`)

  subqueries.push(`
      OPTIONAL {
        SELECT ?scheme (GROUP_CONCAT(?name) AS ?shortName) WHERE {
          ?scheme wdt:P1813 ?name
        } GROUP BY ?scheme
      }`)

  subqueries.push(`
      OPTIONAL {
        SELECT ?scheme (GROUP_CONCAT(?uri) AS ?identifier) WHERE {
          ?scheme wdt:P2888|wdt:P1709 ?uri .
        } GROUP BY ?scheme
      }`)

  let sparql = `
    # getMappingSchemes
    SELECT DISTINCT
      ?property ?scheme ?schemeLabel ?shortName
      ?bartoc ?TEMPLATE ?notationPattern ?identifier ?extent
    WITH {
      SELECT ?property ?scheme ?bartoc ?TEMPLATE ?notationPattern {
        ?property wdt:P1921 ?TEMPLATE .
        ?property wdt:P1793 ?notationPattern .
        { { ?property wdt:P1629 ?scheme } UNION { ?scheme wdt:P1687 ?property } }
        ?scheme wdtn:P2689 ?bartoc .
      }
    } AS %properties WHERE {
      INCLUDE %properties .
      ${subqueries.join("\n")}
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
      }
    } ORDER BY ?scheme`

  sparql = sparql.trim().replace(/^ {4}/gm, "")

  return sparqlRequest(sparql)
    .then(rows => {
      return rows.map(row => {
        const identifier = row.identifier ? row.identifier.value.split(" ") : []
        const template = row.TEMPLATE.value
        const notationPattern = row.notationPattern.value

        // we cannot escape all special character but spaces are needed
        const escapedNotationPattern = notationPattern.split(" ").join("%20")
        const uriPattern = "^" + template.split("$1").map(s =>
          s.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&")
        ).join("(" + escapedNotationPattern + ")") + "$"

        const scheme = {
          uri: row.bartoc.value,
          identifier: [row.scheme.value].concat(identifier),
          notationPattern,
          uriPattern,
          namespace: template.replace(/\$1.*/, ""),
          PROPERTY: row.property.value.split("/").pop()
        }
        if (row.extent) {
          scheme.extent = row.extent.value
        }
        if (row.shortName) {
          scheme.notation = row.shortName.value.split(" ")
        }
        if (row.schemeLabel) {
          scheme.prefLabel = labelFromSparql(row.schemeLabel)
        }

        return new WikidataConceptScheme(scheme)
      })
    })
}

module.exports = getMappingSchemes
