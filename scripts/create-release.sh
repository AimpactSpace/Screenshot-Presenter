#!/usr/bin/env bash
set -euo pipefail

# Draft a GitHub Release and upload the latest DMG from dist/
# Requirements: env var GITHUB_TOKEN with repo access.

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN not set. Please export a GitHub token with repo scope." >&2
  exit 1
fi

REMOTE_URL=$(git remote get-url origin)
if [[ "$REMOTE_URL" =~ github.com[:/](.+)/(.+)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]%.git}"
else
  echo "Could not parse GitHub owner/repo from origin remote: $REMOTE_URL" >&2
  exit 1
fi

# Determine version from package.json
VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

# Ensure there is a DMG
if ! ls dist/*.dmg >/dev/null 2>&1; then
  echo "No DMG found in dist/. Build the app first (npm run build:mac)." >&2
  exit 1
fi
DMG=$(ls -t dist/*.dmg | head -n1)

# Ensure tag exists and is pushed
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  git tag -a "$TAG" -m "Release $TAG"
fi
git push -u origin "$TAG"

API="https://api.github.com/repos/$OWNER/$REPO"

# Create a draft release
echo "Creating draft release $TAG on $OWNER/$REPO"
CREATE_RESP=$(curl -sS -X POST "$API/releases" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d @- <<JSON
{
  "tag_name": "$TAG",
  "name": "$TAG",
  "draft": true,
  "prerelease": false,
  "generate_release_notes": true
}
JSON
)

# Extract upload_url and id
UPLOAD_URL=$(printf '%s' "$CREATE_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{let j=JSON.parse(d);process.stdout.write((j.upload_url||'').split('{')[0]);}catch(e){}})")
RELEASE_HTML_URL=$(printf '%s' "$CREATE_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{let j=JSON.parse(d);process.stdout.write(j.html_url||'');}catch(e){}})")

if [ -z "$UPLOAD_URL" ]; then
  echo "Failed to create release or parse upload_url. Response:" >&2
  echo "$CREATE_RESP" >&2
  exit 1
fi

ASSET_NAME=$(basename "$DMG")
echo "Uploading asset $ASSET_NAME"
curl -sS -X POST "$UPLOAD_URL?name=$(python -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$ASSET_NAME")" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"$DMG" >/dev/null

echo "Draft release created: ${RELEASE_HTML_URL:-https://github.com/$OWNER/$REPO/releases}"

