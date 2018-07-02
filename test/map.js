require("should")

const fs = require("fs")
const wds = require("../lib/wikidata-wrapper")

const Q42 = JSON.parse(fs.readFileSync("./test/Q42.json"))

describe("mapEntity", () => {

  it("mapEntity", done => {
    const concept = wds.mapEntity(Q42)
    const expect = JSON.parse(fs.readFileSync("./test/Q42.jskos"))
    concept["@context"] = "https://gbv.github.io/jskos/context.json"
    should([concept]).deepEqual(expect)
    done()
  })

})
