const should = require("should")
const {
  mappingContent,
  mappingMembers,
  mappingContentIdentifier,
  mappingMembersIdentifier,
  addMappingIdentifiers
} = require("../lib/mapping-identifiers")

describe("mapping identifiers", () => {

  const example =
    {
      "type": [ "http://www.w3.org/2004/02/skos/core#exactMatch" ],
      "from": {
        "memberSet": [ { "uri": "http://www.wikidata.org/entity/Q60025" } ]
      },
      "to": {
        "memberSet": [ { "uri": "http://d-nb.info/gnd/11850391X" } ]
      }
    }

  const ids = [
    "urn:jskos:mapping:content:fd0d4deb57676ee01071a4183e06317ff5afa420",
    "urn:jskos:mapping:members:a97ee5e5f536b4fb316e2951da92b437dbd707c7"
  ]

  it("mappingMembers", () => {
    should(mappingMembers(example)).deepEqual([
      "http://d-nb.info/gnd/11850391X",
      "http://www.wikidata.org/entity/Q60025"
    ])
    should(mappingMembersIdentifier(example)).equal(ids[1])
  })

  it("mappingContent", () => {
    should(mappingContent(example)).deepEqual(example)
    should(mappingContentIdentifier(example)).equal(ids[0])
  })

  it("addMappingIdentifiers", () => {
    const mapping = mappingContent(example)
    mapping.identifier = ids
    should(addMappingIdentifiers(example)).deepEqual(mapping)
    should(addMappingIdentifiers(mapping)).deepEqual(mapping) // don't add twice

    mapping.identifier = ["x:y"]
    should(addMappingIdentifiers(mapping).identifier).deepEqual(ids.concat(["x:y"]))
  })

  it("should handle empty sets", () => {
    const expect = {
      from: { memberSet: [] },
      to: { memberSet: [] },
      type: [ "http://www.w3.org/2004/02/skos/core#mappingRelation" ]
    }

    const emptyExamples = [
      { from: { memberSet: [] }, to: { memberList: [null] } },
      { from: { memberSet: [{},null] }, to: { memberChoice: [] } },
      { },
    ]
    emptyExamples.forEach(ex => should(mappingContent(ex)).deepEqual(expect))
    emptyExamples.forEach(ex => should(mappingMembers(ex)).deepEqual([]))

    should(mappingContentIdentifier(expect)).equal(
      "urn:jskos:mapping:content:a32026e2647c9a8d3abc42e1381f5638671417f8")
    should(mappingMembersIdentifier(expect)).equal(
      "urn:jskos:mapping:members:cd0d4cc32346750408f7d4f5e78ec9a6e5b79a0d")
  })

})
