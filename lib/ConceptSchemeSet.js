const ConceptScheme = require("./ConceptScheme")

class ConceptSchemeSet {
  constructor (schemes) {
    this.schemes = {}
    this.wikidataProperty = {}
    schemes.forEach(scheme => {
      scheme = scheme instanceof ConceptScheme ? scheme : new ConceptScheme(scheme)
      this.schemes[scheme.uri] = scheme
      if (scheme.PROPERTY) {
        this.wikidataProperty[scheme.PROPERTY] = scheme
      }
    })
  }

  getSchemeOfProperty (property) {
    return this.wikidataProperty[property]
  }

  getSchemeByIdentifier (id) {
    return Object.values(this.schemes).find(scheme => {
      const { uri, identifier } = scheme
      return uri === id || (identifier && identifier.find(e => e === id))
    })
  }

  getPropertyOfScheme (uri) {
    if (this.schemes[uri]) {
      return this.schemes[uri].PROPERTY
    }
  }

  conceptFromUri (uri) {
    for (let schemeUri in this.schemes) {
      const scheme = this.schemes[schemeUri]
      const concept = scheme.conceptFromUri(uri)
      if (concept) {
        concept.inScheme = [{
          uri: schemeUri,
          notation: scheme.notation
        }]
        return concept
      }
    }
  }

  filter (method) {
    return new ConceptSchemeSet(Object.values(this.schemes).filter(method))
  }

  isEmpty () {
    return Object.keys(this.schemes).length == 0
  }

  async promiseSchemes () {
    return Object.values(this.schemes)
  }
}

module.exports = ConceptSchemeSet
