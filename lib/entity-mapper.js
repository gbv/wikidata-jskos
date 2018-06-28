class EntityMapper {

  mapIdentifier(id) {
    return { uri: "http://www.wikidata.org/entity/" + id }
  }

  mapClaims(claims) {
    if (!claims) return {}

    const mappings = {
      P856: ["url", false],
      // TODO: urlencode media
      P18: ["depiction", media => "http://commons.wikimedia.org/wiki/Special:FilePath/" + media ],
      P279: ["broader"],
      P31: ["broader"],
      P131: ["broader"], // administrative territorial entity
      P155: ["previous"],
      P156: ["next"],
      P569: ["startDate", false],
      P571: ["startDate", false],
      P580: ["startDate", false],
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

  descriptionsToScopeNotes(descriptions) {
    // FIXME: not all language codes are valid (?)
    var scopeNotes = Object.keys(descriptions).reduce( (obj, language) => {
      obj[language] = [ descriptions[language] ]
      return obj
    }, {})
    scopeNotes["-"] = [] // more languages
    return scopeNotes
  }

  entityToConcept(entity) {
    var concept = this.mapIdentifier(entity.id)

    Object.assign(concept, {
      notation: [entity.id],
      inScheme: [{uri: "http://bartoc.org/en/node/1940"}],
      modified: entity.modified,
      prefLabel: (entity.labels || {}),
      scopeNote: this.descriptionsToScopeNotes(entity.descriptions || {}),
      altLabel: (entity.aliases || {}),
    })
    concept.prefLabel["-"] = "?"
    concept.altLabel["-"] = []

    Object.assign(concept, this.mapClaims(entity.claims))
    Object.assign(concept, this.mapSitelinks(entity.sitelinks))

    return concept
  }

  mapSitelinks() {
    return {} // TODO
  }
}

module.exports = EntityMapper
