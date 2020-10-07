const should = require("chai").should()

const { WikidataConceptScheme, WikidataService } = require("../lib/wikidata-wrapper")
const schemes = require("./schemes.json").map(s => new WikidataConceptScheme(s))
const service = new WikidataService(schemes)

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
        mappings.should.deep.equal([require("./Q42.gnd.json")])
      })
  })

  it("returns no mappings for unknown fromScheme", () => {
    const fromScheme = "unknown:scheme"
    const toScheme = "http://bartoc.org/en/node/430"

    return service.getMappings({ fromScheme, toScheme })
      .then(mappings => {
        mappings.should.deep.equal([])
      })
  })

  it("returns no mappings for unknown toScheme", () => {
    const from = "http://www.wikidata.org/entity/Q42"
    const toScheme = "unknown:scheme"

    return service.getMappings({ from, toScheme })
      .then(mappings => {
        mappings.should.deep.equal([])
      })
  })

  it("returns no mappings when partOf is present", () => {
    const from = "http://www.wikidata.org/entity/Q42"
    const toScheme = "http://bartoc.org/en/node/430"
    const partOf = "http://coli-conc.gbv.de/concordances/ddc_rvk_1000"

    return service.getMappings({ from, toScheme, partOf })
      .then(mappings => {
        mappings.should.deep.equal([])
      })
  })

})
