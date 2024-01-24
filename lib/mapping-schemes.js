const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const ndjson = require("./ndjson")

const getMappingSchemes = require("./queries/get-mapping-schemes")

const cache = path.resolve(__dirname, "../cache")
const assets = path.resolve(__dirname, "../assets")

module.exports = {

  updateMappingSchemes() {
    mkdirp.sync(cache)
    return getMappingSchemes()
      .then( schemes => {
        ndjson.write(schemes, `${cache}/mapping-schemes.ndjson`)
        return schemes
      })
  },

  loadMappingSchemes() {
    const cachedSchemes = `${cache}/mapping-schemes.ndjson`
    const assetsSchemes = `${assets}/mapping-schemes.ndjson`
    return ndjson.read( fs.existsSync(cachedSchemes) ? cachedSchemes : assetsSchemes )
  },

}
