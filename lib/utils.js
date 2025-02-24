import wikidata from "./wikidata.js"
import wdk from "./wdk.js"

const languageRegex = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/

function selectedLanguages (query) {
  let languages = query.language || query.languages
  if (languages) {
    if (!Array.isArray(languages)) {
      languages = languages.split(",")
    }
    return languages.filter(lang => languageRegex.test(lang))
  } else {
    return []
  }
}

function labelFromSparql (label) {
  if (label !== undefined && label["xml:lang"]) {
    return {
      [label["xml:lang"]]: label.value,
    }
  }
}

function detectWikidataConcepts (ids) {
  return (ids ? ids.split("|") : []).map(id => {
    if (wdk.isEntityId(id)) {
      id = "http://www.wikidata.org/entity/" + id
    }
    return wikidata.conceptFromUri(id)
  }).filter(Boolean)
}

export {
  selectedLanguages,
  labelFromSparql,
  detectWikidataConcepts,
}
