require("./polyfills.js")

const wdk = require("wikidata-sdk")
const breq = require("bluereq")
const promiseRequest = url => breq.get(url).get("body")
const { sparqlRows, selectedLanguages, labelFromSparql } = require("./utils.js")
const IdentifierProperty = require("./identifier-property.js")
const types = require("./types.js")
const mappers = require("./mappers.js")
const { mapEntity, mapLabels } = mappers
const { addMappingIdentifiers } = require("./jskos")

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
  }

  getMapppingsTo(uri, languages) {
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
      var { from, to } = query

      const languages = selectedLanguages(query)

      if (!from && !to) {
        throw {status: 400, message: "parameter from and/or to required!"}
      }

      if (from) {

        // only support mappings from Wikidata
        from = this.detectWikidataConcept(from)
        if (!from) resolve([])

        const qid = from.notation[0]

        const props = languages.length ? ["claims","labels"] : ["claims"]
        const url = wdk.getEntities(qid, languages, props)

        // TODO: P1709 (equivalent class) etc.

        resolve(promiseRequest(url)
          .then(res => res.entities[qid])
          .then(entity => {
            Object.assign(from, mapLabels(entity.labels))
            return entity.claims || {}
          })
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
            return mappings.map(addMappingIdentifiers)
          }))
      } else if(to) {
        resolve(this.getMapppingsTo(to, languages))
      }
    })
  }

}

/**
 * load schemes via SPARQL.
 */
function getMappingSchemes(query) {
  query = query || {}
  const languages = selectedLanguages(query)

  const sparql = `
    SELECT ?property ?scheme ?schemeLabel ?bartoc ?P1921 ?P1793 WHERE {
      ?property wdt:P1921 ?P1921 .
      ?property wdt:P1793 ?P1793 .
      ?property wdt:P1629 ?scheme .
      ?scheme wdtn:P2689 ?bartoc .
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${languages.join(",")}".
      }
    }`

  return sparqlRows(sparql, promiseRequest)
    .then(rows => {
      return rows.map(row => {
        const scheme = {
          uri: row.bartoc.value,
          identifier: [row.scheme.value],
          PROPERTY: row.property.value.split("/").pop(),
          P1793: row.P1793.value,
          P1921: row.P1921.value,
        }
        if (row.schemeLabel) {
          scheme.prefLabel = labelFromSparql(row.schemeLabel)
        }
        return scheme
      })
    })
}

module.exports = {
  IdentifierProperty,
  getMappingSchemes,
  service: WikidataJSKOSService
}

Object.assign(module.exports, mappers, types)
