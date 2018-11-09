const { httpRequest } = require('../utils/request.js')
const { addMappingIdentifiers } = require('jskos-tools')
const { getEntities } = require('wikidata-sdk')
const { mapLabels, mapMappingClaims } = require('../mappers.js')

function getMappingsFrom (args, schemes) {
  let { from, to, fromScheme, toScheme, languages } = args

  // only support mappings from Wikidata
  from = schemes.detectWikidataConcept(from)
  if (!from || (fromScheme && fromScheme !== 'http://bartoc.org/en/node/1940')) {
    return Promise.resolve([])
  }

  if (toScheme) {
    schemes = schemes.filter(scheme => scheme.uri === toScheme)
    if (schemes.isEmpty()) {
      return Promise.resolve([])
    }
  }

  const qid = from.notation[0]
  const props = languages.length ? ['claims', 'labels'] : ['claims']
  const url = getEntities(qid, languages, props)

  return Promise.resolve(httpRequest(url)
    .then(res => res.entities[qid])
    .then(entity => {
      Object.assign(from, mapLabels(entity.labels))
      return entity.claims || {}
    })
    .then(claims => mapMappingClaims(claims, { from, schemes, to }))
    .then(mappings => mappings.map(addMappingIdentifiers))
  )
}

module.exports = getMappingsFrom
