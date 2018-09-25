const ndjson = require("../lib/ndjson")
const getCacheFolderPath = require("../lib/wikidata-cli/get_cache_folder_path")

const queryMappingSchemes = require("../lib/query-mapping-schemes")

module.exports = function (options) {
  return getCacheFolderPath("mapping-schemes")
    .then( path => {
      const file = path + "/mapping-schemes.ndjson"
      try {
        return propsPromise = Promise.resolve(ndjson.read(file))
      } catch (err) {
        return queryMappingSchemes(options).then(
          schemes => {
            ndjson.write(schemes, file)
            return schemes
          })
      }
    })
}
