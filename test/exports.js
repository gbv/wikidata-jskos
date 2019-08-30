const should = require("chai").should()
const wds = require("../lib/wikidata-wrapper")

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
      wds[`map${what}`].should.be.a("function")
    })
    it(`mapSimple${what}`, () => {
      wds[`mapSimple${what}`].should.be.a("function")
    })
  })

  it("entityTypes", () => {
    wds.entityTypes.should.be.a("object")
  })

  it("mappingTypes", () => {
    wds.mappingTypes.should.be.a("object")
    wds.mappingTypes.Q39893184.should.equal("http://www.w3.org/2004/02/skos/core#closeMatch")
  })
})
