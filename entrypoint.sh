#!/bin/sh
set -e
for f in /app/Data.seed/*.json; do
  fname=$(basename "$f")
  dest="/app/Data/$fname"
  if [ ! -f "$dest" ]; then
    echo "[init] Seeding $dest"
    cp "$f" "$dest"
  fi
done
exec dotnet WorldCup.Api.dll "$@"
