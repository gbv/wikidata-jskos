require("./polyfills.js")

const wdk = require("wikidata-sdk")
const breq = require("bluereq")
const promiseRequest = url => breq.get(url).get("body")

const IdentifierProperty = require("./identifier-property.js")
const types = require("./types.js")
const mappers = require("./mappers.js")

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
      "P1921": "http://www.wikidata.org/entity/$1",
      "P1793": "Q[1-9][0-9]*"
    })

    // add identifier property, if possible
    items.forEach(scheme => {
      if (scheme.P1921 && scheme.P1793) {
        scheme.IDPROP = new IdentifierProperty({
          id: scheme.PROPERTY,
          template: scheme.P1921,
          pattern: scheme.P1793})
        delete scheme.P1921
        delete scheme.P1793
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
      if (item.P1921) {
        item.namespace = item.P1921.replace(/[$]1.*/, "")
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
        concept.inScheme = [{uri: scheme.uri}]
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
      mapping.to.memberSet[0].inScheme = [{uri: scheme.uri}]
    })
    return mappings
  }

  getConcepts(query) {
    const concept = this.detectWikidataConcept(query.uri)
    if (!concept) return Promise.resolve([])

    var languages = query.language || query.languages || ["de","en","ja"]
    if (!Array.isArray(languages)) {
      languages = languages.split(/,/)
    }

    const url = wdk.getEntities([concept.notation[0]], languages)

    return promiseRequest(url)
      .then(res => res.entities || {})
      .then(entities => Object.values(entities).map(mappers.mapEntity))
  }

  getMapppingsTo(uri) {
    const concept = this.detectConcept(uri)
    if (!concept) {
      return Promise.resolve([])
    }

    const scheme = this.schemes[concept.inScheme[0].uri]
    const pid = scheme ? scheme.IDPROP.id : undefined

    if (!pid) {
      return Promise.resolve([])
    }

    const languages = "en,de" // TODO: [AUTO_LANGUAGE]

    const sparql = `
      SELECT ?entity ?statement ?entityLabel ?type WHERE {
        ?entity wdtn:${pid} <${concept.uri}> .
        ?entity p:${pid} ?statement .
        OPTIONAL {
          ?statement pq:P4390 [ wdt:P1709 ?type ]
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${languages}". }
      }`
    const url = wdk.sparqlQuery(sparql)

    return promiseRequest(url)
      .then(res => {
        return res.results.bindings.map(row => {
          const entity = {
            uri: row.entity,
            inScheme: [ { uri: "http://bartoc.org/en/node/1940" } ]
          }
          if (row.entityLabel) {
            entity.prefLabel = {"-": "?"}
            entity.prefLabel[row.entityLabel["xml:lang"]] = row.entityLabel.value
          }    
          if (row.type) {
            entity.type = [ row.type.value ]
          }
          return {
            uri: row.statement.value,
            from: { memberSet: [ entity ] },
            to: { memberSet: [ concept ] },
          }
        })
      })
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
      var { from, to } = query

      if (!from && !to) {
        throw {status: 400, message: "parameter from and/or to required!"}
      }

      if (from) {

        // only support mappings from Wikidata
        from = this.detectWikidataConcept(from)
        if (!from) resolve([])

        const qid = from.notation[0]
        const url = wdk.getEntities(qid, ["de","en"], ["claims"])

        // TODO: P1709 (equivalent class) etc.

        resolve(promiseRequest(url)
          .then(res => res.entities || {})
          .then(entities => (entities[qid] || {}).claims)
          .then(claims => {
            var mappings = []
            for (let p in claims) {
              const scheme = this.properties[p]
              // TODO: filter via fromScheme/toScheme?
              // TODO: filter with to
              if (scheme) {
                mappings.push(...this.mappingsFromClaims(from, scheme, claims[p]))
              }
            }
            return mappings
          }))
      } else if(to) {
        resolve(this.getMapppingsTo(to))
      }
    })
  }

}

/**
 * load schemes via SPARQL.
 */
function getMappingSchemes() {
  const sparql = `
    SELECT * WHERE {
      ?PROPERTY wdt:P1921 ?P1921 .
      ?PROPERTY wdt:P1793 ?P1793 .
      ?PROPERTY wdt:P1629 ?identifier .
      ?identifier wdt:P2689 ?BARTOC .
      OPTIONAL {
        ?identifier rdfs:label ?prefLabel
        FILTER (LANG(?prefLabel) = "en").
      }
    }`
  const url = wdk.sparqlQuery(sparql)

  return promiseRequest(url)
    .then(wdk.simplifySparqlResults)
    .then(schemes => {
      schemes.forEach(scheme => {
        scheme.uri = "http://bartoc.org/en/node/" + scheme.BARTOC
        delete scheme.BARTOC
        scheme.identifier = ["http://www.wikidata.org/entity/"+scheme.identifier]
        if (scheme.prefLabel) {
          scheme.prefLabel = { en: scheme.prefLabel }
        }
        return scheme
      })
      return schemes
    })
}

module.exports = {
  IdentifierProperty,
  getMappingSchemes,
  service: WikidataJSKOSService
}

Object.assign(module.exports, mappers, types)
