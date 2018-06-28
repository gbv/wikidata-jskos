require("./polyfills.js")

const wdk = require("wikidata-sdk")
const breq = require("bluereq")
const promiseRequest = url => breq.get(url).get("body")

const { entityTypes, mappingTypes } = require("./utils.js")
const entityMapper = require("./entity.js")

/**
 * Provides JSKOS Mappings from Wikidata.
 */
class WikidataWrapper {

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

    // add compiled REGEX, if possible
    items
      .filter(scheme => scheme.P1921 && scheme.P1793)
      .forEach(scheme => {
        const [template, pattern] = [scheme.P1921, scheme.P1793]
        scheme.REGEX = RegExp("^" + template.split("$1").map(s =>
          s.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1")
        ).join("("+pattern+")") + "$")
      })

    // index by Wikidata property
    this.properties = items.reduce( (obj, item) => {
      obj[item.PROPERTY || ""] = item
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

      const match = scheme.REGEX.exec(uri)
      if (match) {
        return {
          uri,
          notation: [match[1]],
          inScheme: [{uri: scheme.uri}]
        }
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

  expandConcept(scheme, value) {
    return {
      uri: scheme.P1921.replace("$1", value),
      notation: [value],
      inScheme: [{uri: scheme.uri}]
    }
  }

  mappingsFromClaims(from, property, claims) {
    // TODO: respect "unknown" values
    return wdk.truthyPropertyClaims(claims).map(claim => {
      var { id, mainsnak, qualifiers } = claim
      var value = mainsnak.datavalue.value
      var mapping = {
        uri: "http://www.wikidata.org/entity/statement/" + id.replace("$","-"),
        from: { memberSet: [ from ] },
        to: {
          memberSet: [
            this.expandConcept(property, value)
          ]
        }
      }
      if (qualifiers && qualifiers.P4390) {
        var type = mappingTypes[qualifiers.P4390[0].datavalue.value.id]
        if (type) {
          mapping.type = [type]
        }
      }
      return mapping
    })
  }

  getConcepts(query) {
    const concept = this.detectWikidataConcept(query.uri)

    if (!concept) return Promise.resolve([])

    const url = wdk.getEntities([concept.notation[0]], ["de"])
    const entityToConcept = entityMapper.entity.bind(this)

    return promiseRequest(url)
      .then(res => res.entities || {})
      .then(wdk.simplify.entities)
      .then(entities => Object.values(entities).map(entityToConcept))
  }

  getMapppingsTo(uri) {
    const concept = this.detectConcept(uri)
    if (!concept) {
      return Promise.resolve([])
    }

    const scheme = this.schemes[concept.inScheme[0].uri]
    if (!scheme || !scheme.PROPERTY) {
      return Promise.resolve([])
    }

    const sparql = `
      SELECT * WHERE {
        ?uri wdtn:${scheme.PROPERTY} <${concept.uri}> .
        ?uri p:${scheme.PROPERTY} ?statement .
        OPTIONAL {
          ?statement pq:P4390 [ wdt:P1709 ?type ]
        }
        OPTIONAL {
          ?uri rdfs:label ?prefLabel
          FILTER (LANG(?prefLabel) = "en")
        }
      }`
    const url = wdk.sparqlQuery(sparql)

    return promiseRequest(url)
      .then(wdk.simplifySparqlResults)
      .then(items => {
        return items.map(item => {
          item.uri = "http://www.wikidata.org/entity/" + item.uri
          if (item.prefLabel !== undefined) {
            item.prefLabel = { en: item.prefLabel }
          }
          uri = "http://www.wikidata.org/entity/" + item.statement.replace("$","-")
          var type = "http://www.w3.org/2004/02/skos/core#mappingRelation"
          if (item.type) {
            type = item.type
            delete item.type
          }
          delete item.statement
          return {
            uri,
            type: [type],
            from: { memberSet: [ item ] },
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

  /**
   * Static function to load Schemes via SPARQL.
   */
  static getMappingSchemes() {
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

  static get mappingTypes() {
    return mappingTypes
  }

  static get entityTypes() {
    return entityTypes
  }

  static get map() {
    return entityMapper 
  }
}

module.exports = WikidataWrapper
