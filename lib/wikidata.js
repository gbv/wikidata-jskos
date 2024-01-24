const WikidataConceptScheme = require("./wikidata-concept-scheme")

module.exports = new WikidataConceptScheme({
  uri: "http://bartoc.org/en/node/1940",
  notation: ["WD"],
  namespace: "http://www.wikidata.org/entity/",
  notationPattern: "Q[1-9][0-9]*",
  uriPattern: "^http://www\\.wikidata\\.org/entity/(Q[1-9][0-9]*)$",
})
