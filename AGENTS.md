# Agent Instructions

## Project Overview
- Factorio Server Manager is a Go backend with a React/Webpack frontend.
- Backend code lives in `src/`; the Go module root is `src/go.mod`.
- Frontend source lives in `ui/`; built assets are emitted into `app/`.
- Docker and release packaging live under `docker/` and the root `Makefile`.

## Common Commands
- Install frontend dependencies: `npm install`
- Build frontend assets: `make app/bundle` or `npm run build`
- Run backend tests: `cd src && go test ./... -v -test.short`
- Run full backend tests when Factorio credentials are available: `cd src && go test ./... -v`
- Build release bundle: `make build`
- Clean generated artifacts: `make clean`

## Working Rules
- Keep changes focused and avoid unrelated refactors.
- Use `gofmt` for Go files before committing.
- Do not edit generated frontend assets in `app/`; edit `ui/` and rebuild.
- Do not commit local runtime files such as `conf.json`, `.env`, `dev/`, `dev_packs/`, `build/`, `node_modules/`, or generated bundles.
- Preserve existing API routes and authentication behavior unless the task explicitly changes them.
- Prefer short Go tests near the changed package; UI has no configured test runner.

## Project Conventions
- Backend packages:
  - `api`: HTTP routes, handlers, auth, websocket setup.
  - `factorio`: Factorio server, saves, mods, config, RCON, and portal logic.
  - `bootstrap`: startup configuration and initial users.
  - `lockfile`: lockfile helper.
- Frontend conventions:
  - React components use `.jsx` under `ui/App/`.
  - API clients live under `ui/api/`.
  - Styling starts at `ui/index.scss` with Tailwind configured in `tailwind.config.js`.
- Existing CI validates `make app/bundle` and `cd src && go test ./... -v -test.short`.

## Commit Messages
- Prefer conventional commits, for example `fix: handle missing save name` or `docs: add agent instructions`.
