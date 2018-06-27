const should = require("should")
const { mappingTypes, getMappingSchemes } = require("../lib/wikidata-wrapper")

describe("exported constants and functions", () => {

  it("mappingTypes", () => {
    should(mappingTypes).be.Object()
    should(mappingTypes.Q39893184).equal("http://www.w3.org/2004/02/skos/core#closeMatch")
  })

  it("getMappingSchemes", () => {
    should(getMappingSchemes).be.Function()
  })

})
