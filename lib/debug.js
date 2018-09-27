// set environemnt variables from .env, especially DEBUG
require("dotenv").config()

const debug = require("debug")

const sparql = (message) => debug("wds:sparql")(message)
const http   = (message) => debug("wds:http")(message)

module.exports = { sparql, http }
