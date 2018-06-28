const should = require("should")
const wds = require("../lib/wikidata-wrapper")

describe("exported constants and functions", () => {

  [
    "identifier",
    "labels",
    "aliases",
    "descriptions",
    "claims",
    "sitelinks",
    "info",
    "entity"
  ].forEach(func => {
    it(`map.${func}`, () => {
      should(wds.map[func]).be.Function()
    })
  })

  it("entityTypes", () => {
    should(wds.entityTypes).be.Object()
  })

  it("mappingTypes", () => {
    should(wds.mappingTypes).be.Object()
    should(wds.mappingTypes.Q39893184).equal("http://www.w3.org/2004/02/skos/core#closeMatch")
  })

  it("getMappingSchemes", () => {
    should(wds.getMappingSchemes).be.Function()
  })

})
