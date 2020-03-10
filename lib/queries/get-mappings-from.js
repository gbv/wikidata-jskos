const { httpRequest } = require("../request")
const { getEntities } = require("../wdk")
const { mapLabels, mapMappingClaims } = require("../mappers")
const { detectWikidataConcepts } = require("../utils")

async function getMappingsFrom (args, schemes) {
  let { from, to, fromScheme, toScheme, languages } = args

  from = detectWikidataConcepts(from)
  if (!from.length) return []

  if (fromScheme && fromScheme !== "http://bartoc.org/en/node/1940") return []

  if (toScheme) {
    schemes = schemes.filter(scheme => scheme.uri === toScheme)
    if (schemes.isEmpty()) {
      return []
    }
  }

  const qids = from.map(concept => concept.notation[0])
  const props = languages.length ? ["claims", "labels"] : ["claims"]
  const url = getEntities(qids, languages, props)

  return httpRequest(url)
    .then(res => res.entities || [])
    .then(res => {
      var mappings = []

      from.forEach(fromConcept => {
        console.log(fromConcept)

        let entity = res[fromConcept.notation[0]]
        if (entity) {
          Object.assign(fromConcept, mapLabels(entity.labels))
          var claims = entity.claims || {}
          mappings.push(...mapMappingClaims(claims, { from: fromConcept, schemes, to }))
        }
      })

      return mappings
    })
}

module.exports = getMappingsFrom
