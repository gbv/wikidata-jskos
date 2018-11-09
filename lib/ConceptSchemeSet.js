const ConceptScheme = require('./ConceptScheme.js')

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

  detectConcept (uri) {
    for (let schemeUri in this.schemes) {
      const scheme = this.schemes[schemeUri]
      const concept = scheme.detectConcept(uri)
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
    for (let uri in this.schemes) {
      return false
    }
    return true
  }

  promiseSchemes () {
    return Promise.resolve(Object.values(this.schemes))
  }
}

module.exports = ConceptSchemeSet
