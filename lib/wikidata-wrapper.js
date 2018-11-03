require("./utils/polyfills.js")

const wdk = require("wikidata-sdk")
const { selectedLanguages, cleanupQuery } = require("./utils.js")
const IdentifierProperty = require("./identifier-property.js")
const types = require("./types.js")
const mappers = require("./mappers.js")

const debug = require("./utils/debug.js")

const getMappingsFrom = require("./queries/get-mappings-from.js")
const getMappingsTo = require("./queries/get-mappings-to.js")
const getConcepts = require("./queries/get-concepts.js")


/**
 * Provides JSKOS Mappings from Wikidata.
 */
class WikidataJSKOSService {

  /**
   * Prepare schemes and properties for quick lookup.
   */
  constructor(schemes) {
    // include all schemes with a PROPERTY
    var items = (schemes || []).filter(scheme => scheme.PROPERTY)

    // add Wikidata as scheme
    items.push({
      "uri": "http://bartoc.org/en/node/1940",
      "notation": ["WD"],
      "PREFIX": "http://www.wikidata.org/entity/$1",
      "notationPattern": "Q[1-9][0-9]*"
    })

    // add identifier property, if possible
    items.forEach(scheme => {
      if (scheme.PREFIX && scheme.notationPattern) {
        scheme.IDPROP = new IdentifierProperty({
          id: scheme.PROPERTY,
          template: scheme.PREFIX,
          pattern: scheme.notationPattern})
        delete scheme.PREFIX
      } else {
        scheme.IDPROP = { id: scheme.PROPERTY }
      }
      delete scheme.PROPERTY
    })

    // index by Wikidata property
    this.properties = items.reduce( (obj, scheme) => {
      obj[scheme.IDPROP.id || ""] = scheme
      return obj
    }, {})

    // index by URI
    this.schemes = items.reduce( (obj, item) => {
      if (item.PREFIX) {
        item.namespace = item.PREFIX.replace(/[$]1.*/, "")
      }
      obj[item.uri] = item
      return obj
    }, {})
  }

  /**
   * Guess a JSKOS Concept via its URI.
   */
  detectConcept(uri) {
    for (let schemeUri in this.schemes) {
      const scheme = this.schemes[schemeUri]
      const concept = scheme.IDPROP.detectConcept(uri)
      if (concept) {
        concept.inScheme = [{uri: scheme.uri, notation: scheme.notation}]
        return concept
      }
    }
    return
  }

  detectWikidataConcept(id) {
    // TODO: could speed up this
    if (/^[QP][1-9][0-9]*$/.test(id)) {
      id = "http://www.wikidata.org/entity/" + id
    }
    const item = this.detectConcept(id)
    if (!item || item.inScheme[0].uri != "http://bartoc.org/en/node/1940") {
      return
    }
    return item
  }

  detectConceptSchemeURI(scheme) {
    if (scheme.match(/^http:\/\/bartoc\.org\/en\/node\/[0-9]+$/)) {
      return scheme
    } else if (scheme.match(/^[0-9]+$/)) {
      return "http://bartoc.org/en/node/" + scheme
    } else if (scheme.match(/^P[0-9]+$/) ) {
      scheme = Object.values(schemes.schemes).find(
        (s) => { return s.IDPROP.id == scheme }
      )
      return scheme ? scheme.uri : null
    }
  }

  mappingsFromClaims(from, scheme, claims) {
    const mappings = scheme.IDPROP.mapPropertyClaims(wdk.truthyPropertyClaims(claims))
    mappings.forEach(mapping => {
      mapping.from = { memberSet: [ from ] }
      mapping.to.memberSet[0].inScheme = [{
        uri: scheme.uri,
        notation: scheme.notation
      }]
    })
    return mappings
  }

  /**
   * Promise an array of JSKOS Concepts.
   */
  getConcepts(query) {
    return getConcepts(query, this)
  }

  /**
   * Promise an array of JSKOS Concept Schemes.
   */
  getSchemes() {
    return Promise.resolve(Object.values(this.schemes))
  }

  /**
   * Promise an array of JSKOS Mappings from Wikidata.
   */
  getMappings(query) {

    if (query.direction === "backward") {
      [query.from, query.fromScheme, query.to, query.toScheme] =
        [query.to, query.toScheme, query.from, query.fromScheme]
      delete query.direction
    }

    if (!query.from && !query.to && query.to !== "0") {
      return Promise.resolve([])
    }

    query.languages = selectedLanguages(query)

    cleanupQuery(query)
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

    return Promise.all(promises)
      .then( arrays => {
        // filter unique mappings
        const mappings = []
        arrays.forEach( array => array.forEach(
          mapping => {
            if (!mappings.find(
              m => m.identifier[0] == mapping.identifier[0]
            )) {
              mappings.push(mapping)
            }
          }
        ))
        return mappings
      })
  }

}

module.exports = Object.assign({
  IdentifierProperty,
  service: WikidataJSKOSService,
  getMappingSchemes: require("./load-mapping-schemes")
},
mappers,
types
)
