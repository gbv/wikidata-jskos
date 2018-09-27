const { sparqlRequest } = require("../utils/request.js")
const { labelFromSparql } = require("../utils.js")


function getBacklinks(uris, languages, properties) {
  const values = uris.map(uri => `<${uri}>`).join(" ")
  const props = properties.map(p => `wdt:${p}`).join(" | ")

  const sparql = `
    SELECT DISTINCT ?from ?entity ?entityLabel WHERE {
      VALUES ?from { ${values} }
      ?entity ${props} <${uris}>`
      + (languages && languages.length ? `
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${languages.join(",")}".
      }` : "") + `
    } LIMIT 1000`

  return sparqlRequest(sparql)
    .then(rows => {
      return rows.map(row => {
        const entity = { uri: row.entity.value }
        if (row.entityLabel) {
          entity.prefLabel = labelFromSparql(row.entityLabel)
        }
        return [row.from.value, entity]
      })
    })
}

module.exports = getBacklinks
