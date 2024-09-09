import { expect } from "chai"
import { WikidataConceptScheme, WikidataService } from "../lib/wikidata-wrapper.js"
import { readFile } from "node:fs/promises"

let service

describe("mapMapping", () => {

  const jskosMapping = {
    uri: "http://www.wikidata.org/entity/statement/q1206262-4365f346-48c8-bdd0-bdad-0cf07ba19134",
    from: {
      memberSet: [
        {
          uri: "http://www.wikidata.org/entity/Q1206262",
          notation: [ "Q1206262" ],
          inScheme: [
            { uri: "http://bartoc.org/en/node/1940" },
          ],
        },
      ],
    },
    to: {
      memberSet: [
        {
          uri: "http://d-nb.info/gnd/7527800-5",
          notation: [ "7527800-5" ],
          inScheme: [
            { uri: "http://bartoc.org/en/node/430" },
          ],
        },
      ],
    },
  }

  const wikidataClaim = {
    id: "Q1206262",
    claims: {
      P227: [ {
        id: "q1206262$4365f346-48c8-bdd0-bdad-0cf07ba19134",
        type: "statement",
        mainsnak: {
          snaktype: "value",
          property: "P227",
          datavalue: {
            value: "7527800-5",
            type: "string",
          },
        },
      } ],
    },
  }

  const simplified = {
    id: "Q1206262",
    claims: {
      P227: {
        value: "7527800-5",
        id: "q1206262$4365f346-48c8-bdd0-bdad-0cf07ba19134",
      },
    },
  }

  before(async () => {
    const fileUrl = new URL("./schemes.json", import.meta.url)
    const jsonSchemes = JSON.parse(await readFile(fileUrl, "utf8"))
    const schemes = jsonSchemes.map(s => new WikidataConceptScheme(s))
    service = new WikidataService(schemes)
  })

  it("converts JSKOS mapping to Wikidata JSON", () => {
    expect(service.mapMapping(jskosMapping)).deep.equal(wikidataClaim)
  })

  it("converts JSKOS mapping to simplified Wikidata JSON", () => {
    expect(service.mapMapping(jskosMapping, { simplify: true })).deep.equal(simplified)
  })

  it("converts mapping types to qualifiers", () => {
    jskosMapping.type = [ "http://www.w3.org/2004/02/skos/core#closeMatch" ]
    wikidataClaim.claims.P227[0].qualifiers = {
      P4390: [ {
        snaktype: "value",
        property: "P4390",
        datavalue: {
          type: "wikibase-entityid",
          value: {
            "entity-type": "item",
            id: "Q39893184",
            "numeric-id": 39893184,
          },
        },
      } ],
    }

    expect(service.mapMapping(jskosMapping)).deep.equal(wikidataClaim)
  })

  it("converts mapping types to qualifiers (simplified)", () => {
    simplified.claims.P227.qualifiers = {
      P4390: "Q39893184",
    }
    expect(service.mapMapping(jskosMapping, { simplify: true })).deep.equal(simplified)
  })
})
