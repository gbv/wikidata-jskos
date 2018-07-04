# Usage as web service

```bash
# serve with hot reload and auto reconnect at localhost:2013 (default)
npm run start
```

For deployment for instance use pm2:

```bash
pm2 start ecosystem.config.json
```

The web service provides the following endpoints

### /concept?uri=...

Look up a Wikidata item as JSKOS Concept by its entity URI or QID.

Optional parameters:

* `language` or `languages`: comma separated list of language codes

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

Optional query parameter `language` or `languages` enables inclusion of entity
labels. A comma separated list of language codes is used as preference list.

### /scheme

Return a list of supported concept schemes. These schemes need to have a
BARTOC-ID ([P2689]), and be subject item ([P1629]) of an external identifier
property with statements [P1921] and [P1793].

