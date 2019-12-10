const WikidataConceptScheme = require("./wikidata-concept-scheme")
const WikidataConceptSchemeSet = require("./wikidata-concept-scheme-set")
const WikidataService = require("./wikidata-service")

const classes = { WikidataConceptScheme, WikidataConceptSchemeSet, WikidataService }
const types = require("./types")
const mappers = require("./mappers")

module.exports = Object.assign(classes, mappers, types)
