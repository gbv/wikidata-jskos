const { ConceptScheme } = require("jskos-tools")
const { mappingTypes } = require("./types")

/**
 * JSKOS Concept Scheme with a Wikidata property for authority control.
 */
class WikidataConceptScheme extends ConceptScheme {

  /**
   * Extract JSKOS mappings for this Concept Scheme.
   */
  mapPropertyClaims (claims) {
    return claims
      .filter(claim => claim.mainsnak.snaktype === "value")
      .map(claim => {
        const { mainsnak, qualifiers } = claim
        const id = mainsnak.datavalue.value

        const concept = {
          uri: this.uriFromNotation(id),
          notation: [id]
        }
        if (!concept.uri) return

        const mapping = {
          uri: "http://www.wikidata.org/entity/statement/" + claim.id.replace("$", "-"),
          to: { memberSet: [ concept ] }
        }
        if (qualifiers && qualifiers.P4390) {
          // just take the first qualifier
          const type = mappingTypes[qualifiers.P4390[0].datavalue.value.id]
          if (type) {
            mapping.type = [type]
          }
        }

        return mapping
      }).filter(defined => defined)
  }
}

module.exports = WikidataConceptScheme
