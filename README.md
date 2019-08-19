# Wikidata JSKOS

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/gbv/wikidata-jskos.svg?branch=master)](https://travis-ci.org/gbv/wikidata-jskos)
[![npm version](http://img.shields.io/npm/v/wikidata-jskos.svg?style=flat)](https://www.npmjs.org/package/wikidata-jskos)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Access [Wikidata] in [JSKOS] format

This node module provides a web service, a command line client, and a library to access Wikidata in [JSKOS] format.

## Table of Contents

- [Background](#background)
- [Install](#install)
  - [Clone and Install](#clone-and-install)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Run Server](#run-server)
  - [Deployment](#deployment)
- [Web Service](#web-service)
  - [Authentication](#authentication)
  - [GET /mappings](#get-mappings)
  - [GET /mappings/voc](#get-mappingsvoc)
  - [GET /mappings/:_id](#get-mappings_id)
  - [POST /mappings](#post-mappings)
  - [PUT /mappings/:_id](#put-mappings_id)
  - [DELETE /mappings/:_id](#delete-mappings_id)
  - [GET /concept](#get-concept)
  - [GET /suggest](#get-suggest)
- [Command line tool](#command-line-tool)
  - [wdjskos concept](#wdjskos-concept)
  - [wdjskos mappings](#wdjskos-mappings)
  - [wdjskos schemes](#wdjskos-schemes)
  - [wdjskos find](#wdjskos-find)
  - [wdjskos mapping-item](#wdjskos-mapping-item)
- [API](#api)
  - [mapEntity](#mapentity)
  - [mapMapping](#mapmapping)
- [Contribute](#contribute)
- [License](#license)

[mapEntity]: #mapentity
[mapMapping]: #mapmapping

## Background

[Wikidata] is a large knowledge base with detailed information about all kinds
of entities. Mapping its data model to [JSKOS] data format allows simplified
reuse of Wikidata as authority file. The mapping includes concordances between
Wikidata and identifiers from other databases.

**See Also:**

* <https://coli-conc.gbv.de/>
* <https://github.com/maxlath/wikidata-sdk>
* <https://tools.wmflabs.org/hub/>

## Install

### Clone and Install

```sh
# clone the repository
git clone https://github.com/gbv/wikidata-jskos.git
cd wikidata-jskos

# install dependencies
npm install
```

Optionally make the [command line tool](#command-line-tool) `wdjskos` available:

```sh
npm link
```

### Configuration

You can customize the application settings via a configuration file, e.g. by providing a generic `config.json` file and/or a more specific `config.{env}.json` file (where `{env}` is the environment like `development` or `production`). The latter will have precendent over the former, and all missing keys will be defaulted with values from `config.default.json`.

Please consult `config.default.json` for possible configuration options. Some notes:
- To use a custom Wikibase instance, you can set the subkeys of the `wikibase` property. Both `instance` and `sparqlEnpoint` are necessary. By default, Wikidata is used.
- wikidata-jskos supports saving, editing, and deleting mappings in Wikidata. To enable this, you will need to provide `auth.algorithm` and `auth.key` (algorithm and key to decode the JWT), as well as `oauth.consumer_key` and `oauth.consumer_secret` (for your registered OAuth consumer).

## Usage

### Run Server

For development serve with hot reload and auto reconnect at <http://localhost:2013/>:

```bash
npm run start
```

### Deployment

For deployment there is a config file to use with [pm2](http://pm2.keymetrics.io/):

```bash
pm2 start ecosystem.config.json
```

## Web Service

An instance is available at <https://coli-conc.gbv.de/services/wikidata/>. The
service provides the following endpoints, aligned with [JSKOS Server].

### Authentication
The following endpoints require an authenticated user:
- [POST /mappings](#post-mappings)
- [PUT /mappings/:_id](#put-mappings_id)
- [DELETE /mappings/:_id](#delete-mappings_id)

Authentication works via a JWT (JSON Web Token). The JWT has to be provided as a Bearer token in the authentication header, e.g. `Authentication: Bearer <token>`. It is integrated with [login-server](https://github.com/gbv/login-server) and the JWT is required to have the same format as the one login-server provides. Specifically, the OAuth token and secret for the user need to be provided as follows:

```json
{
  "user": {
    "identities": {
      "wikidata": {
        "oauth": {
          "token": "..",
          "token_secret": "..."
        }
      }
    }
  }
}
```

There are more properties in the JWT, but those are not used by wikidata-jskos. Note that the JWT needs to be signed with the respective private key for the public key provided in the [configuration](#configuration). Also, the OAuth user token and secret need to come from the same OAuth consumer provided in the config.

### GET /mappings

Look up Wikidata mapping statements as [JSKOS Concept Mappings] between
Wikidata items (query parameter `from`) and external identifiers (query
parameter `to`). At least one of both parameters must be given.

* **URL Params**

  `from=[uri|notation]` specify the source URI or notation

  `to=[uri|notation]` specify the target URI or notation

  `fromScheme=[uri|notation]` only show mappings from this concept scheme (URI or notation)

  `toScheme=[uri|notation]` only show mappings to this concept scheme (URI or notation)

  `language` or `languages` enables inclusion of entity labels. A comma separated list of language codes is used as preference list.

  `mode=[mode]` specify the mode for `from`, `to`, one of `and` (default) and `or`

  `direction=forward|backward|both` searches mappings from `from` to `to` (default), reverse, or in both directions

Concept Schemes are identified by BARTOC IDs (e.g. <http://bartoc.org/en/node/430> or just `430`).

* **Success Response**

  JSON array of [JSKOS Concept Mappings]

* ***Examples***

  `?from=http://www.wikidata.org/entity/Q42`

  `?to=http://d-nb.info/gnd/119033364`

Mapping relation types ([P4390]) are respected, if given, see for example
mapping from Wikidata to <http://d-nb.info/gnd/7527800-5>.

[P1921]: http://www.wikidata.org/entity/P1921
[P1793]: http://www.wikidata.org/entity/P1793
[P1629]: http://www.wikidata.org/entity/P1629
[P2689]: http://www.wikidata.org/entity/P2689
[P4390]: http://www.wikidata.org/entity/P2689

### GET /mappings/voc

Look up Wikidata items with [Wikidata properties for authority control] as
[JSKOS Concept Schemes] with used for mappings. These schemes need to have a
BARTOC-ID ([P2689]), and be subject item ([P1629]) of an external identifier
property with statements [P1921] (URI template) and [P1793] (regular
expression).

* **URL Params**

  None.

* **Success Response**

  JSON array of [JSKOS Concept Schemes]

### GET /mappings/:_id
Returns a specific mapping for a Wikidata claim/statement.

* **Success Response**

  JSKOS object for mapping.

* **Error Response**

  If no claim with `_id` could be found, it will return a 404 not found error.

* **Sample Call**

  ```bash
  curl https://coli-conc.gbv.de/services/wikidata/mappings/Q11351-9968E140-6CA7-448D-BF0C-D8ED5A9F4598
  ```

  ```json
  {
    "uri": "http://localhost:2013/mappings/Q11351-9968E140-6CA7-448D-BF0C-D8ED5A9F4598",
    "identifier": [
      "http://www.wikidata.org/entity/statement/Q11351-9968E140-6CA7-448D-BF0C-D8ED5A9F4598",
      "urn:jskos:mapping:content:2807c55eac85ed8c0c9254ff04b457f89b801ac9",
      "urn:jskos:mapping:members:daafcd8580e6f0304f0b1cee024f65f04da98a3c"
    ],
    "to": {
      "memberSet": [
        {
          "uri": "http://rvk.uni-regensburg.de/nt/VK",
          "notation": [
            "VK"
          ]
        }
      ]
    },
    "type": [
      "http://www.w3.org/2004/02/skos/core#exactMatch"
    ],
    "fromScheme": {
      "uri": "http://bartoc.org/en/node/1940",
      "notation": [
        "WD"
      ]
    },
    "toScheme": {
      "uri": "http://bartoc.org/en/node/533",
      "notation": [
        "RVK"
      ]
    },
    "from": {
      "memberSet": [
        {
          "uri": "http://www.wikidata.org/entity/Q11351",
          "notation": [
            "Q11351"
          ]
        }
      ]
    },
    "@context": "https://gbv.github.io/jskos/context.json"
  }
  ```

### POST /mappings
Saves a mapping in Wikidata. Requires [authentication](#authentication).

Note that if an existing mapping in Wikidata is found with the exact same members, that mapping will be overwritten by this request.

* **Success Reponse**

  JSKOS Mapping object as it was saved in Wikidata.

### PUT /mappings/:_id
Overwrites a mapping in Wikidata. Requires [authentication](#authentication).

* **Success Reponse**

  JSKOS Mapping object as it was saved in Wikidata.

### DELETE /mappings/:_id
Deletes a mapping from Wikidata. Requires [authentication](#authentication).

* **Success Reponse**

  Status 204, no content.

### GET /concept

Look up Wikidata items as [JSKOS Concepts] by their entity URI or QID.

* **URL Params**

  `uri=[uri]` URIs for concepts separated by `|`.

  `language` or `languages`: comma separated list of language codes.

* **Success Response**

  JSON array of [JSKOS Concepts]

### GET /suggest

OpenSearch Suggest endpoint for typeahead search.

[JSKOS Concept Schemes]: https://gbv.github.io/jskos/jskos.html#concept-schemes
[JSKOS Server]: https://github.com/gbv/jskos-server
[JSKOS Concepts]: https://gbv.github.io/jskos/jskos.html#concept
[JSKOS Concept Mappings]: https://gbv.github.io/jskos/jskos.html#concept-mappings
[Wikidata properties for authority control]: http://www.wikidata.org/entity/Q18614948

## Command line tool

The command line client `wdjskos` provides the same commands as accessible via
[the web service](#web-service).

Mapping schemes are cached in the caching directory of [wikidata-cli].

### wdjskos concept

Look up Wikidata items as [JSKOS Concepts].

### wdjskos mappings

Look up [JSKOS Concept Mappings].

    wdjskos mappings Q42 | jq .to.memberSet[].uri
    wdjskos mappings - http://viaf.org/viaf/113230702

A single hyphen (`-`) can be used to nullify argument `from` or `to`,
respectively. Mappings can be limited to a target scheme. These are equivalent:

    wdjskos --scheme P227 mappings Q42
    wdjskos --scheme 430 mappings Q42
    wdjskos --scheme http://bartoc.org/en/node/430 mappings Q42

### wdjskos schemes

Look up [JSKOS Concept Schemes] with [Wikidata properties for authority control].

### wdjskos find

Search a Wikidata item by its names and return OpenSearch Suggestions response.

### wdjskos mapping-item

Convert a JSKOS mapping to a Wikidata item.

    wdjskos mapping-item mapping.json
    wdjskos --simplfiy mapping-item mapping.json

## API

The node library can be used to convert Wikidata JSON format to JSKOS
([mapEntity]) and to convert JSKOS mappings to Wikidata JSON format
([mapMapping]).

### mapEntity

```js
jskos = wds.mapEntity(entity)
```

Entity data can be retrieved via Wikidata API method [wbgetentities] and from
Wikidata database dumps. See JavaScript libraries [wikidata-sdk] and
[wikidata-filter] for easy access and processing.

#### Map selected parts of a Wikidata entity

All methods return a JSKOS item.

```js
jskos = wds.mapIdentifier(entity.id)
// { uri: "http://www.wikidata.org/entity/...", notation: [ "..." ] }

jskos = wds.mapLabels(entity.labels)
// { prefLabel: { ... } }

jskos = wds.mapAliases(entity.aliases)
// { altLabel: { ... } }

jskos = wds.mapDescriptions(entity.descriptions)
// { scopeNote: { ... } }

jskos = wds.mapSitelinks(entity.sitelinks)
// { occurrences: [ { ... } ], subjectOf: [ { url: ... }, ... ] }

jskos = wds.mapClaims(entity.claims)
// ...

// convert claims with mapping properties
jskos = wds.mapMappingClaims(claims)

jskos = wds.mapInfo(entity)
// ...
```

#### Map simplified Wikidata entities

Each method has a counterpart to map simplified Wikidata entities.

```js
jskos = wds.mapSimpleEntity(entity)
jskos = wds.mapSimpleIdentifier(entity.id)
jskos = wds.mapSimpleLabels(entity.labels)
...
```

### mapMapping

Convert a JSKOS mapping into a Wikidata claim. Only respects JSKOS fields
`from`, `to`, `uri`, and `type` (if given) and only supports 1-to-1 mappings
from a single Wikidata item to a concept in another concept scheme.

*this is work in progress!*

## Contributing

See <https://github.com/gbv/wikidata-jskos>.

For debugging set environment variable `DEBUG`, also possible via file `.env`:

    DEBUG=wds:*

See `lib/utils/debug.js` for details.

## License

[MIT License](LICENSE.md)


[wbgetentities]: https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
[wikidata-sdk]: https://github.com/maxlath/wikidata-sdk
[wikidata-cli]: https://github.com/maxlath/wikidata-cli
[wikidata-filter]: https://github.com/maxlath/wikidata-filter
[Wikidata]: https://www.wikidata.org/
[JSKOS]: https://gbv.github.io/jskos/
