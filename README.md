# Wikidata JSKOS Wrapper

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/gbv/wikidata-jskos.svg?branch=master)](https://travis-ci.org/gbv/wikidata-jskos)

## Build Setup

``` bash
# clone the repository
git clone https://github.com/gbv/wikidata-jskos.git
cd wikidata-jskos

# install dependencies
npm install
```

## Usage as Webservice

```bash
# serve with hot reload and auto reconnect at localhost:2013 (default)
npm run start
```

For deployment for instance use pm2:

```bash
pm2 start server.js --name wikidata-jskos
```

The web service provides the following endpoints

### /concept?uri=...

Look up a Wikidata item as JSKOS Concept by its entity URI or QID.

### /mapping?...

Look up JSKOS mappings between Wikidata items (query parameter `from`) and
external identifiers (query parameter `to`). At least one of both parameters
must be given:

* `from` (e.g. `?from=http://www.wikidata.org/entity/Q42`)
* `to` (e.g. `?to=http://d-nb.info/gnd/119033364`)

Mapping relation types ([P4390]) are respected, if given, see for example
mapping from Wikidata to <http://d-nb.info/gnd/7527800-5>.

[P1921]: http://www.wikidata.org/entity/P1921
[P1793]: http://www.wikidata.org/entity/P1793
[P1629]: http://www.wikidata.org/entity/P1629
[P2689]: http://www.wikidata.org/entity/P2689
[P4390]: http://www.wikidata.org/entity/P2689

### /scheme

Return a list of supported concept schemes. These schemes need to have a
BARTOC-ID ([P2689]), and be subject item ([P1629]) of an external identifier
property with statements [P1921] and [P1793].

## JavaScript API

NodeJS (*not enabled yet!*):

```js
const wds = require('wikidata-wds')
```

### Usage

* **[Map Wikidata entities to JSKOS](docs/entities.md)**
* ...


## See Also

* <https://github.com/maxlath/wikidata-sdk>
* <https://tools.wmflabs.org/hub/>
