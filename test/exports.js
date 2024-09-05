import { expect } from "chai"
import * as wds from "../lib/wikidata-wrapper.js"

describe("wikidata-wrapper exports", () => {
  [
    "Identifier",
    "Labels",
    "Aliases",
    "Descriptions",
    "Claims",
    "Sitelinks",
    "Info",
    "Entity",
  ].forEach(what => {
    it(`map${what}`, () => {
      expect(wds[`map${what}`]).to.be.a("function")
    })
    it(`mapSimple${what}`, () => {
      expect(wds[`mapSimple${what}`]).to.be.a("function")
    })
  })

  it("entityTypes", () => {
    expect(wds.entityTypes).to.be.a("object")
  })

  it("mappingTypes", () => {
    expect(wds.mappingTypes).to.be.a("object")
    expect(wds.mappingTypes.Q39893184).to.equal("http://www.w3.org/2004/02/skos/core#closeMatch")
  })
})
