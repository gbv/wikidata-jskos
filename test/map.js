const should = require("should")

const wdk = require("wikidata-sdk")
const wds = require("../lib/wikidata-wrapper")
const { ConceptSchemeSet } = wds
const Q42 = require("./Q42.json")
const Q42concept = require("./Q42.jskos.json")
const Q42mappings = require("./Q42.mappings.json")

describe("mapEntity", () => {
  it("map(Simple)Entity", done => {
    should(wds.mapSimpleEntity(wdk.simplify.entity(Q42))).deepEqual(Q42concept)
    should(wds.mapEntity(Q42)).deepEqual(Q42concept)
    done()
  })

  it("mapLabels", done => {
    should(wds.mapLabels(undefined)).deepEqual({})

    const labels = { xx: { language: "xx", value: "Y" } }
    const expect = { prefLabel: { xx: "Y", "-": "?" } }
    should(wds.mapLabels(labels)).deepEqual(expect)

    done()
  })

  it("mapMappingClaims", done => {
    should(wds.mapMappingClaims(Q42.claims)).deepEqual([])

    const schemes = new ConceptSchemeSet(require("./schemes.json"))
    should(wds.mapMappingClaims(Q42.claims, { schemes })).deepEqual(Q42mappings)
    done()
  })
})
