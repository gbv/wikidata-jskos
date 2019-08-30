const should = require("chai").should()

const loadMappingSchemes = require("../lib/load-mapping-schemes")

describe("loadMappingSchemes", () => {
  it("returns a list of concept schemes", () => {
    return loadMappingSchemes()
      .then(schemes => {
        schemes.should.be.a("array")
        schemes.should.not.be.empty
        schemes[0].identifier.should.be.a("array")
      })
  })
})
