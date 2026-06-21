# Maintenance

## Regular Checks

- Keep `.mise.toml`, `package.json`, `pnpm-lock.yaml`, `src/go.mod`, and CI workflow versions aligned.
- Run `mise install` after tool version changes.
- Run `CI=true mise exec -- pnpm install` after frontend dependency changes.
- Run `cd src && mise exec -- go mod tidy` after Go dependency changes.
- Review generated changes before committing. Do not commit `node_modules/`, `build/`, `dev/`, `dev_packs/`, `conf.json`, or local `.env` files.

## Test Matrix

CI runs:

- `make app/bundle` on Ubuntu and Windows.
- `go test ./... -v -test.short` on Ubuntu and Windows when Factorio credentials are not configured.
- Full Go tests when `FACTORIO_USERNAME` and `FACTORIO_PASSWORD` secrets are available.

Run short Go tests in Linux when possible because process health code is platform-specific.

## Configuration Files

`conf.json.example` is both documentation and a test fixture. Treat changes to it as compatibility changes.

On startup, the backend may update the active config file by:

- generating `cookie_encryption_key`,
- generating `rcon_pass`,
- migrating legacy LevelDB user storage to SQLite.

Avoid committing generated secrets or runtime database files.

## Dependency Updates

Frontend:

```sh
CI=true mise exec -- pnpm install
mise exec -- pnpm run build
```

Backend:

```sh
cd src
mise exec -- go mod tidy
mise exec -- go test ./... -v -test.short
```

## Release Notes

When user-facing behavior changes, update `CHANGELOG.md` with a short human-readable entry.

Prefer conventional commit messages, for example:

```text
fix: handle missing save name
docs: add deployment guide
```

## Known Operational Risks

- The Docker entrypoint downloads Factorio on each container start.
- The manager UI should be protected by HTTPS, VPN, or an internal network.
- RCON and cookie secrets are generated when omitted; keep the resulting config file persistent.
- Some API operations require the Factorio server to be stopped.
