#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
go_image="${GO_TEST_IMAGE:-golang:1.26.4}"
mod_cache_volume="${GO_MOD_CACHE_VOLUME:-fsm-go-mod-cache}"
build_cache_volume="${GO_BUILD_CACHE_VOLUME:-fsm-go-build-cache}"

if [ "$#" -eq 0 ]; then
  set -- ./... -v -test.short
fi

docker volume create "${mod_cache_volume}" >/dev/null
docker volume create "${build_cache_volume}" >/dev/null

docker run --rm \
  --platform linux/amd64 \
  -v "${mod_cache_volume}:/go/pkg/mod" \
  -v "${build_cache_volume}:/root/.cache/go-build" \
  -v "${repo_root}:/workspace" \
  -w /workspace/src \
  -e FSM_MODPACK_DIR=../dev_pack \
  -e FSM_DIR=../ \
  -e FSM_CONF=../../conf.json.example \
  -e FACTORIO_USERNAME="${FACTORIO_USERNAME:-}" \
  -e FACTORIO_PASSWORD="${FACTORIO_PASSWORD:-}" \
  "${go_image}" \
  sh -lc 'export PATH="/usr/local/go/bin:${PATH}" && go env -w GOMODCACHE=/go/pkg/mod GOCACHE=/root/.cache/go-build >/dev/null && go mod download && go test "$@"' \
  sh "$@"
