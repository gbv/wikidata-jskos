# Usage as command line client

The command line client `wdjskos` provides the same functionality as the web
service (see [usage as web service](webservice.md)).

## Examples

### Get mappings

    wdjskos m Q42 | jq .to.memberSet[].uri
    wdjskos m - http://viaf.org/viaf/113230702

A single character (e.g. `-`) can be used to nullify argument `from` or `to`,
respectively.
