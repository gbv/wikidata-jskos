# CHANGELOG

## next

- Update dependencies

## 0.5.4

- Update dependencies
- Fix issue where POST/PUT request wouldn't return correct mapping URI

## 0.5.3

- Update dependencies
- Update GitHub workflows
- Update mapping schemes (including workaround to fix BARTOC URIs) (#73)

## 0.5.2

- Update linting setup
- Update dependencies (#88)

## 0.5.1

- Update express dependency (#87)

## 0.5.0

- Updated all dependencies
- Make sure writing mappings is only possible with matching from concept (#65)
- Code updated to ESM (#82, thanks to @hereje for the PR #86!)

## 0.4.0

- [Add Docker image](https://github.com/gbv/wikidata-jskos/tree/main/docker)
- Allow [configuration via environment variables](https://github.com/gbv/wikidata-jskos#configuration)
- Update README
- Update dependencies
- Some small changes and fixes

## 0.3.3

- Return no mappings if partOf parameter is present (#63)
- Fix issue for /mappings when fromScheme or toScheme are not known (#63)
- Update dependencies
- Refactoring and documentation
- Do not return data for unknown concept (#53)
- Don't die on too many request ids (#48)
- Include geographical coordinates

## 0.3.2

* Support multiple concepts in /mappings?to&from (#45)

## 0.3.1

* Rename /concept to /data (#42)
* Fix writing of RVK mappings (#44)

## 0.3.0

* Adjust config and /status endpoint (#39)

## 0.2.9

* Implement write access to mappings
* Add mapping cardinality to config
* Return pretty JSON
* Support mapping search by notation
* Support alternative scheme URIs
* Update status endpoint to new format
* Improve pagination (#24)
* Include total number of property usage (#33)

## 0.2.3

* Support converting RVK URIs to Wikidata JSON

## 0.2.2

* Extend wdjskos command mapping-item with option simplify

## 0.2.1

* Fix detection of Wikibase statement identifiers

## 0.2.0

* Add basic conversion from JSKOS mappings to Wikidata JSON
