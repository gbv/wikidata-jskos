# Wikidata JSKOS Service

This web service provides access to content from [Wikidata] in [JSKOS format]. The API is aligned with [JSKOS Server] and may later be specified as "JSKOS API".

## Examples

### Concepts

* [data?uri=http://www.wikidata.org/entity/Q42](data/?uri=http://www.wikidata.org/entity/Q42)

### Mapping Schemes

* [voc](voc)

### Mappings

* [?from=http://www.wikidata.org/entity/Q2013](mappings?from=http://www.wikidata.org/entity/Q2013)
* [?to=http://d-nb.info/gnd/7527800-5](mappings?to=http://d-nb.info/gnd/7527800-5)
* [?direction=both&mode=and&from=http://Fwww.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3](mappings/?direction=both&mode=or&from=http://www.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3)
* [?direction=both&mode=or&from=http://Fwww.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3](mappings/?direction=both&mode=or&from=http://www.wikidata.org/entity/Q42395&to=http://d-nb.info/gnd/4074195-3)

## Source Code

See <https://github.com/gbv/wikidata-jskos/>.

## License

[MIT License](https://github.com/gbv/wikidata-jskos/blob/master/LICENSE.md)

[Wikidata]: https://www.wikidata.org/
[JSKOS format]: https://gbv.github.io/jskos/jskos.html
[JSKOS Server]: https://github.com/gbv/jskos-server
