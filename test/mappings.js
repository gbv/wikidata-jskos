import { expect } from "chai"
import { WikidataConceptScheme, WikidataService } from "../lib/wikidata-wrapper.js"
import { readFile } from "node:fs/promises"

let service

describe("getMappings", () => {
  
  before(async ()=> {
    const fileUrl = new URL("./schemes.json", import.meta.url)
    const jsonSchemes = JSON.parse(await readFile(fileUrl, "utf8"))
    const schemes = jsonSchemes.map(s => new WikidataConceptScheme(s))
    service = new WikidataService(schemes)
  })

  it("fails on missing parameters", () => {
    return service.getMappings({})
      .then(() => expect.fail())
      .catch(err => {
        expect(err).be.ok
      })
  })

  it("returns no mappings from unknown URI", () => {
    return service.getMappings({ from: "wtf" })
      .then(mappings => {
        expect(mappings).deep.equal([])
      })
  })

  it("returns mappings from Wikidata item", async () => {
    const from = "http://www.wikidata.org/entity/Q42"
    const toScheme = "http://bartoc.org/en/node/430"

    const fileUrl = new URL("./Q42.gnd.json", import.meta.url)
    const q42Json = JSON.parse(await readFile(fileUrl, "utf8"))

    return service.getMappings({ from, toScheme })
      .then(mappings => {
        expect(mappings).deep.equal([q42Json])
      })
  })

  it("returns no mappings for unknown fromScheme", () => {
    const fromScheme = "unknown:scheme"
    const toScheme = "http://bartoc.org/en/node/430"

    return service.getMappings({ fromScheme, toScheme })
      .then(mappings => {
        expect(mappings).deep.equal([])
      })
  })

  it("returns no mappings for unknown toScheme", () => {
    const from = "http://www.wikidata.org/entity/Q42"
    const toScheme = "unknown:scheme"

    return service.getMappings({ from, toScheme })
      .then(mappings => {
        expect(mappings).deep.equal([])
      })
  })

  it("returns no mappings when partOf is present", () => {
    const from = "http://www.wikidata.org/entity/Q42"
    const toScheme = "http://bartoc.org/en/node/430"
    const partOf = "http://coli-conc.gbv.de/concordances/ddc_rvk_1000"

    return service.getMappings({ from, toScheme, partOf })
      .then(mappings => {
        expect(mappings).deep.equal([])
      })
  })

})
