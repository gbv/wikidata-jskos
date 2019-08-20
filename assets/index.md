# Wikidata JSKOS Service

This web service provides access to content from [Wikidata] in [JSKOS format]. The API is aligned with [JSKOS Server].

## Sample Queries

### Concepts

* [concept?uri=http://www.wikidata.org/entity/Q42](concept?uri=http://www.wikidata.org/entity/Q42)

### Mappings

* [mappings?from=http://www.wikidata.org/entity/Q2013](mappings?from=http://www.wikidata.org/entity/Q2013)
* [mappings?to=http://d-nb.info/gnd/7527800-5](mappings?to=http://d-nb.info/gnd/7527800-5)
* [mappings?direction=both&mode=and&from=http://www.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3](mappings/?direction=both&mode=or&from=http://www.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3)
* [mappings?direction=both&mode=or&from=http://www.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3](mappings/?direction=both&mode=or&from=http://www.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3)
* [mappings?toScheme=http://bartoc.org/en/node/18785](mappings?toScheme=http://bartoc.org/en/node/18785)

### Concept Schemes

* [mappings/voc](mappings/voc)

### Suggest Search

* [suggest?search=Göttingen&language=de](suggest?search=Göttingen&language=de)

## Source Code

See <https://github.com/gbv/wikidata-jskos/>.

## License

[MIT License](https://github.com/gbv/wikidata-jskos/blob/master/LICENSE.md)

[Wikidata]: https://www.wikidata.org/
[JSKOS format]: https://gbv.github.io/jskos/jskos.html
[JSKOS Server]: https://github.com/gbv/jskos-server
