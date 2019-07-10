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

  promiseSchemes () {
    return Promise.resolve(Object.values(this.schemes))
  }
}

module.exports = ConceptSchemeSet
