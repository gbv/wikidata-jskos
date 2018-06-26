# Wikidata JSKOS Wrapper

## Build Setup

``` bash
# clone the repository
git clone https://github.com/gbv/wikidata-jskos.git
cd wikidata-jskos

# install dependencies
npm install

# serve with hot reload and auto reconnect at localhost:2013 (default)
npm run start
```

## Documentation

The web service provides the following endpoints

### /mappings

Look up JSKOS mappings between Wikidata items (query parameter `from`) and
external identifiers (query parameter `to`). At least one of both parameters
must be given:

* `from` (e.g. `?from=http://www.wikidata.org/entity/Q42`)
* `to` (e.g. `?to=http://d-nb.info/gnd/119033364`)

External identifiers are detected for Wikidata properties with statement
[P1921], [P1793], and a subject item ([P1629]) with BARTOC-ID ([P2689]).

[P1921]: http://www.wikidata.org/entity/P1921
[P1793]: http://www.wikidata.org/entity/P1793
[P1629]: http://www.wikidata.org/entity/P1629
[P2689]: http://www.wikidata.org/entity/P2689

### /schemes

*Not implemented yet*

## See Also

* <https://tools.wmflabs.org/hub/>
