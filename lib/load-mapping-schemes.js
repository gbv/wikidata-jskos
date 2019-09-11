const fs = require("fs")
const ndjson = require("./ndjson")
const getCacheFolderPath = require("./wikidata-cli/get_cache_folder_path")

const getMappingSchemes = require("./queries/get-mapping-schemes")

function reloadMappingSchemes (options, file) {
  return getMappingSchemes(options).then(
    schemes => {
      ndjson.write(schemes, file)
      return schemes
    })
}

module.exports = async function (options) {
  return getCacheFolderPath("mapping-schemes")
    .then(path => {
      const file = path + "/mapping-schemes.ndjson"
      try {
        const now = new Date().getTime()
        const age = (now - new Date(fs.statSync(file).mtime)) / 1000
        if (age > options.maxAge) {
          return reloadMappingSchemes(options, file)
        } else {
          return ndjson.read(file)
        }
      } catch (err) {
        return reloadMappingSchemes(options, file)
      }
    })
}
