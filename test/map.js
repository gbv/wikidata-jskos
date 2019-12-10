require("chai").should()

const wdk = require("../lib/utils/wdk")
const wds = require("../lib/wikidata-wrapper")
const { WikidataConceptSchemeSet } = wds
const Q42 = require("./Q42.json")
const Q42concept = require("./Q42.jskos.json")
let Q42mappings = require("./Q42.mappings.json")

describe("mapEntity", () => {
  it("map(Simple)Entity", done => {
    wds.mapSimpleEntity(wdk.simplify.entity(Q42)).should.deep.equal(Q42concept)
    wds.mapEntity(Q42).should.deep.equal(Q42concept)
    done()
  })

  it("mapLabels", done => {
    wds.mapLabels(undefined).should.deep.equal({})

    const labels = { xx: { language: "xx", value: "Y" } }
    const expect = { prefLabel: { xx: "Y", "-": "?" } }
    wds.mapLabels(labels).should.deep.equal(expect)

    done()
  })

  it("mapMappingClaims", done => {
    wds.mapMappingClaims(Q42.claims).should.deep.equal([])

    const schemes = new WikidataConceptSchemeSet(require("./schemes.json"))
    wds.mapMappingClaims(Q42.claims, { schemes }).should.deep.equal(Q42mappings)
    done()
  })
})
