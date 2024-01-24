# [Wikidata JSKOS](https://github.com/gbv/wikidata-jskos) (Docker)

Wikidata JSKOS implements a web service to access [Wikidata] in [JSKOS] format. The data includes Wikidata items as concepts and concept schemes (read) and mappings between Wikidata and other authority files (read and write). It is part of a larger infrastructure of [Project coli-conc](https://coli-conc.gbv.de).

- See [GitHub](https://github.com/gbv/wikidata-jskos) for more information about the tool.

## Supported Architectures
Currently, only `x86-64` is supported.

## Available Tags
- The current release version is available under `latest`. However, new major versions might break compatibility of the previously used config file, therefore it is recommended to use a version tag instead.
- We follow SemVer for versioning the application. Therefore, `x` offers the latest image for the major version x, `x.y` offers the latest image for the minor version x.y, and `x.y.z` offers the image for a specific patch version x.y.z.
- Additionally, the latest development version is available under `dev`.

## Usage
It is recommended to run the image using [Docker Compose](https://docs.docker.com/compose/). Note that depending on your system, it might be necessary to use `sudo docker compose`. For older Docker versions, use `docker-compose` instead of `docker compose`.

1. Create `docker-compose.yml`:

```yml
version: "3"

services:
  wikidata-jskos:
    image: ghcr.io/gbv/wikidata-jskos
    # Can be configured via a JSON file mounted into `/config/config.json`...
    volumes:
      - ./data/config:/config
    # ... or via environment variables
    environment:
      - NODE_ENV=production
      - PORT=2013
    ports:
      - 2013:2013
    restart: unless-stopped
```

2. Create data folders:

```bash
mkdir -p ./data/config
echo "{}" > ./data/config/config.json
```

3. Start the application:

```bash
docker compose up -d
```

This will create and start a wikidata-jskos container running under host (and guest) port 2013. See [Configuration](#configuration) on how to configure it.

You can now access the application under `http://localhost:2013`.

## Application Setup
Note: After adjusting any configurations, it is required to restart or recreate the container:
- After changing configuration files, restart the container: `docker compose restart`
- After changing `docker-compose.yml` (e.g. adjusting environment variables), recreate the container: `docker compose up -d`

### Configuration
The folder `/config` (mounted as `./data/config` if configured as above) contains the configuration file `config.json` where wikidata-jskos is configured. You can also use environment variables via `environment` or `env_file` to configure wikidata-jskos. Please refer to the [main documentation](../README.md#configuration) for more information and all available options.

[Wikidata]: https://www.wikidata.org/
[JSKOS]: https://gbv.github.io/jskos/
