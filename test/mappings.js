const should = require("chai").should()

const { ConceptScheme, WikidataJSKOSService } = require("../lib/wikidata-wrapper")
const schemes = require("./schemes.json").map(s => new ConceptScheme(s))
const service = new WikidataJSKOSService(schemes)

const adjustMappingUri = require("./adjustMappingUri")

describe("getMappings", () => {
  it("fails on missing parameters", () => {
    return service.getMappings({})
      .then(() => should.fail())
      .catch(err => { err.should.be.ok })
  })

  it("returns no mappings from unknown URI", () => {
    return service.getMappings({ from: "wtf" })
      .then(mappings => {
        mappings.should.deep.equal([])
      })
  })

  it("returns mappings from Wikidata item", () => {
    const from = "http://www.wikidata.org/entity/Q42"
    const toScheme = "http://bartoc.org/en/node/430"

    return service.getMappings({ from, toScheme })
      .then(mappings => {
        mappings.should.deep.equal([adjustMappingUri(require("./Q42.gnd.json"))])
      })
  })
})
