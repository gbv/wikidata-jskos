# Map Wikidata entities to JSKOS

Wikidata-JSKOS can be used to map Wikidata entities to [JSKOS data format]:

```js
jskos = wds.mapEntity(entity)
```

Entity data can be retrieved via Wikidata API method [wbgetentities] and from
Wikidata database dumps. See JavaScript libraries [wikidata-sdk] and 
[wikidata-filter] for easy access and processing.

## Map selected parts of a Wikidata entity

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

## Map simplified Wikidata entities

Each method has a counterpart to map simplified Wikidata entities.

```js
jskos = wds.mapSimpleEntity(entity)
jskos = wds.mapSimpleIdentifier(entity.id)
jskos = wds.mapSimpleLabels(entity.labels)
...
```

[JSKOS data format]: https://gbv.github.io/jskos/
[wbgetentities]: https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
[wikidata-sdk]: https://github.com/maxlath/wikidata-sdk
[wikidata-filter]: https://github.com/maxlath/wikidata-filter

