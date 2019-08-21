const fs = require("fs")
const ndjson = require("./ndjson")
const getCacheFolderPath = require("./wikidata-cli/get_cache_folder_path")

const getMappingSchemes = require("./queries/get-mapping-schemes")
const getPropertyUses = require("./queries/get-property-uses")

function reloadMappingSchemes (options, file) {
  return Promise.all([getMappingSchemes(options), getPropertyUses()])
    .then(results => {
      const [schemes, uses] = results
      schemes.forEach(s => {
        s.PROPERTY_USE = uses[s.PROPERTY]
      })
      ndjson.write(schemes, file)
      return schemes
    })
}

module.exports = function (options) {
  return getCacheFolderPath("mapping-schemes")
    .then(path => {
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
