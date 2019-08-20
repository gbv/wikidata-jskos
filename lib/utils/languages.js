module.exports = function(languages) {
  return languages && languages.length
    ? "?item rdfs:label ?itemLabel . FILTER(" +
      (languages.length === 1
        ? `LANG(?itemLabel) = "${languages[0]}"`
        : `REGEX(LANG(?itemLabel),"^(${languages.join("|")})$")`) +
      ")"
    : ""
}
