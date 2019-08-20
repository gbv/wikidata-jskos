const { selectedLanguages } = require("./utils")
const types = require("./types")
const mappers = require("./mappers")

const debug = require("./utils/debug")

const getMappingsFrom = require("./queries/get-mappings-from")
const getMappingsTo = require("./queries/get-mappings-to")
const getMappingList = require("./queries/get-mapping-list")
const getConcepts = require("./queries/get-concepts")
const wdk = require("./utils/wdk")
const ConceptScheme = require("./ConceptScheme")
const ConceptSchemeSet = require("./ConceptSchemeSet")
const suggestSearch = require("./suggest")

const { httpRequest } = require("./utils/request")
const { addMappingIdentifiers } = require("jskos-tools")

const config = require("../config")
const wdEdit = require("wikibase-edit")
const getWdEdit = (user) => {
  let oauth = user && user.identities && user.identities.wikidata && user.identities.wikidata.oauth
  if (!oauth || !oauth.token || !oauth.token_secret) {
    return null
  }
  return wdEdit({
    wikibaseInstance: config.wikibase.instance,
    credentials: {
      oauth: Object.assign({}, oauth, config.oauth),
    }
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

    // cleanup query
    Object.keys(query).forEach(key => {
      if (query[key] === "" || query[key] === null || query[key] === undefined) {
        delete query[key]
      }
    })

    if (query.direction === "backward") {
      [query.from, query.fromScheme, query.to, query.toScheme] =
        [query.to, query.toScheme, query.from, query.fromScheme]
      delete query.direction
    }

    if (query.fromScheme) {
      query.fromScheme = this.detectConceptSchemeURI(query.fromScheme)
    }

    if (query.toScheme) {
      query.toScheme = this.detectConceptSchemeURI(query.toScheme)
    }

    query.languages = selectedLanguages(query)

    if (!("from" in query) && !("to" in query)) {
      return getMappingList(query, this)
    }

    if (!query.fromScheme && wdk.isEntityId(query.from)) {
      query.from = "http://www.wikidata.org/entity/" + query.from
      query.fromScheme = "http://bartoc.org/en/node/1940"
    }
    if (!query.toScheme && wdk.isEntityId(query.to)) {
      query.to = "http://www.wikidata.org/entity/" + query.to
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

  /**
   * Returns a single Wikidata claim object by its id.
   *
   * @param {*} id
   */
  async getClaim(id) {
    const qid = id.split("$")[0]
    const url = wdk.getEntities(qid, [], ["claims"])
    const claims = (await httpRequest(url)).entities[qid].claims || {}
    let claim
    for (let values of Object.values(claims)) {
      claim = values.find(value => value.id == id) || claim
    }
    return claim
  }

  /**
   * Returns a single mapping for a Wikidata claim ID.
   *
   * @param {*} _id - Wikidata claim ID for the mapping to be returned (req.params._id)
   */
  async getMapping(_id) {
    let id = _id.replace("-", "$")
    let qid = id.split("$")[0]
    const claim = await this.getClaim(id)
    let mapping
    if (claim) {
      mapping = mappers.mapMappingClaims({ [claim.mainsnak.property]: [claim] }, { from: mappers.mapIdentifier(qid), schemes: this })
      mapping = mapping && addMappingIdentifiers(mapping)
    }
    if (!mapping) {
      const error = new Error(`Mapping with ID ${_id} could not be found.`)
      error.status = 404
      throw error
    }
    return mapping
  }

  /**
   * Saves a new mapping or edits an existing mapping. Returns the saved/edited mapping.
   *
   * The `param0` object has to contain the following properties:
   * - body: The body of the request (req.body)
   * - user: The authorized user for the request (req.user)
   * For PUT requests (editing an existing mapping), the following property is required:
   * - _id: Wikidata claim ID for the mapping to be edited (req.params._id)
   *
   * @param {*} param0
   */
  async saveMapping({ _id, body, user }) {
    let mapping = body
    if (!mapping) {
      const error = new Error("Missing body with mapping.")
      error.status = 400
      throw error
    }
    // Convert mapping to claim (or rather an entity with claims)
    let entity = this.mapMapping(mapping, { simplify: true })
    let props = Object.keys(entity.claims)
    if (props.length == 0) {
      const error = new Error(`No claim could be found after converting mapping for ${entity.id}.`)
      error.status = 400
      throw error
    }
    if (props.length > 1) {
      console.warn("More than one claim was found after converting mapping, should be only one.", entity)
    }
    const prop = props[0]
    const { value, qualifiers } = entity.claims[prop]
    const qualifierProp = "P4390"
    const qualifierValue = qualifiers && qualifiers[qualifierProp]

    const wdEdit = getWdEdit(user)
    if (!wdEdit) {
      const error = new Error("Unauthorized user, possibly missing the Wikidata indentity.")
      error.status = 403
      throw error
    }

    let id = _id && _id.replace("-", "$")

    // Find existing claim with the value (only for POST)
    if (!id) {
      const claimsBefore = ((await httpRequest(wdk.getEntities(entity.id, [], ["claims"]))).entities[entity.id].claims || {})[props] || []
      // If a claim with the same target already exists, overwrite that claim (i.e. turn POST into a PUT request)
      const existingClaim = claimsBefore.find(c => c.mainsnak.property == prop && c.mainsnak.datavalue.value == entity.claims[prop].value)
      if (existingClaim) {
        id = existingClaim.id
      }
    }

    // Find existing qualifiers
    let existingQualifierValue, existingQualifierHash
    if (id) {
      const claim = await this.getClaim(id)
      const qualifier = ((claim && claim.qualifiers && claim.qualifiers[qualifierProp]) || [])[0]
      if (qualifier) {
        existingQualifierHash = qualifier.hash
        existingQualifierValue = qualifier.datavalue.value.id
      }
    }

    let result
    if (id) {
      // PUT
      result = await wdEdit.claim.update({
        guid: id,
        newValue: value,
      })
    } else {
      // POST
      result = await wdEdit.claim.create({
        id: entity.id,
        property: prop,
        value,
      })
    }
    if (result.success != 1) {
      console.error(`Error updating claim for entity ${entity.id} (prop: ${prop}, id: ${id}).`)
    }
    id = (result && result.claim.id) || id

    // Set/update/remove qualifier
    if (qualifierValue) {
      if (existingQualifierValue && existingQualifierValue != qualifierValue) {
        result = await wdEdit.qualifier.update({
          guid: id,
          property: qualifierProp,
          oldValue: existingQualifierValue,
          newValue: qualifierValue,
        })
      } else if (!existingQualifierValue) {
        result = await wdEdit.qualifier.set({
          guid: id,
          property: qualifierProp,
          value: qualifierValue,
        })
      }
    } else if (existingQualifierHash && !qualifierValue) {
      // Remove qualifier
      result = await wdEdit.qualifier.remove({
        guid: id,
        hash: existingQualifierHash,
      })
    }
    if (result.success != 1) {
      console.error(`Error updating qualifier for claim ${id}.`)
    }

    return this.getMapping(id.replace("$", "-"))
  }

  /**
   * Deletes a mapping.
   *
   * The `param0` object has to contain the following properties:
   * - _id: Wikidata claim ID for the mapping to be deleted (req.params._id)
   * - user: The authorized user for the request (req.user)
   *
   * @param {*} param0
   */
  deleteMapping({ _id, user }) {
    let id = _id.replace("-", "$")
    const wdEdit = getWdEdit(user)
    if (!wdEdit) {
      const error = new Error("Unauthorized user, possibly missing the Wikidata indentity.")
      error.status = 403
      throw error
    }
    return wdEdit.claim.remove({ guid: id }).then(() => true)
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
