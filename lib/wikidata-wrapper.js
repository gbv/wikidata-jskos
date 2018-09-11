require("./polyfills.js")

const wdk = require("wikidata-sdk")
const {
  sparqlRows, selectedLanguages, labelFromSparql, promiseRequest
} = require("./utils.js")
const IdentifierProperty = require("./identifier-property.js")
const types = require("./types.js")
const mappers = require("./mappers.js")
const { mapEntity, mapLabels } = mappers
const { addMappingIdentifiers } = require("jskos-tools")
const { getBacklinks } = require("./backlinks")

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

    const languages = selectedLanguages(query)
    const props = ["info", "sitelinks", "labels", "descriptions", "claims"]
    const url = wdk.getEntities([concept.notation[0]], languages, props)

    return promiseRequest(url)
      .then(res => res.entities || {})
      .then(entities => Object.values(entities).map(mapEntity))
      .then(entities => {
        if (!entities.length) return []
        const index = {}
        entities.forEach(e => index[e.uri] = e )
        const rels = ["P361", "P31", "P279", "P131"]
        return getBacklinks(Object.keys(index), languages, rels)
          .then(backlinks => {
            backlinks.forEach(bl => {
              console.log(bl)
              const entity = index[bl[0]]
              if (entity) {
                entity.narrower = entity.narrower || []
                entity.narrower.push(bl[1])
              }
            })
            // TODO: add backlinks
            return Object.values(index)
          })
      })
      //getBacklinks(entity
  }

  /**
   * Mappings from known Wikidata entity.
   */
  getMappingsFrom(args) {
    let { from, toScheme, languages } = args

    // only support mappings from Wikidata
    from = this.detectWikidataConcept(from)
    if (!from) {
      return Promise.resolve([])
    }

    if (toScheme) {
      if (toScheme.match(/^[0-9]+$/)) {
        toScheme = "http://bartoc.org/en/node/" + toScheme
      } else if (toScheme.match(/^P[0-9]+$/) ) {
        let scheme = Object.values(this.schemes).find(
          (s) => { return s.IDPROP.id == toScheme }
        )
        if (scheme) {
          toScheme = scheme.uri
        } else {
          return Promise.resolve([])
        }
      }
    }

    const qid = from.notation[0]

    const props = languages.length ? ["claims","labels"] : ["claims"]
    const url = wdk.getEntities(qid, languages, props)

    // TODO: P1709 (equivalent class) etc.

    return Promise.resolve(promiseRequest(url)
      .then(res => res.entities[qid])
      .then(entity => {
        Object.assign(from, mapLabels(entity.labels))
        return entity.claims || {}
      })
      .then(claims => {
        var mappings = []
        for (let p in claims) {
          const scheme = this.properties[p]
          // TODO: filter with to
          if (scheme) {
            if (!toScheme || toScheme == scheme.uri) {
              mappings.push(...this.mappingsFromClaims(from, scheme, claims[p]))
            }
          }
        }
        return mappings.map(addMappingIdentifiers)
      }))
  }

  /**
   * Mappings from unknown Wikidata entity to known URI.
   */
  getMappingsTo(args) {
    const { uri, languages } = args

    const concept = this.detectConcept(uri)
    if (!concept) {
      return Promise.resolve([])
    }

    const scheme = this.schemes[concept.inScheme[0].uri]
    const pid = scheme ? scheme.IDPROP.id : undefined

    if (!pid) {
      return Promise.resolve([])
    }

    const sparql = `
      SELECT ?entity ?statement ?entityLabel ?type WHERE {
        ?entity wdtn:${pid} <${concept.uri}> .
        ?entity p:${pid} ?statement .
        OPTIONAL {
          ?statement pq:P4390 [ wdt:P1709 ?type ]
        }
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "${languages.join(",")}".
        }
      }`

    return sparqlRows(sparql, promiseRequest)
      .then(rows => {
        return rows.map(row => {
          const entity = {
            uri: row.entity,
            inScheme: [ { uri: "http://bartoc.org/en/node/1940" } ]
          }
          if (row.entityLabel) {
            entity.prefLabel = labelFromSparql(row.entityLabel)
          }
          if (row.type) {
            entity.type = [ row.type.value ]
          }
          return {
            uri: row.statement.value,
            from: { memberSet: [ entity ] },
            to: { memberSet: [ concept ] },
          }
        }).map(addMappingIdentifiers)
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
  service: WikidataJSKOSService
},
mappers,
types,
require("./schemes")
)
