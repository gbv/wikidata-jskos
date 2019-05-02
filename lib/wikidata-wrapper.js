require("./utils/polyfills")

const { selectedLanguages } = require("./utils")
const types = require("./types")
const mappers = require("./mappers")

const debug = require("./utils/debug")

const getMappingsFrom = require("./queries/get-mappings-from")
const getMappingsTo = require("./queries/get-mappings-to")
const getConcepts = require("./queries/get-concepts")
const wdk = require("wikidata-sdk")
const ConceptScheme = require("./ConceptScheme")
const ConceptSchemeSet = require("./ConceptSchemeSet")
const suggestSearch = require("./suggest")

const wikidataConceptScheme = new ConceptScheme({
  "uri": "http://bartoc.org/en/node/1940",
  "notation": ["WD"],
  "namespace": "http://www.wikidata.org/entity/",
  "notationPattern": "Q[1-9][0-9]*",
  "uriPattern": "^http://www\\.wikidata\\.org/entity/(Q[1-9][0-9]*)$"
})

/**
 * Provides JSKOS Mappings from Wikidata.
 */
class WikidataJSKOSService extends ConceptSchemeSet {
  constructor (schemes) {
    schemes.push(wikidataConceptScheme)
    super(schemes)
  }

  detectWikidataConcept (id) {
    if (wdk.isEntityId(id)) {
      id = "http://www.wikidata.org/entity/" + id
    }
    return wikidataConceptScheme.uriToConcept(id)
  }

  /**
   * OpenSearch Suggestions.
   */
  suggestSearch (query) {
    return suggestSearch(query)
  }

  /**
   * Promise an array of JSKOS Concepts.
   */
  getConcepts (query) {
    return getConcepts(query, this)
  }

  detectConceptSchemeURI (scheme) {
    if (scheme.match(/^http:\/\/bartoc\.org\/en\/node\/[0-9]+$/)) {
      return scheme
    } else if (scheme.match(/^[0-9]+$/)) {
      return "http://bartoc.org/en/node/" + scheme
    } else if (scheme.match(/^P[0-9]+$/)) {
      scheme = this.getSchemeOfProperty(scheme)
      return scheme ? scheme.uri : null
    }
  }

  /**
   * Promise an array of JSKOS Mappings from Wikidata.
   */
  getMappings (query) {
    if (query.direction === "backward") {
      [query.from, query.fromScheme, query.to, query.toScheme] =
        [query.to, query.toScheme, query.from, query.fromScheme]
      delete query.direction
    }

    if (!query.from && !query.to && query.to !== "0") {
      return Promise.resolve([])
    }

    query.languages = selectedLanguages(query)

    if (query.fromScheme) {
      query.fromScheme = this.detectConceptSchemeURI(query.fromScheme)
    }
    if (query.toScheme) {
      query.toScheme = this.detectConceptSchemeURI(query.toScheme)
    }

    // cleanup query
    Object.keys(query).forEach(key => {
      if (query[key] === "" || query[key] === null || query[key] === undefined) {
        delete query[key]
      }
    })

    if (!query["fromScheme"] && wdk.isEntityId(query["from"])) {
      query.from = "http://www.wikidata.org/entity/" + query["from"]
      query.fromScheme = "http://bartoc.org/en/node/1940"
    }
    if (!query["toScheme"] && wdk.isEntityId(query["to"])) {
      query.to = "http://www.wikidata.org/entity/" + query["to"]
      query.toScheme = "http://bartoc.org/en/node/1940"
    }
    debug.query(query)

    let promises = []

    if (query.mode === "or") {
      const { from, to, fromScheme, toScheme } = query

      delete query.to
      delete query.toScheme
      promises.push(getMappingsFrom(query, this))
      query.to = to
      query.toScheme = toScheme

      delete query.from
      delete query.fromScheme
      promises.push(getMappingsTo(query, this))
      query.from = from
      query.fromScheme = fromScheme
    } else {
      if (query.from) {
        promises.push(getMappingsFrom(query, this))
      } else if (query.to || query.to === "0") {
        promises.push(getMappingsTo(query, this))
      }
    }

    if (query.direction === "both") {
      query.direction = "backward"
      promises.push(this.getMappings(query))
    }

    // combine results and collect unique mappings
    return Promise.all(promises)
      .then(results => results.reduce((all, content) => all.concat(content), [])
        .filter((mapping, index, self) => {
          const same = m => m.identifier[0] === mapping.identifier[0]
          return self.findIndex(same) === index
        })
      )
  }
}

module.exports = Object.assign({
  ConceptScheme,
  ConceptSchemeSet,
  WikidataJSKOSService,
  getMappingSchemes: require("./load-mapping-schemes")
},
mappers,
types
)
