#!/bin/bash
# Shopify Performance Audit — Collect metrics for all core pages
#
# Usage:
#   ./audit-all-pages.sh <base-url> [output-dir]
#
# Example:
#   ./audit-all-pages.sh https://www.pjsalvage.com ./audit-results
#
# Prerequisites:
#   npm install playwright
#   npx playwright install chromium

set -e

BASE_URL="${1:?Usage: $0 <base-url> [output-dir]}"
OUTPUT_DIR="${2:-./audit-results}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Remove trailing slash
BASE_URL="${BASE_URL%/}"

mkdir -p "$OUTPUT_DIR"

echo "=== Shopify Performance Audit ==="
echo "Base URL: $BASE_URL"
echo "Output:   $OUTPUT_DIR"
echo ""

# Detect collection and product URLs from the site
echo "Detecting collection and product URLs..."

# Try to find a collection URL from the homepage
COLLECTION_URL="${BASE_URL}/collections/all"
PRODUCT_URL=""

# Collect metrics for each page type
PAGES=(
  "homepage|${BASE_URL}/"
  "collection|${COLLECTION_URL}"
)

# Try to find a product URL by fetching the collection page
PRODUCT_URL=$(node -e "
  const https = require('https');
  const http = require('http');
  const url = '${COLLECTION_URL}';
  const lib = url.startsWith('https') ? https : http;
  lib.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const match = data.match(/href=\"(\/products\/[^\"?]+)/);
      if (match) console.log('${BASE_URL}' + match[1]);
    });
  }).on('error', () => {});
" 2>/dev/null || echo "")

if [ -n "$PRODUCT_URL" ]; then
  PAGES+=("pdp|${PRODUCT_URL}")
fi

echo ""
echo "Pages to audit:"
for page in "${PAGES[@]}"; do
  name="${page%%|*}"
  url="${page##*|}"
  echo "  - ${name}: ${url}"
done
echo ""

# Run desktop audits
echo "=== Desktop Audits ==="
for page in "${PAGES[@]}"; do
  name="${page%%|*}"
  url="${page##*|}"
  echo "Auditing ${name} (desktop)..."
  node "$SCRIPT_DIR/collect-metrics.js" "$url" \
    --output "$OUTPUT_DIR/${name}-desktop.json" 2>&1 | grep -v "^{" || true
done

# Run mobile audits
echo ""
echo "=== Mobile Audits ==="
for page in "${PAGES[@]}"; do
  name="${page%%|*}"
  url="${page##*|}"
  echo "Auditing ${name} (mobile)..."
  node "$SCRIPT_DIR/collect-metrics.js" "$url" --mobile \
    --output "$OUTPUT_DIR/${name}-mobile.json" 2>&1 | grep -v "^{" || true
done

echo ""
echo "=== Audit Complete ==="
echo "Results saved to: $OUTPUT_DIR/"
echo ""
echo "Files generated:"
ls -la "$OUTPUT_DIR/"
