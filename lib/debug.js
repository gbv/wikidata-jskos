import "../config.js"
import debug from "debug"

export default {
  sparql: message => debug("sparql")(message),
  http: message => debug("http")(message),
  query: message => debug("query")(message),
}
