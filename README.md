# Wikidata JSKOS

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/gbv/wikidata-jskos.svg?branch=master)](https://travis-ci.org/gbv/wikidata-jskos)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Access Wikidata in JSKOS format

This node module provides a web service, a command line client, and a library to access Wikidata in [JSKOS] format.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)


## Background

[Wikidata] is a large knowledge base with detailled informatin about all kinds
of entities. Mapping its data model to [JSKOS] data format allows simplified
reuse of Wikidata as authority file. The mapping includes concordances between
Wikidata and identifiers from other databases.

### See Also

* <https://coli-conc.gbv.de/>
* <https://github.com/maxlath/wikidata-sdk>
* <https://tools.wmflabs.org/hub/>


## Install

### Clone and install dependencies

``` bash
# clone the repository
git clone https://github.com/gbv/wikidata-jskos.git
cd wikidata-jskos

# install dependencies
npm install
```

### Install webservice

For deployment there is a config file to use with [pm2](http://pm2.keymetrics.io/):

```bash
pm2 start ecosystem.config.json
```

For development serve with hot reload and auto reconnect at <http://localhost:2013/>:

```bash
npm run start
```


## Usage

### Web Service

An instance is available at <https://coli-conc.gbv.de/services/wikidata/>. The
service provides the following endpoints:

#### /concept?uri=...

Look up a Wikidata item as JSKOS Concept by its entity URI or QID.

Optional parameters:

* `language` or `languages`: comma separated list of language codes

#### /mapping?..

Look up JSKOS mappings between Wikidata items (query parameter `from`) and
external identifiers (query parameter `to`). At least one of both parameters
must be given:

* `from` (e.g. `?from=http://www.wikidata.org/entity/Q42`)
* `to` (e.g. `?to=http://d-nb.info/gnd/119033364`)

The optional parameter `toScheme` can limit result of query with `from` to a
selected concept scheme, identified by BARTOC URI (e.g.
<http://bartoc.org/en/node/430> or just `430`).

Mapping relation types ([P4390]) are respected, if given, see for example
mapping from Wikidata to <http://d-nb.info/gnd/7527800-5>.

[P1921]: http://www.wikidata.org/entity/P1921
[P1793]: http://www.wikidata.org/entity/P1793
[P1629]: http://www.wikidata.org/entity/P1629
[P2689]: http://www.wikidata.org/entity/P2689
[P4390]: http://www.wikidata.org/entity/P2689

Optional query parameter `language` or `languages` enables inclusion of entity
labels. A comma separated list of language codes is used as preference list.

#### /scheme

Return a list of supported concept schemes. These schemes need to have a
BARTOC-ID ([P2689]), and be subject item ([P1629]) of an external identifier
property with statements [P1921] (URI template) and [P1793] (regular
expression).


### CLI

The command line client `wdjskos` provides the same functionality as the web
service (see [usage as web service](webservice.md)).

## Examples

**Get mappings:**

    wdjskos m Q42 | jq .to.memberSet[].uri
    wdjskos m - http://viaf.org/viaf/113230702

A single character (e.g. `-`) can be used to nullify argument `from` or `to`,
respectively. Mappings can be limited to a target scheme. These are equivalent:

    wdjskos --scheme P227 mappings Q42
    wdjskos --scheme 430 mappings Q42
    wdjskos --scheme http://bartoc.org/en/node/430 mappings Q42

Mapping schemes are cached in the caching directory of [wikidata-cli].

## API

```js
jskos = wds.mapEntity(entity)
```

Entity data can be retrieved via Wikidata API method [wbgetentities] and from
Wikidata database dumps. See JavaScript libraries [wikidata-sdk] and
[wikidata-filter] for easy access and processing.

### Map selected parts of a Wikidata entity

All methods return a JSKOS item.

```js
jskos = wds.mapIdentifier(entity.id)
// { uri: "http://www.wikidata.org/entity/..." }

jskos = wds.mapLabels(entity.labels)
// { prefLabel: { ... } }

jskos = wds.mapAliases(entity.aliases)
// { altLabel: { ... } }

jskos = wds.mapDescriptions(entity.descriptions)
// { scopeNote: { ... } }

jskos = wds.mapSitelinks(entity.sitelinks)
// ...

jskos = wds.mapClaims(entity.claims)
// ...

jskos = wds.mapInfo(entity)
// ...
```

### Map simplified Wikidata entities

Each method has a counterpart to map simplified Wikidata entities.

```js
jskos = wds.mapSimpleEntity(entity)
jskos = wds.mapSimpleIdentifier(entity.id)
jskos = wds.mapSimpleLabels(entity.labels)
...
```

## Contributing

See <https://github.com/gbv/wikidata-jskos>.

## License

[MIT License](LICENSE.md)


[wbgetentities]: https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
[wikidata-sdk]: https://github.com/maxlath/wikidata-sdk
[wikidata-cli]: https://github.com/maxlath/wikidata-cli
[wikidata-filter]: https://github.com/maxlath/wikidata-filter
[Wikidata]: https://www.wikidata.org/
[JSKOS]: https://gbv.github.io/jskos/
