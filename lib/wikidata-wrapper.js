require('./utils/polyfills.js')

const { selectedLanguages, cleanupQuery } = require('./utils.js')
const types = require('./types.js')
const mappers = require('./mappers.js')

const debug = require('./utils/debug.js')

const getMappingsFrom = require('./queries/get-mappings-from.js')
const getMappingsTo = require('./queries/get-mappings-to.js')
const getConcepts = require('./queries/get-concepts.js')

const ConceptScheme = require('./ConceptScheme.js')
const ConceptSchemeSet = require('./ConceptSchemeSet.js')

const wikidataConceptScheme = new ConceptScheme({
  'uri': 'http://bartoc.org/en/node/1940',
  'notation': ['WD'],
  'namespace': 'http://www.wikidata.org/entity/',
  'notationPattern': 'Q[1-9][0-9]*',
  'uriPattern': '^http://www\\.wikidata\\.org/entity/(Q[1-9][0-9]*)$'
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
    if (/^[QP][1-9][0-9]*$/.test(id)) {
      id = 'http://www.wikidata.org/entity/' + id
    }
    return wikidataConceptScheme.detectConcept(id)
  }

  detectConceptSchemeURI (scheme) {
    if (scheme.match(/^http:\/\/bartoc\.org\/en\/node\/[0-9]+$/)) {
      return scheme
    } else if (scheme.match(/^[0-9]+$/)) {
      return 'http://bartoc.org/en/node/' + scheme
    } else if (scheme.match(/^P[0-9]+$/)) {
      scheme = this.getSchemeOfProperty(scheme)
      return scheme ? scheme.uri : null
    }
  }

  /**
   * Promise an array of JSKOS Concepts.
   */
  getConcepts (query) {
    return getConcepts(query, this)
  }

  /**
   * Promise an array of JSKOS Mappings from Wikidata.
   */
  getMappings (query) {
    if (query.direction === 'backward') {
      [query.from, query.fromScheme, query.to, query.toScheme] =
        [query.to, query.toScheme, query.from, query.fromScheme]
      delete query.direction
    }

    if (!query.from && !query.to && query.to !== '0') {
      return Promise.resolve([])
    }

    query.languages = selectedLanguages(query)

    cleanupQuery(query)
    debug.query(query)

    let promises = []

    if (query.mode === 'or') {
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
      } else if (query.to || query.to === '0') {
        promises.push(getMappingsTo(query, this))
      }
    }

    if (query.direction === 'both') {
      query.direction = 'backward'
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
  getMappingSchemes: require('./load-mapping-schemes')
},
mappers,
types
)
