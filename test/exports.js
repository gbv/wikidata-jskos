const should = require("should")
const wds = require("../lib/wikidata-wrapper")
const jskos = require("../lib/jskos")

describe("wikidata-wrapper exports", () => {

  [
    "Identifier",
    "Labels",
    "Aliases",
    "Descriptions",
    "Claims",
    "Sitelinks",
    "Info",
    "Entity"
  ].forEach(what => {
    it(`map${what}`, () => {
      should(wds[`map${what}`]).be.Function()
    })
    it(`mapSimple${what}`, () => {
      should(wds[`mapSimple${what}`]).be.Function()
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

describe("jskos exports", () => {
  [
    "mappingContent",
    "mappingMembers",
    "mappingContentIdentifier",
    "mappingMembersIdentifier",
    "addMappingIdentifiers"
  ].forEach(name => {
    it(name, () => {
      should(jskos[name]).be.Function()
    })
  })
})
