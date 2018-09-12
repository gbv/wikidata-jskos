const { mappingTypes } = require("./types.js")

/**
 * Wikidata property of datatype external-id.
 */

class IdentifierProperty {

  constructor(property) {
    this.id       = property.id        // P...
    this.template = property.template  // URI template (P1921)
    this.pattern  = property.pattern   // identifier pattern (P1793)
    this.regex = RegExp("^" + this.template.split("$1").map(s =>
      s.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1")
    ).join("("+this.pattern+")") + "$")
  }

  detectId(uri) {
    const match = this.regex.exec(uri)
    if (!match) return null
    if (this.id == "P1150") { // RVK
      return match[1].replace(/_/g, " ")
    } else {
      return match[1]
    }
  }

  expandId(id) {
    console.error(this.id)
    if (this.id == "P1150") { // RVK
      id = id.replace(/ /g, "_")
    }
    return this.template.replace("$1", id)
  }

  detectConcept(uri) {
    const id = this.detectId(uri)
    return id !== null ? { uri, notation: [id] } : null
  }

  mapPropertyClaims(claims) {
    return claims
      .filter(claim => claim.mainsnak.snaktype == "value")
      .map(claim => {
        const { mainsnak, qualifiers } = claim
        const id = mainsnak.datavalue.value

        const concept = {
          uri: this.expandId(id),
          notation: [id]
        }
        if (!concept.uri) return

        const mapping = {
          uri: "http://www.wikidata.org/entity/statement/" + claim.id.replace("$","-"),
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

module.exports = IdentifierProperty
