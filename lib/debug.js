require("../config")
const debug = require("debug")

module.exports = {
  sparql: message => debug("sparql")(message),
  http: message => debug("http")(message),
  query: message => debug("query")(message),
}
