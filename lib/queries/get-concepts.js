const wdk = require("../wdk")
const { selectedLanguages } = require("../utils")
const { detectWikidataConcepts } = require("../utils")
const { httpRequest } = require("../request")
const getBacklinks = require("./get-backlinks")
const { mapEntity } = require("../mappers")

async function getConcepts (query) {
  const concepts = detectWikidataConcepts(query.uri)
  if (!concepts.length) return []

  const languages = selectedLanguages(query)
  const props = ["info", "sitelinks", "labels", "descriptions", "claims"]
  const url = wdk.getEntities(concepts.map(concept => concept.notation[0]), languages, props)

  return httpRequest(url)
    .then(res => res.entities || {})
    .then(entities => Object.values(entities).filter(e => !("missing" in e)))
    .then(entities => entities.map(mapEntity))
    .then(entities => {
      if (!entities.length) return []
      const index = {}
      entities.forEach(e => { index[e.uri] = e })
      const rels = ["P361", "P31", "P279", "P131"]
      return getBacklinks(Object.keys(index), languages, rels)
        .then(backlinks => {
          backlinks.forEach(bl => {
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
}

module.exports = getConcepts
