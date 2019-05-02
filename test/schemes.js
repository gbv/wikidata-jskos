require("should")

const { getMappingSchemes } = require("../lib/wikidata-wrapper")

describe("getMappingSchemes", () => {
  it("returns a list of concept schemes", () => {
    return getMappingSchemes()
      .then(schemes => {
        schemes.should.be.Array()
        schemes.should.not.be.empty()
        schemes[0].identifier.should.be.Array()
      })
  })
})
