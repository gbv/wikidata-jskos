const { mappingTypes } = require('./types')

/**
 * JSKOS Concept Scheme with a Wikidata property for authority control.
 */
class ConceptScheme {
  constructor (fields) {
    Object.assign(this, fields)
    this.REGEX = RegExp(this.uriPattern)
  }

  /**
   * Check whether URI belongs to the scheme, return local notation on success.
   */
  notationFromUri (uri) {
    const match = this.REGEX.exec(uri)
    return match ? decodeURI(match[1]) : null
  }

  /**
   * Map local notation to URI.
   */
  notationToUri (id) {
    if (!this.uriPattern) {
      return
    }
    id = encodeURI(id)
    return this.uriPattern.replace(/^\^|\$$/g, '').replace(/\\/g, '').replace(/\(.*\)/, id)
  }

  /**
   * Check whether URI belongs to the scheme, return concept on success.
   */
  uriToConcept (uri) {
    const id = this.notationFromUri(uri)
    return id !== null ? { uri, notation: [id] } : null
  }

  /**
   * Extract JSKOS mappings for this Concept Scheme.
   */
  mapPropertyClaims (claims) {
    return claims
      .filter(claim => claim.mainsnak.snaktype === 'value')
      .map(claim => {
        const { mainsnak, qualifiers } = claim
        const id = mainsnak.datavalue.value

        const concept = {
          uri: this.notationToUri(id),
          notation: [id]
        }
        if (!concept.uri) return

        const mapping = {
          uri: 'http://www.wikidata.org/entity/statement/' + claim.id.replace('$', '-'),
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

module.exports = ConceptScheme
