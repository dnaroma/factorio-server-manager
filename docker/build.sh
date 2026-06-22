#!/bin/bash
set -eou pipefail

artifact="factorio-server-manager-linux.zip"

cleanup() {
  rm -f "${artifact}"
}
trap cleanup EXIT

(
  cd ..
  make "build/${artifact}"
  cp "build/${artifact}" "docker/${artifact}"
)
docker build --platform linux/amd64 -f Dockerfile-local -t factorio-server-manager:dev .
