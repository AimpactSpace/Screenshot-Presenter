#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: scripts/set-icon-from-path.sh /absolute/path/to/icon.png" >&2
  exit 1
fi

SRC="$1"
if [ ! -f "$SRC" ]; then
  echo "File not found: $SRC" >&2
  exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
DEST_DIR="$ROOT_DIR/build"
DEST_PNG="$DEST_DIR/icon.png"

mkdir -p "$DEST_DIR"

# Convert to PNG if needed using sips (macOS)
EXT_LOWER=$(echo "${SRC##*.}" | tr '[:upper:]' '[:lower:]')
if [ "$EXT_LOWER" != "png" ]; then
  if ! command -v sips >/dev/null 2>&1; then
    echo "Non-PNG icon provided and sips is not available to convert." >&2
    exit 1
  fi
  TMP_PNG="$DEST_DIR/icon.tmp.png"
  sips -s format png "$SRC" --out "$TMP_PNG" >/dev/null
  mv "$TMP_PNG" "$DEST_PNG"
else
  cp "$SRC" "$DEST_PNG"
fi
echo "Prepared icon at $DEST_PNG"

"$ROOT_DIR"/scripts/make-icon.sh
echo "Icon installed at $DEST_DIR/icon.icns"
