const fs = require("fs")
const ndjson = require("../lib/ndjson")
const getCacheFolderPath = require("../lib/wikidata-cli/get_cache_folder_path")

const queryMappingSchemes = require("../lib/query-mapping-schemes")

function reloadMappingSchemes(options, file) {
  return queryMappingSchemes(options).then(
    schemes => {
      ndjson.write(schemes, file)
      return schemes
    })
}

module.exports = function (options) {
  return getCacheFolderPath("mapping-schemes")
    .then( path => {
      const file = path + "/mapping-schemes.ndjson"
      try {
        const now = new Date().getTime()
        const age = (now - new Date(fs.statSync(file).mtime)) / 1000
        if (age > options.maxAge) {
          return reloadMappingSchemes(options, file)
        } else {
          return Promise.resolve(ndjson.read(file))
        }
      } catch (err) {
        return reloadMappingSchemes(options, file)
      }
    })
}
