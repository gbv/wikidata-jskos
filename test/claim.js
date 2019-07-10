const should = require("should")

const { ConceptScheme, WikidataJSKOSService } = require("../lib/wikidata-wrapper")
const schemes = require("./schemes.json").map(s => new ConceptScheme(s))
const service = new WikidataJSKOSService(schemes)

describe("mapMapping", () => {
  it("converts JSKOS mapping to Wikidata claim", () => {
    var jskosMapping = {
      uri: "http://www.wikidata.org/entity/statement/q1206262-4365f346-48c8-bdd0-bdad-0cf07ba19134",
      from: {
        memberSet: [
          {
            uri: "http://www.wikidata.org/entity/Q1206262",
            notation: [ "Q1206262" ],
            inScheme: [
              { uri: "http://bartoc.org/en/node/1940" }
            ]
          }
        ]
      },
      to: {
        memberSet: [
          {
            uri: "http://d-nb.info/gnd/7527800-5",
            notation: [ "7527800-5" ],
            inScheme: [
              { uri: "http://bartoc.org/en/node/430" }
            ]
          }
        ]
      }
    }

    const wikidataClaim = {
      id: "Q1206262",
      claims: {
        P227: {
          id: "q1206262$4365f346-48c8-bdd0-bdad-0cf07ba19134",
          mainsnak: {
            snaktype: "value",
            property: "P227",
            datavalue: {
              value: "7527800-5",
              type: "string"
            },
            datatype: "external-id"
          }
        }
      }
    }

    should(service.mapMapping(jskosMapping)).deepEqual(wikidataClaim)
  })
})
