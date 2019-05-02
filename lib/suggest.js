/**
 * See <https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities>
 *
 * TODO: support limit/continue?
 */
const { httpRequest } = require("./utils/request")

module.exports = query => {
  let { search, language } = query

  language = (language || "").split(",")[0] || "en"

  return httpRequest("https://www.wikidata.org/w/api.php?", {
    action: "wbsearchentities",
    type: "item",
    format: "json",
    uselang: language,
    language,
    search
  }).then(result => [
    result.searchinfo.search,
    result.search.map(item => item.id + " " + item.label || ""),
    result.search.map(item => item.description || ""),
    result.search.map(item => item.concepturi)
  ]).catch(() => [search, [], [], []])
}
