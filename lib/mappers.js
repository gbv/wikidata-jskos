/**
 * Functions to map Wikidata entities to JSKOS items.
 */

import wdk from "./wdk.js"
import { entityTypes } from "./types.js"
import wikidata from "./wikidata.js"

function mapIdentifier (id) {
  return {
    uri: "http://www.wikidata.org/entity/" + id,
    notation: [ id ],
  }
}

function mapSimpleLabels (labels) {
  return labels ? { prefLabel: Object.assign(labels, { "-": "?" }) } : {}
}

function mapSimpleAliases (aliases) {
  return aliases ? { altLabel: Object.assign(aliases, { "-": [] }) } : {}
}

function mapSimpleDescriptions (descriptions) {
  const languages = Object.keys(descriptions || {})
  if (languages.length) {
    const scopeNote = languages.reduce((notes, lang) => {
      notes[lang] = [ descriptions[lang] ]
      return notes
    }, { "-": [] },
    )
    return { scopeNote }
  } else {
    return {}
  }
}

function mapMappingClaims (claims, options = {}) {
  const { from, to, schemes } = options
  var mappings = []

  // TODO: P1709 (equivalent class) etc.
  if (schemes) {
    for (let p in claims) {
      const scheme = schemes.getSchemeOfProperty(p)
      if (scheme) {
        let list = scheme.mapPropertyClaims(wdk.truthyPropertyClaims(claims[p]))
        list.forEach(mapping => {
          mapping.fromScheme = {
            uri: wikidata.uri,
            notation: wikidata.notation,
          }
          mapping.toScheme = {
            uri: scheme.uri,
            notation: scheme.notation,
          }
          mapping.from = { memberSet: [ ] }
          if (from) {
            mapping.from.memberSet[0] = from
          }
        })

        if (to) {
          list = list.filter(e => e.to.memberSet.find(c => c.uri === to))
        }
        mappings.push(...list)
      }
    }
  }
  return mappings
}

function mapSimpleClaims (claims) {
  if (!claims) {
    return {}
  }

  const mediaUrl = media => "http://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(media)

  const mappings = {
    P856: ["url", false],
    P18: ["depiction", mediaUrl],
    P279: ["broader"], // subclass of
    P31: ["broader"], // instance of
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
    P625: ["location", false, (coord) => {
      return { type: "Point", coordinates: [ coord[1], coord[0] ] } // lon, lat
    }],
  }

  var concept = {}

  for (let property in claims) {
    const propertyClaims = claims[property]

    var mapping = mappings[property]
    if (!mapping) {
      continue
    }

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

function mapSimpleSitelinks (sitelinks) {
  if (!sitelinks) {
    return {}
  }

  // TODO: get sitelinks-matrix and filter by language?
  return {
    occurrences: [
      {
        database: { uri: "http://www.wikidata.org/entity/Q2013" },
        relation: "http://schema.org/about",
        count: Object.keys(sitelinks).length,
      },
    ],
    subjectOf: Object.keys(sitelinks).map(site => {
      try {
        return {
          url: wdk.getSitelinkUrl({site, title: sitelinks[site]}),
        }
      } catch (e) {
        // just ignore unkown sites

      }
    }).filter(site => site),
  }
}

function mapInfo (entity) {
  const type = [
    "http://www.w3.org/2004/02/skos/core#Concept",
    entityTypes[entity.type],
  ]
  return {
    modified: entity.modified,
    type,
    inScheme: [{ uri: wikidata.uri }],
  }
}

function mapSimpleEntity (entity) {
  return Object.assign(
    mapIdentifier(entity.id),
    mapSimpleLabels(entity.labels),
    mapSimpleAliases(entity.aliases),
    mapSimpleDescriptions(entity.descriptions),
    mapSimpleClaims(entity.claims),
    mapSimpleSitelinks(entity.sitelinks),
    mapInfo(entity),
  )
}

const mapLabels = labels => {
  return labels ? mapSimpleLabels(wdk.simplify.labels(labels)) : {}
}

const mapAliases = aliases => mapSimpleAliases(wdk.simplify.aliases(aliases))

const mapDescriptions = descriptions => mapSimpleDescriptions(wdk.simplify.descriptions(descriptions))

const mapClaims = claims => mapSimpleClaims(wdk.simplify.claims(claims))

const mapSitelinks = sitelinks => mapSimpleSitelinks(wdk.simplify.sitelinks(sitelinks))

const mapEntity = entity => mapSimpleEntity(wdk.simplify.entity(entity))

export {
  mapIdentifier as mapSimpleIdentifier,
  mapSimpleLabels,
  mapSimpleAliases,
  mapSimpleDescriptions,
  mapSimpleClaims,
  mapSimpleSitelinks,
  mapInfo as mapSimpleInfo,
  mapSimpleEntity,
  mapIdentifier,
  mapLabels,
  mapAliases,
  mapDescriptions,
  mapClaims,
  mapSitelinks,
  mapEntity,
  mapInfo,
  mapMappingClaims,
}
