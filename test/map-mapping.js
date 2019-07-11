const should = require("should")

const { ConceptScheme, WikidataJSKOSService } = require("../lib/wikidata-wrapper")
const schemes = require("./schemes.json").map(s => new ConceptScheme(s))
const service = new WikidataJSKOSService(schemes)

describe("mapMapping", () => {

  const jskosMapping = {
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
        type: "statement",
        mainsnak: {
          snaktype: "value",
          property: "P227",
          datavalue: {
            value: "7527800-5",
            type: "string"
          },
        }
      }
    }
  }

  it("converts JSKOS mapping to Wikidata claim", () => {
    should(service.mapMapping(jskosMapping)).deepEqual(wikidataClaim)
  })

  it("converts mapping types to qualifiers", () => {
    jskosMapping.type = [ "http://www.w3.org/2004/02/skos/core#closeMatch" ]
    wikidataClaim.claims.P227.qualifiers = {
      P4390: [ {
        snaktype: "value",
        property: "P4390",
        datavalue: {
          type: "wikibase-entityid",
          value: {
            "entity-type": "item",
            "id": "Q39893184",
            "numeric-id": 39893184
          }
        }
      } ]
    }

    should(service.mapMapping(jskosMapping)).deepEqual(wikidataClaim)
  })
})
