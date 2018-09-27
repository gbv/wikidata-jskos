require("./utils/polyfills.js")

const wdk = require("wikidata-sdk")
const { selectedLanguages } = require("./utils.js")
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
      "PATTERN": "Q[1-9][0-9]*"
    })

    // add identifier property, if possible
    items.forEach(scheme => {
      if (scheme.PREFIX && scheme.PATTERN) {
        scheme.IDPROP = new IdentifierProperty({
          id: scheme.PROPERTY,
          template: scheme.PREFIX,
          pattern: scheme.PATTERN})
        delete scheme.PREFIX
        delete scheme.PATTERN
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

  getConcepts(query) {
    return getConcepts(query, this)
  }

  getMappingsFrom(args) {
    return getMappingsFrom(args, this)
  }

  getMappingsTo(args) {
    return getMappingsTo(args, this)
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
    return new Promise( resolve => {
      debug.query(query)

      const { from, to } = query

      query.languages = selectedLanguages(query)

      if (from) {
        resolve(this.getMappingsFrom(query))
      } else if(to) {
        resolve(this.getMappingsTo(query))
      } else {
        throw {status: 400, message: "parameter from and/or to required!"}
      }
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
