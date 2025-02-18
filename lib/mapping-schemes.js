import fs from "node:fs"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { mkdirp } from "mkdirp"
import * as ndjson from "./ndjson.js"


import getMappingSchemes from "./queries/get-mapping-schemes.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const cache = path.resolve(__dirname, "../cache")
const assets = path.resolve(__dirname, "../assets")


export function updateMappingSchemes() {
  mkdirp.sync(cache)
  return getMappingSchemes()
    .then(schemes => {
      const jskos = schemes.map(({NOTATION_REGEX: _a, URI_REGEX: _b, ...s }) => s)
      ndjson.write(jskos, `${cache}/concept-schemes.ndjson`)
      return schemes
    })
}

export function loadMappingSchemes() {
  const cachedSchemes = `${cache}/concept-schemes.ndjson`
  const assetsSchemes = `${assets}/concept-schemes.ndjson`
  return ndjson.read(fs.existsSync(cachedSchemes) ? cachedSchemes : assetsSchemes)
}
