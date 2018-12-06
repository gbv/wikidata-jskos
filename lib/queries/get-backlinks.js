const { sparqlRequest } = require('../utils/request.js')

function getBacklinks (uris, languages, properties) {
  const values = uris.map(uri => `<${uri}>`).join(' ')
  const props = properties.map(p => `wdt:${p}`).join(' | ')

  const filter = languages
    ? 'FILTER(' +
      (languages.length === 1
        ? `LANG(?label) = "${languages[0]}"`
        : `REGEX(LANG(?label),"^(${languages.join('|')})$")`) +
      ')'
    : ''
  const sparql = `
    SELECT DISTINCT ?from ?entity ?label WHERE {
      VALUES ?from { ${values} }
      ?entity ${props} <${uris}> .
      ?entity rdfs:label ?label .
      ${filter}
    } LIMIT 500`

  return sparqlRequest(sparql)
    .then(rows => {
      const entities = {}
      rows.forEach(row => {
        const uri = row.entity.value
        if (!(uri in entities)) {
          entities[uri] = {
            uri,
            prefLabel: (languages && languages.length ? { '-': '?' } : { }),
            notation: [uri.split('/').pop()]
          }
        }

        if (row.label) {
          entities[uri].prefLabel[row.label['xml:lang']] = row.label.value
        }
      })

      return rows.map(row => [row.from.value, entities[row.entity.value]])
    })
}

module.exports = getBacklinks
