const { sparqlRows, labelFromSparql, promiseRequest } 
  = require("./utils.js")

function getBacklinks(uris, languages, properties) {
  const values = uris.map(uri => `<${uri}>`).join(" ")
  const props = properties.map(p => `wdt:${p}`).join(" | ")

  const sparql = `
    SELECT ?from ?entity ?entityLabel WHERE {
      VALUES ?from { ${values} }
      ?entity ${props} <${uris}>` 
      + (languages && languages.length ? `
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${languages.join(",")}".
      }` : "") + `
    }`

  return sparqlRows(sparql, promiseRequest)
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

module.exports = { getBacklinks }

