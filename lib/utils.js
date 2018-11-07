const languageRegex = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/

function selectedLanguages (query) {
  var languages = query.language || query.languages
  if (languages) {
    if (!Array.isArray(languages)) {
      languages = languages.split(',')
    }
    return languages.filter(lang => languageRegex.test(lang))
  } else {
    return []
  }
}

function labelFromSparql (label) {
  if (label !== undefined && label['xml:lang']) {
    const prefLabel = { '-': '?' }
    prefLabel[label['xml:lang']] = label.value
    return prefLabel
  }
}

function cleanupQuery (query) {
  Object.keys(query).forEach(key => {
    if (query[key] === '' || query[key] === null || query[key] === undefined) {
      delete query[key]
    }
  })
  return query
}

module.exports = { selectedLanguages, labelFromSparql, cleanupQuery }
