/**
 * See <https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities>
 *
 * TODO: support limit/continue?
 */
import config from "../config.js"
import { httpRequest } from "./request.js"

export default function queryFn(query) {
  let { search, language, limit } = query
  // Wikidata API has a hard limit for 50 results
  // TODO: Combine multiple requests to get around this limit.
  limit = Math.max(limit || 10, 50)

  language = (language || "").split(",")[0] || "en"

  return httpRequest(`${config.wikibase.api}?`, {
    action: "wbsearchentities",
    type: "item",
    format: "json",
    uselang: language,
    language,
    search,
    limit,
  }).then(result => [
    result.searchinfo.search,
    result.search.map(item => item.id + " " + item.label || ""),
    result.search.map(item => item.description || ""),
    result.search.map(item => item.concepturi),
  ]).catch(() => [search, [], [], []])
}
