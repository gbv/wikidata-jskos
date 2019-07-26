const { selectedLanguages } = require("./utils")
const types = require("./types")
const mappers = require("./mappers")

const debug = require("./utils/debug")

const getMappingsFrom = require("./queries/get-mappings-from")
const getMappingsTo = require("./queries/get-mappings-to")
const getConcepts = require("./queries/get-concepts")
const wdk = require("./utils/wdk")
const ConceptScheme = require("./ConceptScheme")
const ConceptSchemeSet = require("./ConceptSchemeSet")
const suggestSearch = require("./suggest")

const { httpRequest } = require("./utils/request")
const { addMappingIdentifiers } = require("jskos-tools")

const config = require("../config")
const wdEdit = require("wikidata-edit")
const getWdEdit = (user) => {
  let oauth = user && user.identities && user.identities.wikidata && user.identities.wikidata.oauth
  if (!oauth || !oauth.token || !oauth.token_secret) {
    return null
  }
  return wdEdit({
    wikibaseInstance: config.wikibase.api,
    oauth: Object.assign({}, oauth, config.oauth)
  })
}

const wikidataConceptScheme = new ConceptScheme({
  "uri": "http://bartoc.org/en/node/1940",
  "notation": ["WD"],
  "namespace": "http://www.wikidata.org/entity/",
  "notationPattern": "Q[1-9][0-9]*",
  "uriPattern": "^http://www\\.wikidata\\.org/entity/(Q[1-9][0-9]*)$"
})

/**
 * Provides JSKOS Mappings from Wikidata.
 */
class WikidataJSKOSService extends ConceptSchemeSet {
  constructor (schemes) {
    schemes.push(wikidataConceptScheme)
    super(schemes)
  }

  detectWikidataConcept (id) {
    if (wdk.isEntityId(id)) {
      id = "http://www.wikidata.org/entity/" + id
    }
    return wikidataConceptScheme.conceptFromUri(id)
  }

  /**
   * OpenSearch Suggestions.
   */
  suggestSearch (query) {
    return suggestSearch(query)
  }

  /**
   * Promise an array of JSKOS Concepts.
   */
  getConcepts (query) {
    return getConcepts(query, this)
  }

  detectConceptSchemeURI (scheme) {
    if (scheme.match(/^http:\/\/bartoc\.org\/en\/node\/[0-9]+$/)) {
      return scheme
    } else if (scheme.match(/^[0-9]+$/)) {
      return "http://bartoc.org/en/node/" + scheme
    } else if (scheme.match(/^P[0-9]+$/)) {
      scheme = this.getSchemeOfProperty(scheme)
      return scheme ? scheme.uri : null
    }
  }

  /**
   * Promise an array of JSKOS Mappings from Wikidata.
   */
  getMappings (query) {
    if (query.direction === "backward") {
      [query.from, query.fromScheme, query.to, query.toScheme] =
        [query.to, query.toScheme, query.from, query.fromScheme]
      delete query.direction
    }

    if (!query.from && !query.to && query.to !== "0") {
      return Promise.resolve([])
    }

    query.languages = selectedLanguages(query)

    if (query.fromScheme) {
      query.fromScheme = this.detectConceptSchemeURI(query.fromScheme)
    }
    if (query.toScheme) {
      query.toScheme = this.detectConceptSchemeURI(query.toScheme)
    }

    // cleanup query
    Object.keys(query).forEach(key => {
      if (query[key] === "" || query[key] === null || query[key] === undefined) {
        delete query[key]
      }
    })

    if (!query["fromScheme"] && wdk.isEntityId(query["from"])) {
      query.from = "http://www.wikidata.org/entity/" + query["from"]
      query.fromScheme = "http://bartoc.org/en/node/1940"
    }
    if (!query["toScheme"] && wdk.isEntityId(query["to"])) {
      query.to = "http://www.wikidata.org/entity/" + query["to"]
      query.toScheme = "http://bartoc.org/en/node/1940"
    }
    debug.query(query)

    let promises = []

    if (query.mode === "or") {
      const { from, to, fromScheme, toScheme } = query

      delete query.to
      delete query.toScheme
      promises.push(getMappingsFrom(query, this))
      query.to = to
      query.toScheme = toScheme

      delete query.from
      delete query.fromScheme
      promises.push(getMappingsTo(query, this))
      query.from = from
      query.fromScheme = fromScheme
    } else {
      if (query.from) {
        promises.push(getMappingsFrom(query, this))
      } else if (query.to || query.to === "0") {
        promises.push(getMappingsTo(query, this))
      }
    }

    if (query.direction === "both") {
      query.direction = "backward"
      promises.push(this.getMappings(query))
    }

    // combine results and collect unique mappings
    return Promise.all(promises)
      .then(results => results.reduce((all, content) => all.concat(content), [])
        .filter((mapping, index, self) => {
          const same = m => m.identifier[0] === mapping.identifier[0]
          return self.findIndex(same) === index
        })
      )
  }

