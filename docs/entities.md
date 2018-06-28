# Map Wikidata entities to JSKOS

Wikidata-JSKOS can be used to map Wikidata entities to [JSKOS data format]:

```js
jskos = wds.map.entity(entity)
```

Entity data can be retrieved via Wikidata API method [wbgetentities] and from
Wikidata database dumps. See JavaScript libraries [wikidata-sdk] and 
[wikidata-filter] for easy access and processing.

## Map selected parts of a Wikidata entity

```js
jskos = wds.map.identifier(entity)
// { uri: "http://www.wikidata.org/entity/..." }
```

```js
jskos = wds.map.labels(entity)
// { prefLabel: { ... } }

jskos = wds.map.aliases(entity)
// { altLabelel: { ... } }

jskos = wds.map.descriptions(entity)
// { scopeNote: { ... } }

jskos = wds.map.sitelinks(entity)
// ...

jskos = wds.map.info(entity)
// ...

jskos = wds.map.claims(entity)
// ...
```

## Map simplified Wikidata entities

*not implemented yet*


[JSKOS]: https://gbv.github.io/jskos/
[wbgetentities]: https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
[wikidata-sdk]: https://github.com/maxlath/wikidata-sdk
[wikidata-filter]: https://github.com/maxlath/wikidata-filter

