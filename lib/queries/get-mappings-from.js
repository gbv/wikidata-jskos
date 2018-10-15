const { httpRequest } = require("../utils/request.js")
const { addMappingIdentifiers } = require("jskos-tools")
const { getEntities } = require("wikidata-sdk")
const { mapLabels } = require("../mappers.js")


function getMappingsFrom(args, schemes) {
  let { from, to, toScheme, languages } = args

  // only support mappings from Wikidata
  from = schemes.detectWikidataConcept(from)
  if (!from) {
    return Promise.resolve([])
  }

  if (toScheme) {
    toScheme = schemes.detectConceptSchemeURI(toScheme)
    if (!toScheme) {
      return Promise.resolve([])
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
        if (scheme) { // && (!toScheme || toScheme == scheme.uri)) {
          let list = schemes.mappingsFromClaims(from, scheme, claims[p])
          if (to) {
            list = list.filter(e => e.to.memberSet.find( c => c.uri === to ))
          }
          mappings.push(...list)
        }
      }
      return mappings.map(addMappingIdentifiers)
    }))
}

module.exports = getMappingsFrom
