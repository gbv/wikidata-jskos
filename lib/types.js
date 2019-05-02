const entityTypes = {
  item: "http://wikiba.se/ontology#Item",
  property: "http://wikiba.se/ontology#Property"
}

const mappingTypes = {
  Q39893184: "http://www.w3.org/2004/02/skos/core#closeMatch",
  Q39893449: "http://www.w3.org/2004/02/skos/core#exactMatch",
  Q39893967: "http://www.w3.org/2004/02/skos/core#narrowMatch",
  Q39894595: "http://www.w3.org/2004/02/skos/core#broadMatch",
  Q39894604: "http://www.w3.org/2004/02/skos/core#relatedMatch"
}

module.exports = { entityTypes, mappingTypes }
