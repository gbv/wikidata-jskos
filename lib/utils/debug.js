// set environemnt variables from .env, especially DEBUG
require("dotenv").config()

const debug = require("debug")

module.exports = {
  sparql: (message) => debug("wds:sparql")(message),
  http:   (message) => debug("wds:http")(message),
  query:  (message) => debug("wds:query")(message)
}
