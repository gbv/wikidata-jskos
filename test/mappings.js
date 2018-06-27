require("should")

const WikidataWrapper = require("../lib/wikidata-wrapper")
const wds = new WikidataWrapper()

describe("getMappings", () => {

  it("fails on missing parameters", () => {
    return wds.getMappings({})
      .then(() => should.fail())
      .catch(err => { err.should.be.ok })
  })

  it("returns no mappings from unknown URI", () => {
    return wds.getMappings({ from: "wtf" })
      .then(mappings => {
        mappings.should.be.Array
        mappings.should.be.empty
      })
  })

  it("returns mappings from Wikidata item", () => {
    const uri ="http://www.wikidata.org/entity/Q1"

    return wds.getMappings({ from: uri })
      .then(mappings => {
        mappings.should.be.Array
        mappings.should.not.be.empty
      })
  })

})
