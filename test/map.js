import { expect } from "chai"

import wdk from "../lib/wdk.js"
import * as wds from "../lib/wikidata-wrapper.js"
import { readFile } from "node:fs/promises"

const { WikidataConceptSchemeSet } = wds

let Q42
let Q42concept
let Q42mappings


describe("mapEntity", () => {

  before(async () => {
    let fileUrl
    fileUrl = new URL("./Q42.json", import.meta.url)
    Q42 = JSON.parse(await readFile(fileUrl, "utf8"))


    fileUrl = new URL("./Q42.jskos.json", import.meta.url)
    Q42concept = JSON.parse(await readFile(fileUrl, "utf8"))

    fileUrl = new URL("./Q42.mappings.json", import.meta.url)
    Q42mappings = JSON.parse(await readFile(fileUrl, "utf8"))
  })

  it("map(Simple)Entity", done => {
    expect(wds.mapSimpleEntity(wdk.simplify.entity(Q42))).deep.equal(Q42concept)
    expect(wds.mapEntity(Q42)).deep.equal(Q42concept)
    done()
  })

  it("mapLabels", done => {
    expect(wds.mapLabels(undefined)).deep.equal({})

    const labels = { xx: { language: "xx", value: "Y" } }
    const expected = { prefLabel: { xx: "Y", "-": "?" } }
    expect(wds.mapLabels(labels)).deep.equal(expected)

    done()
  })

  it("mapMappingClaims", async () => {
    expect(wds.mapMappingClaims(Q42.claims)).deep.equal([])

    const fileUrl = new URL("./schemes.json", import.meta.url)
    const jsonSchemes = JSON.parse(await readFile(fileUrl, "utf8"))
    const schemes = new WikidataConceptSchemeSet(jsonSchemes)
    expect(wds.mapMappingClaims(Q42.claims, { schemes })).deep.equal(Q42mappings)
  })
})
