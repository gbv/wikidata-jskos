const { httpRequest } = require('../utils/request.js')
const { addMappingIdentifiers } = require('jskos-tools')
const { getEntities } = require('wikidata-sdk')
const { mapLabels, mapMappingClaims } = require('../mappers.js')

function getMappingsFrom (args, schemes) {
  let { from, to, toScheme, languages } = args

  // only support mappings from Wikidata
  from = schemes.detectWikidataConcept(from)
  if (!from) {
    return Promise.resolve([])
  }

  from.inScheme = [{
    notation: [ 'WD' ],
    uri: 'http://bartoc.org/en/node/1940'
  }]

  if (toScheme) {
    toScheme = schemes.detectConceptSchemeURI(toScheme)
    if (!toScheme) {
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
