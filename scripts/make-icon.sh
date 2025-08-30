#!/usr/bin/env bash
set -euo pipefail

# Generate a macOS .icns from a 1024x1024 PNG using system tools (sips, iconutil)
# Usage: npm run make:icon  (expects build/icon.png)

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
SRC_PNG="$ROOT_DIR/build/icon.png"
ICONSET_DIR="$ROOT_DIR/build/AppIcon.iconset"
OUT_ICNS="$ROOT_DIR/build/icon.icns"

if ! command -v sips >/dev/null 2>&1 || ! command -v iconutil >/dev/null 2>&1; then
  echo "This script requires macOS tools: sips and iconutil." >&2
  exit 1
fi

if [ ! -f "$SRC_PNG" ]; then
  echo "Missing $SRC_PNG. Please place a 1024x1024 PNG there and re-run." >&2
  exit 1
fi

rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# Generate all required sizes
for size in 16 32 64 128 256 512 1024; do
  sips -z $size $size "$SRC_PNG" --out "$ICONSET_DIR/icon_${size}x${size}.png" >/dev/null
done

# Additional @2x variants
cp "$ICONSET_DIR/icon_32x32.png"  "$ICONSET_DIR/icon_16x16@2x.png"
cp "$ICONSET_DIR/icon_64x64.png"  "$ICONSET_DIR/icon_32x32@2x.png"
cp "$ICONSET_DIR/icon_256x256.png" "$ICONSET_DIR/icon_128x128@2x.png"
cp "$ICONSET_DIR/icon_512x512.png" "$ICONSET_DIR/icon_256x256@2x.png"
cp "$ICONSET_DIR/icon_1024x1024.png" "$ICONSET_DIR/icon_512x512@2x.png"

iconutil -c icns "$ICONSET_DIR" -o "$OUT_ICNS"
echo "Created $OUT_ICNS"

