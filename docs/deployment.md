# Deployment

## Options

Deploy with one of these paths:

- Docker Compose with Traefik and HTTPS: `docker/docker-compose.yaml`.
- Docker Compose without HTTPS: `docker/docker-compose.simple.yaml`.
- Release bundle from `make build`.

The compose files use the GHCR image `ghcr.io/dnaroma/factorio-server-manager:latest`.

## Docker Compose

Copy the compose file to the host:

```sh
cp docker/docker-compose.yaml /path/to/server/
```

For local or private-network use without HTTPS:

```sh
cp docker/docker-compose.simple.yaml /path/to/server/
```

Set environment values:

- `FACTORIO_VERSION`: `stable`, `latest`, or a specific Factorio version.
- `RCON_PASS`: optional RCON password. If empty, one is generated.
- `FSM_ADMIN_USERNAME`: initial web admin username. Defaults to `admin`.
- `FSM_ADMIN_PASSWORD`: initial web admin password. If empty, one is generated.
- `DOMAIN_NAME`: required by the Traefik compose file.
- `EMAIL_ADDRESS`: required by Let's Encrypt in the Traefik compose file.

Start:

```sh
docker compose up -d
```

Simple mode:

```sh
docker compose -f docker-compose.simple.yaml up -d
```

## Persistent Data

The compose files mount:

- `./fsm-data` to `/opt/fsm-data`
- `./factorio-data/saves` to `/opt/factorio/saves`
- `./factorio-data/mods` to `/opt/factorio/mods`
- `./factorio-data/config` to `/opt/factorio/config`
- `./factorio-data/mod_packs` to `/opt/fsm/mod_packs`

Back up these directories before upgrades.

## Ports

- Manager UI: TCP `80`, or TCP `443` with Traefik.
- Factorio game server: UDP `34197`.

## First Start

The container downloads the Factorio headless server before the UI becomes available.

If `RCON_PASS` is empty, check the generated value in:

```text
fsm-data/conf.json
```

`FSM_ADMIN_USERNAME` and `FSM_ADMIN_PASSWORD` are used only when the user database is empty. They do not reset existing users after `fsm-data/sqlite.db` exists.

If no admin password was configured, check container logs:

```sh
docker logs factorio-server-manager
```

## Updating Factorio

1. Save the game in the UI.
2. Stop the Factorio server in the UI.
3. Update `FACTORIO_VERSION` if needed.
4. Restart the container:

```sh
docker compose restart
```

## Release Bundle

Build a release bundle:

```sh
make build
```

The output zip is written under `build/`. It contains the backend binary, generated frontend assets, and a starter `conf.json`.

## Release Automation

Publishing a GitHub release triggers `.github/workflows/create-release-workflow.yml`, which:

- builds the Linux release zip,
- uploads them to the GitHub release,
- builds and pushes GHCR Docker images with `GITHUB_TOKEN`.
