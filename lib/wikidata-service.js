const { selectedLanguages } = require("./utils")

const { mappingTypeIds } = require("./types")
const { mapMappingClaims, mapIdentifier } = require("./mappers")
const { addMappingIdentifiers } = require("jskos-tools")

const debug = require("./utils/debug")

const getMappingsFrom = require("./queries/get-mappings-from")
const getMappingsTo = require("./queries/get-mappings-to")
const getMappingList = require("./queries/get-mapping-list")
const wdk = require("./utils/wdk")
const WikidataConceptSchemeSet = require("./wikidata-concept-scheme-set")

const { httpRequest } = require("./utils/request")

const ServiceError = require("./service-error")

const getWdEdit = required("./wbedit")
const wikidata = require("./wikidata")

/**
 * Returns a single Wikidata claim object by its id.
 *
 * @param {*} id
 */
async function getClaim(id) {
  const qid = id.split("$")[0].toUpperCase()
  const url = wdk.getEntities(qid, [], ["claims"])
  const claims = (await httpRequest(url)).entities[qid].claims || {}
  let claim
  for (let values of Object.values(claims)) {
    claim = values.find(value => value.id == id) || claim
  }
  return claim
}


/**
 * Provides access to Wikidata in JSKOS format.
 */
class WikidataService extends WikidataConceptSchemeSet {
  constructor (schemes) {
    schemes.push(wikidata) // make sure Wikidata itself is always defined
    super(schemes)
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
      query.fromScheme = this.detectWikidataConceptScheme(query.fromScheme)
    }

    if (query.toScheme) {
      query.toScheme = this.detectWikidataConceptScheme(query.toScheme)
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
        .map(addMappingIdentifiers)
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
      throw new ServiceError("incomplete JSKOS mapping object")
    } else if (mapping.from.memberSet.length != 1 || mapping.to.memberSet.length != 1) {
      throw new ServiceError("only 1-to-1 mapping are supported")
    }

    const from = mapping.from.memberSet[0]
    const to = mapping.to.memberSet[0]

    const id = wikidata.notationFromUri(from.uri)
    if (!id) throw new ServiceError("mapping must be from a Wikidata item")

    const target = this.conceptFromUri(to.uri)
    if (!target) throw new ServiceError("failed to detect URI: "+to.uri)

    const property = this.getPropertyOfScheme(target.inScheme[0].uri)
    if (!property) throw new ServiceError("failed to find Wikidata property")

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

    if (mapping.type && mapping.type[0] in mappingTypeIds) {
      const typeId = mappingTypeIds[mapping.type[0]]
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
   * Returns a single mapping for a Wikidata claim ID.
   *
   * @param {*} _id - Wikidata claim ID for the mapping to be returned (req.params._id)
   */
  async getMapping(_id) {
    let id = _id.replace("-", "$")
    let qid = id.split("$")[0].toUpperCase()
    const claim = await getClaim(id)
    let mapping
    if (claim) {
      mapping = mapMappingClaims({ [claim.mainsnak.property]: [claim] }, { from: mapIdentifier(qid), schemes: this })[0]
    }
    if (!mapping) {
      throw new ServiceError(`Mapping with ID ${_id} could not be found.`, 404)
    }
    return mapping
  }

  /**
   * Saves a new mapping or edits an existing mapping. Returns the saved/edited mapping.
   *
   * The `params` object has to contain the following properties:
   * - body: The body of the request (req.body)
   * - user: The authorized user for the request (req.user)
   * For PUT requests (editing an existing mapping), the following property is required:
   * - _id: Wikidata claim ID for the mapping to be edited (req.params._id)
   *
   * @param {*} params
   */
  async saveMapping({ _id, body, user }) {
    let mapping = body
    if (!mapping) {
      throw new ServiceError("Missing body with mapping.", 400)
    }
    // Convert mapping to claim (or rather an entity with claims)
    let entity = this.mapMapping(mapping, { simplify: true })
    let props = Object.keys(entity.claims)
    if (props.length == 0) {
      throw new ServiceError(`No claim could be found after converting mapping for ${entity.id}.`, 400)
    }
    if (props.length > 1) {
      console.warn("More than one claim was found after converting mapping, should be only one.", entity)
    }
    const prop = props[0]
    const { value, qualifiers } = entity.claims[prop]
    const qualifierProp = "P4390"
    const qualifierValue = qualifiers && qualifiers[qualifierProp]

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
      const claim = await getClaim(id)
      const qualifier = ((claim && claim.qualifiers && claim.qualifiers[qualifierProp]) || [])[0]
      if (qualifier) {
        existingQualifierHash = qualifier.hash
        existingQualifierValue = qualifier.datavalue.value.id
      }
    }

    const wdEdit = getWdEdit(user)

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
   * The `params` object has to contain the following properties:
   * - _id: Wikidata claim ID for the mapping to be deleted (req.params._id)
   * - user: The authorized user for the request (req.user)
   *
   * @param {*} params
   */
  deleteMapping({ _id, user }) {
    let id = _id.replace("-", "$")
    const wdEdit = getWdEdit(user)
    if (!wdEdit) {
      throw new Error("Unauthorized user, possibly missing the Wikidata indentity.", 403)
    }
    return wdEdit.claim.remove({ guid: id }).then(() => true)
  }

}

module.exports = WikidataService
