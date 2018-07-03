require("should")

const wdk = require("wikidata-sdk")
const wds = require("../lib/wikidata-wrapper")
const fs = require("fs")
const Q42 = JSON.parse(fs.readFileSync("./test/Q42.json"))

describe("mapEntity", () => {

  it("map(Simple)Entity", done => {
    const expect = JSON.parse(fs.readFileSync("./test/Q42.jskos"))
    should([wds.mapSimpleEntity(wdk.simplify.entity(Q42))]).deepEqual(expect)
    should([wds.mapEntity(Q42)]).deepEqual(expect)
    done()
  })

  it("mapLabels", done => {
    should(wds.mapLabels(undefined)).deepEqual({})

    const labels = {xx: {language: "xx", value: "Y"}}
    const expect = {prefLabel: {xx: "Y", "-": "?"}}
    should(wds.mapLabels(labels)).deepEqual(expect)

    done()
  })
 
})
