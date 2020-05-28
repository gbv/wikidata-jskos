const config = require("../config")
const ServiceError = require("./service-error")
const wbEdit = require("wikibase-edit")

module.exports = (user) => {
  let oauth = user && user.identities && user.identities.wikidata && user.identities.wikidata.oauth
  if (!oauth || !oauth.token || !oauth.token_secret) {
    throw new ServiceError("Unauthorized user, possibly missing the Wikidata indentity.", 403)
  }
  return wbEdit({
    wikibaseInstance: config.wikibase.instance,
    credentials: {
      oauth: Object.assign({}, oauth, config.oauth),
    },
    maxlag: 15,
    autoRetry: false,
  })
}
