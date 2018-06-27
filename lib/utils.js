// TODO: https://github.com/maxlath/wikidata-sdk/issues/35

const aggregatePerRank = function (aggregate, claim) {
  const { rank } = claim
  aggregate[rank] || (aggregate[rank] = [])
  aggregate[rank].push(claim)
  return aggregate
}

const truthyClaims = function (claims) {
  const aggregate = claims.reduce(aggregatePerRank, {})
  return aggregate.preferred || aggregate.normal || []
}


const mappingTypes = {
  "Q39893184": "http://www.w3.org/2004/02/skos/core#closeMatch",
  "Q39893449": "http://www.w3.org/2004/02/skos/core#exactMatch",
  "Q39893967": "http://www.w3.org/2004/02/skos/core#narrowMatch",
  "Q39894595": "http://www.w3.org/2004/02/skos/core#broadMatch",
  "Q39894604": "http://www.w3.org/2004/02/skos/core#relatedMatch"
}

module.exports = { truthyClaims, mappingTypes }
