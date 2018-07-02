/**
 * Functions to map Wikidata entities to JSKOS items.
 */

const wdk = require("wikidata-sdk")
const { entityTypes } = require("./types.js")

function mapIdentifier(id) {
  return  { uri: "http://www.wikidata.org/entity/" + id } 
}

function mapSimpleLabels(labels) {
  return labels ? { prefLabel: Object.assign(labels, { "-": "?" }) } : {}
}

function mapSimpleAliases(aliases) {
  return aliases ? { altLabel: Object.assign(aliases, {"-": []})  } : {}
}

function mapSimpleDescriptions(descriptions) {
  const languages = Object.keys(descriptions || {})
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

function mapSimpleClaims(claims) {
  if (!claims) return {}

  const mappings = {
    P856: ["url", false],
    P18: ["depiction", media => "http://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(media) ],
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
      const transform = mapping[0] || mapIdentifier
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

function mapSimpleSitelinks(sitelinks) {
  // TODO: filter by language?
  return sitelinks 
    ? { subjectOf: Object.keys(sitelinks).map( site => {
      try {
        return {
          url: wdk.getSitelinkUrl(site, sitelinks[site])
        }
      } catch(e) {
        // just ignore unkown sites
        return
      }
    }).filter(site => site)
    } : {}
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

function mapSimpleEntity(entity) {
  return Object.assign(
    mapIdentifier(entity.id),
    mapSimpleLabels(entity.labels),
    mapSimpleAliases(entity.aliases),
    mapSimpleDescriptions(entity.descriptions),
    mapSimpleClaims(entity.claims),
    mapSimpleSitelinks(entity.sitelinks),
    mapInfo(entity)
  )
}

module.exports = {
  mapSimpleIdentifier: mapIdentifier,
  mapSimpleLabels,
  mapSimpleAliases,
  mapSimpleDescriptions,
  mapSimpleClaims,
  mapSimpleSitelinks,
  mapSimpleInfo: mapInfo,
  mapSimpleEntity,
  mapIdentifier,
  mapLabels: labels => mapSimpleLabels(wdk.simplify.labels(labels)),
  mapAliases: aliases => simplifiedAliases(wdk.simplify.aliases(aliases)),
  mapDescriptions: descriptions => simplifiedDescriptions(wdk.simplify.descriptions(descriptions)),
  mapClaims: claims => simplifiedClaims(wdk.simplify.claims(claims)),
  mapSitelinks: sitelinks => mapSimpleSitelinks(wdk.simplify.sitelinks(sitelinks)),
  mapEntity: entity => mapSimpleEntity(wdk.simplify.entity(entity)),
  mapInfo
}
