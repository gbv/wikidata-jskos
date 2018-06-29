/**
 * Functions to map Wikidata entities to JSKOS items.
 */

const wdk = require("wikidata-sdk")
const { entityTypes } = require("./utils.js")

function mapIdentifier(id) {
  return  { uri: "http://www.wikidata.org/entity/" + id } 
}

const simplified = {

  identifier: mapIdentifier,

  labels(labels) {
    return labels ? { prefLabel: Object.assign(labels, { "-": "?" }) } : {}
  },

  aliases(aliases) {
    return aliases ? { altLabel: Object.assign(aliases, {"-": []})  } : {}
  },

  descriptions(descriptions) {
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
  },

  claims(claims) {
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
  },

  sitelinks(sitelinks) {
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
  },

  info(entity) {
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

}

simplified.entity = function (entity) {
  return Object.assign(
    simplified.identifier(entity.id),
    simplified.labels(entity.labels),
    simplified.aliases(entity.aliases),
    simplified.descriptions(entity.descriptions),
    simplified.claims(entity.claims),
    simplified.sitelinks(entity.sitelinks),
    simplified.info(entity)
  )
}

module.exports = {
  identifier: mapIdentifier,
  labels: labels => simplified.labels(wdk.simplify.labels(labels)),
  aliases: aliases => simplified.aliases(wdk.simplify.aliases(aliases)),
  descriptions: descriptions => simplified.descriptions(wdk.simplify.descriptions(descriptions)),
  claims: claims => simplified.claims(wdk.simplify.claims(claims)),
  sitelinks: sitelinks => simplified.sitelinks(wdk.simplify.sitelinks(sitelinks)),
  info: simplified.info,
  entity: entity => simplified.entity(wdk.simplify.entity(entity)),
  simplified
}