  /**
   * Convert a JSKOS mapping into a Wikidata claim.
   *
   * Only 1-to-1 mappings from Wikidata to another concept scheme are supported.
   * JSKOS fields fromScheme and toScheme are ignored.
   */
  mapMapping(mapping, options = {}) {
    const { simplify } = options

    if (!mapping.from || !mapping.to ||
        !mapping.from.memberSet || !mapping.to.memberSet) {
      throw new Error("incomplete JSKOS mapping object")
    } else if (mapping.from.memberSet.length != 1 || mapping.to.memberSet.length != 1) {
      throw new Error("only 1-to-1 mapping are supported")
    }

    const from = mapping.from.memberSet[0]
    const to = mapping.to.memberSet[0]

    const id = wikidataConceptScheme.notationFromUri(from.uri)
    if (!id) throw new Error("mapping must be from a Wikidata item")

    const target = this.conceptFromUri(to.uri)
    if (!target) throw new Error("failed to detect URI: "+to.uri)

    const property = this.getPropertyOfScheme(target.inScheme[0].uri)
    if (!property) throw new Error("failed to find Wikidata property")

    const claim = simplify ? {
      value: target.notation[0],
    } : {
      type: "statement",
      mainsnak: {
        snaktype: "value",
        property: property,
        datavalue: {
          value: target.notation[0],
          type: "string"
        }
      }
    }

    const regex = new RegExp("^http://www\\.wikidata\\.org/entity/statement/"+id+"-[0-9a-f-]+$","i")
    if (mapping.uri && regex.test(mapping.uri)) {
      claim.id = mapping.uri.substr(41).replace("-","$")
    }

    if (mapping.type && mapping.type[0] in types.mappingTypeIds) {
      const typeId = types.mappingTypeIds[mapping.type[0]]
      claim.qualifiers = simplify ? {
        P4390: typeId
      } : {
        P4390: [ {
          snaktype: "value",
          property: "P4390",
          datavalue: {
            type: "wikibase-entityid",
            value: {
              id: typeId,
              "numeric-id": parseInt(typeId.substr(1)),
              "entity-type": "item",
            }
          }
        } ]
      }
    }

    return {
      id,
      claims: { [property]: simplify ? claim : [ claim ] }
    }
  }

  // TODO: Documentation for methods!
  // TODO: Convert other methods to async methods to make them clearer.
  getMapping(req, res) {
    let id = req.params._id.replace("-", "$")
    let qid = id.split("$")[0]
    const url = wdk.getEntities(qid, [], ["claims"])
    return Promise.resolve(httpRequest(url)
      .then(res => res.entities[qid])
      .then(entity => entity.claims || {})
      .then(claims => mappers.mapMappingClaims(claims, { from: mappers.mapIdentifier(qid), schemes: this }))
      .then(mappings => mappings.map(addMappingIdentifiers))
      .then(mappings => mappings.find(mapping => mapping.uri.endsWith(req.params._id)))
      .then(mapping => mapping ? res.json(mapping) : res.sendStatus(404))
    )
  }

  async saveMapping(req, res) {
    let mapping = req.body
    if (!mapping) {
      res.sendStatus(400)
      return null
    }
    // Convert mapping to claim (or rather an entity with claims)
    let entity = this.mapMapping(mapping, { simplify: true })
    let props = Object.keys(entity.claims)
    if (props.length == 0) {
      console.error("No claim could be found after converting mapping.", id)
      return null
    }
    if (props.length > 1) {
      console.warn("More than one claim was found after converting mapping, should be only one.", entity)
    }
    let claimsBefore
    if (req.params._id) {
      // PUT
      let id = req.params._id.replace("-", "$")
      entity.claims[props[0]].id = id

    } else {
      // POST
      // Get current claims for Wikidata concept
      claimsBefore = ((await httpRequest(wdk.getEntities(entity.id, [], ["claims"]))).entities[entity.id].claims || {})[props[0]] || []
    }
    const wdEdit = getWdEdit(req.user)
    if (!wdEdit) {
      res.sendStatus(403)
      return null
    }
    let result = (await wdEdit.entity.edit(entity))
    // Set params._id on req for getMapping
    if (!req.params._id) {
      if (!req.params) {
        req.params = {}
      }
      // Find new claim ID
      let claimsAfter = result.entity.claims[props[0]] || []
      let newClaim = claimsAfter.find(claim => !claimsBefore.find(c => c.id == claim.id))
      if (newClaim) {
        req.params._id = newClaim.id.replace("$", "-")
      } else {
        res.sendStatus(400)
        return null
      }
    }
    return this.getMapping(req, res)
  }

  deleteMapping(req, res) {
    let id = req.params._id.replace("-", "$")
    let entityId = id.split("$")[0]
    const wdEdit = getWdEdit(req.user)
    if (!wdEdit) {
      res.sendStatus(403)
      return null
    }
    return wdEdit.entity.edit({
      id: entityId,
      claims: {
        P5748: [
          {
            id,
            remove: true
          },
        ]
      },
    }).then(() => {
      res.sendStatus(204)
    })
  }

}

module.exports = Object.assign({
  ConceptScheme,
  ConceptSchemeSet,
  WikidataJSKOSService,
  getMappingSchemes: require("./load-mapping-schemes"),
},
mappers,
types
)
