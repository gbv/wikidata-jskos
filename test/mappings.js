require("should")

const WikidataWrapper = require("../lib/wikidata-wrapper")
const schemes = [{
  "uri": "http://bartoc.org/en/node/430",
  "PROPERTY": "P227",
  "P1921": "http://d-nb.info/gnd/$1",
  "P1793": "1[01]?\\d{7}[0-9X]|[47]\\d{6}-\\d|[1-9]\\d{0,7}-[0-9X]|3\\d{7}[0-9X]"
}]
const wds = new WikidataWrapper(schemes)

describe("getMappings", () => {

  it("fails on missing parameters", () => {
    return wds.getMappings({})
      .then(() => should.fail())
      .catch(err => { err.should.be.ok() })
  })

  it("returns no mappings from unknown URI", () => {
    return wds.getMappings({ from: "wtf" })
      .then(mappings => {
        mappings.should.deepEqual([])
      })
  })

  it("returns mappings from Wikidata item", () => {
    const from = "http://www.wikidata.org/entity/Q1"

    return wds.getMappings({ from })
      .then(mappings => {
        mappings.should.be.Array()
        mappings.should.not.be.empty()
      })
  })

})
