const WikidataConceptScheme = require("./wikidata-concept-scheme")
const jskos = require("jskos-tools")

class WikidataConceptSchemeSet {

  constructor (schemes) {
    this.schemes = {}
    this.wikidataProperty = {}
    schemes.forEach(scheme => {
      scheme = scheme instanceof WikidataConceptScheme ? scheme : new WikidataConceptScheme(scheme)
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
    return Object.values(this.schemes).find(
      scheme => jskos.compare({ uri: id }, scheme),
    )
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
          notation: scheme.notation,
        }]
        return concept
      }
    }
  }

  filter (method) {
    return new WikidataConceptSchemeSet(Object.values(this.schemes).filter(method))
  }

  isEmpty () {
    return Object.keys(this.schemes).length == 0
  }

  getSchemes () {
    return Object.values(this.schemes)
  }

  detectWikidataConceptScheme (id) {
    if (this.schemes[id]) {
      return id
    } else if (id.match(/^P[0-9]+$/)) {
      id = this.getSchemeOfProperty(id)
      return id ? id.uri : null
    } else {
      const scheme = this.getSchemeByIdentifier(id)
      return scheme ? scheme.uri : null
    }
  }
}

module.exports = WikidataConceptSchemeSet
