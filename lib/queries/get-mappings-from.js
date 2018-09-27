const { httpRequest } = require("../utils/request.js")
const { addMappingIdentifiers } = require("jskos-tools")
const { getEntities } = require("wikidata-sdk")
const { mapLabels } = require("../mappers.js")


function getMappingsFrom(args, schemes) {
  let { from, toScheme, languages } = args

  // only support mappings from Wikidata
  from = schemes.detectWikidataConcept(from)
  if (!from) {
    return Promise.resolve([])
  }

  if (toScheme) {
    if (toScheme.match(/^[0-9]+$/)) {
      toScheme = "http://bartoc.org/en/node/" + toScheme
    } else if (toScheme.match(/^P[0-9]+$/) ) {
      let scheme = Object.values(schemes.schemes).find(
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
  const url = getEntities(qid, languages, props)

  // TODO: P1709 (equivalent class) etc.

  return Promise.resolve(httpRequest(url)
    .then(res => res.entities[qid])
    .then(entity => {
      Object.assign(from, mapLabels(entity.labels))
      return entity.claims || {}
    })
    .then(claims => {
      var mappings = []
      for (let p in claims) {
        const scheme = schemes.properties[p]
        // TODO: filter with to
        if (scheme) {
          if (!toScheme || toScheme == scheme.uri) {
            mappings.push(...schemes.mappingsFromClaims(from, scheme, claims[p]))
          }
        }
      }
      return mappings.map(addMappingIdentifiers)
    }))
}

module.exports = getMappingsFrom
