# Map Wikidata entities to JSKOS

Wikidata-JSKOS can be used to map Wikidata entities to [JSKOS data format]:

```js
jskos = wds.map.entity(entity)
```

Entity data can be retrieved via Wikidata API method [wbgetentities] and from
Wikidata database dumps. See JavaScript libraries [wikidata-sdk] and 
[wikidata-filter] for easy access and processing.

## Map selected parts of a Wikidata entity

All methods return a JSKOS item.

```js
jskos = wds.map.identifier(entity.id)
// { uri: "http://www.wikidata.org/entity/..." }

jskos = wds.map.labels(entity.labels)
// { prefLabel: { ... } }

jskos = wds.map.aliases(entity.aliases)
// { altLabel: { ... } }

jskos = wds.map.descriptions(entity.descriptions)
// { scopeNote: { ... } }

jskos = wds.map.sitelinks(entity.sitelinks)
// ...

jskos = wds.map.claims(entity.claims)
// ...

jskos = wds.map.info(entity)
// ...
```

## Map simplified Wikidata entities

Each method has a counterpart to map simplified Wikidata entities.

```js
jskos = wds.map.simplified.entity(entity)
jskos = wds.map.simplified.identifier(entity.id)
jskos = wds.map.simplified.labels(entity.labels)
...
```

[JSKOS]: https://gbv.github.io/jskos/
[wbgetentities]: https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
[wikidata-sdk]: https://github.com/maxlath/wikidata-sdk
[wikidata-filter]: https://github.com/maxlath/wikidata-filter

