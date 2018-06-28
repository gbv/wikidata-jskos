/**
 * Functions to map Wikidata entities to JSKOS items.
 *
 * All functions expect a Wikidata entity and return a JSKOS item.
 */

const { entityTypes } = require("./utils.js")

function mapIdentifier(id) {
  return { uri: "http://www.wikidata.org/entity/" + id }
}

function mapInfo(entity) {
  const type = [
    "http://www.w3.org/2004/02/skos/core#Concept",
    entityTypes[entity.type]
  ]
  return {
    modified: entity.modified,
    type,
    inScheme: [{uri: "http://bartoc.org/en/node/1940"}],
  }
}

function mapLabels(entity) {
  return entity.labels
    ? { prefLabel: Object.assign(entity.labels, { "-": "?" }) }
    : { }
}

function mapAliases(entity) {
  return entity.aliases
    ? { altLabel: Object.assign(entity.aliases, {"-": []})  }
    : {}
}

function mapDescriptions(entity) {
  const descriptions = entity.descriptions || {}
  const languages = Object.keys(descriptions)
  if (languages.length) {
    const scopeNote = languages.reduce( (notes, lang) => {
      notes[lang] = [ descriptions[lang] ]
      return notes
    }, {"-":[]}
    )
    return { scopeNote }
  } else {
    return {}
  }
}

function mapClaims(entity) {
  const claims = entity.claims
  if (!claims) return {}

  const mappings = {
    P856: ["url", false],
    // TODO: urlencode media
    P18: ["depiction", media => "http://commons.wikimedia.org/wiki/Special:FilePath/" + media ],
    P279: ["broader"],
    P31: ["broader"],
    P131: ["broader"], // administrative territorial entity
    P361: ["broader"], // part of
    P1433: ["broader"], // published in
    P155: ["previous"],
    P156: ["next"],
    P569: ["startDate", false],
    P571: ["startDate", false],
    P580: ["startDate", false],
    P592: ["endDate", false],
    P576: ["endDate", false],
  }

  var concept = {}

  for (let property in claims) {
    const propertyClaims = claims[property]

    var mapping = mappings[property]
    if (!mapping) continue

    const field = mapping.shift()

    // single value, just take the first
    if (mapping[0] === false) {
      const transform = mapping[1] || (x => x)
      concept[field] = transform(propertyClaims[0])
    } else {
      // multiple values, concat
      const transform = mapping[0] || this.mapIdentifier
      const values = propertyClaims.map(transform)
      if (concept[field]) {
        concept[field].concat(values)
      } else {
        concept[field] = values
      }
    }
  }

  // TODO: make sets uniq

  return concept
}

function mapSitelinks() {
  return {} // TODO
}

function mapEntity(entity) {
  return Object.assign(
    mapIdentifier(entity.id),
    mapLabels(entity),
    mapAliases(entity),
    mapDescriptions(entity),
    mapClaims(entity.claims),
    mapSitelinks(entity.sitelinks),
    mapInfo(entity)
  )
}

module.exports = {
  identifier: mapIdentifier,
  labels: mapLabels,
  aliases: mapAliases,
  descriptions: mapDescriptions,
  claims: mapClaims,
  sitelinks: mapSitelinks,
  info: mapInfo,
  entity: mapEntity,
}
