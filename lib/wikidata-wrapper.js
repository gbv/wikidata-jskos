const wdk = require("wikidata-sdk") 
const breq = require("bluereq")

/**
 * Provides JSKOS Mappings from Wikidata.
 */
class WikidataWrapper {

  constructor() {

    this.schemes = {
      "http://bartoc.org/en/node/1940": {
        "uri": "http://bartoc.org/en/node/1940",
        "P1921": "http://www.wikidata.org/entity/$1",
        "P1793": "Q[1-9][0-9]*"
      },
      "http://bartoc.org/en/node/430": {
        "uri": "http://bartoc.org/en/node/430",
        "PROPERTY": "P227",
        "P1921": "http://d-nb.info/gnd/$1",
        "P1793": "1[01]?\\d{7}[0-9X]|[47]\\d{6}-\\d|[1-9]\\d{0,7}-[0-9X]|3\\d{7}[0-9X]"
      }
    }
    
    this.properties = {}
    Object.keys(this.schemes).forEach(uri => {
      var scheme = this.schemes[uri]
      if (scheme.PROPERTY) {
        this.properties[scheme.PROPERTY] = this.schemes[scheme.uri]
      }
    })
  }

  buildRegex(template, pattern) {
    return RegExp("^" + template.split("$1").map(s => 
      s.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1")                
    ).join("("+pattern+")") + "$")
  }

  detectConcept(uri) {
    const schemes = this.schemes
    for (let schemeUri in schemes) {
      const scheme = schemes[schemeUri]

      if (!scheme.REGEX) {
        scheme.REGEX = this.buildRegex(scheme.P1921, scheme.P1793)
      }

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

  mappingsFromClaims(from, scheme, claims) {
    // TODO: respect rank and special unknown values
    return claims.map(claim => {
      var { id, mainsnak } = claim
      var value = mainsnak.datavalue.value
      var mapping = { 
        uri: "http://www.wikidata.org/entity/statement/" + id.replace("$","-"),
        from: { memberSet: [ from ] },
        to: {
          memberSet: [
            { 
              uri: scheme.P1921.replace("$1", value),
              inScheme: [{uri: scheme.uri}]
            }
          ]
        }
      }
      return mapping
    })
  }

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
        const schemes = this.properties

        resolve(breq.get(url)
          .then(res => res.body.entities || {})
          .then(entities => (entities[qid] || {}).claims)
          .then(claims => {
            var mappings = []
            Object.keys(claims).forEach(p => {
              const scheme = schemes[p]
              if (scheme) {
                mappings.push(...this.mappingsFromClaims(from, scheme, claims[p]))
              }
            })
            return mappings 
          }))
      } else {
        resolve([])
      }
    })
  }
}

module.exports = WikidataWrapper
