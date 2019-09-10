const { httpRequest } = require("../utils/request")
const { addMappingIdentifiers } = require("jskos-tools")
const { getEntities } = require("../utils/wdk")
const { mapLabels, mapMappingClaims } = require("../mappers")

function getMappingsFrom (args, schemes) {
  let { from, to, fromScheme, toScheme, languages } = args

  from = (from || "").split("|").map(uri => schemes.detectWikidataConcept(uri)).filter(Boolean)
  if (!from.length) return Promise.resolve([])

  if (toScheme) {
    schemes = schemes.filter(scheme => scheme.uri === toScheme)
    if (schemes.isEmpty()) {
      return Promise.resolve([])
    }
  }

  const qids = from.map(concept => concept.notation[0])
  const props = languages.length ? ["claims", "labels"] : ["claims"]
  const url = getEntities(qids, languages, props)

  return Promise.resolve(httpRequest(url)
    .then(res => res.entities)
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

      return mappings.map(addMappingIdentifiers)
    })
  )
}

module.exports = getMappingsFrom
