const { sparqlRequest } = require("../request")
const languageFilter = require("./language-filter")

function getBacklinks (uris, languages, properties) {
  const values = uris.map(uri => `<${uri}>`).join(" ")
  const props = properties.map(p => `wdt:${p}`).join(" | ")

  const filter = languageFilter(languages)
  const sparql = `
    SELECT DISTINCT ?from ?item ?itemLabel WHERE {
      VALUES ?from { ${values} }
      ?item ${props} <${uris}> .
      ${filter}
    } LIMIT 500`

  return sparqlRequest(sparql)
    .then(rows => {
      const entities = {}
      rows.forEach(row => {
        const uri = row.item.value
        if (!(uri in entities)) {
          entities[uri] = {
            uri,
            prefLabel: (languages && languages.length ? { "-": "?" } : { }),
            notation: [uri.split("/").pop()]
          }
        }

        if (row.itemLabel) {
          entities[uri].prefLabel[row.itemLabel["xml:lang"]] = row.itemLabel.value
        }
      })

      const seen = {}
      return rows
        // distinct combination of ?from and ?item
        .filter(row => {
          const key = row.from.value + row.item.value
          if (!seen[key]) {
            return (seen[key] = true)
          }
        })
        .map(row => [row.from.value, entities[row.item.value]])
    })
}

module.exports = getBacklinks
