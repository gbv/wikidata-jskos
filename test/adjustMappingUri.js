/**
 * Adjusts the Wikidata mapping URI.
 *
 * - Move current mapping URI to the beginning of `identifier`.
 * - Adjust URI with current baseUrl.
 */

const config = require("../config")

module.exports = mapping => {
  mapping.identifier = [mapping.uri].concat(mapping.identifier || [])
  mapping.uri = mapping.uri.replace("http://www.wikidata.org/entity/statement/", config.baseUrl + "mappings/")
  return mapping
}
