require("./polyfills.js")

const wdk = require("wikidata-sdk")
const breq = require("bluereq")
const promiseRequest = url => breq.get(url).get("body")

/**
 * Provides JSKOS Mappings from Wikidata.
 */
class WikidataWrapper {

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
   * Static function to load Schemes via SPARQL.
   */
  static getMappingSchemes() {
    const sparql = `
      SELECT * WHERE {
        ?PROPERTY wdt:P1921 ?P1921 .
        ?PROPERTY wdt:P1793 ?P1793 .
        ?PROPERTY wdt:P1629 ?identifier .
        ?identifier wdt:P2689 ?BARTOC .
        ?identifier rdfs:label ?prefLabel .
        FILTER (LANG(?prefLabel) = "en").
      }`
    const url = wdk.sparqlQuery(sparql)

    return promiseRequest(url)
      .then(wdk.simplifySparqlResults)
      .then(schemes => {
        schemes.forEach(scheme => {
          scheme.uri = "http://bartoc.org/en/node/" + scheme.BARTOC
          delete scheme.BARTOC
          scheme.identifier = ["http://www.wikischeme.org/entity/"+scheme.identifier]
          if (scheme.prefLabel) {
            scheme.prefLabel = { en: scheme.prefLabel }
          }
          return scheme
        })
        return schemes
      })
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

  expandConcept(property, value) {
    return {
      uri: property.P1921.replace("$1", value),
      notation: [value],
      inScheme: [{uri: property.uri}]
    }
  }

  mappingsFromClaims(from, property, claims) {
    // TODO: respect rank and special unknown values
    return claims.map(claim => {
      var { id, mainsnak } = claim
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
      return mapping
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
        from = this.detectConcept(from)
        if (!from || from.inScheme[0].uri != "http://bartoc.org/en/node/1940") resolve([])
      }

      if (to) {
        to = this.detectConcept(to)
        if (!to) resolve([])
      }

      if (from) {
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
              if (scheme) {
                mappings.push(...this.mappingsFromClaims(from, scheme, claims[p]))
              }
            }
            return mappings
          }))
      } else {
        resolve([])
      }
    })
  }
}

module.exports = WikidataWrapper
