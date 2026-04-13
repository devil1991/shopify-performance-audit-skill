#!/bin/bash
# Shopify Performance Audit Skill Installer
# Usage: curl -s https://raw.githubusercontent.com/meetdomaine/shopify-performance-audit-skill/main/install.sh | bash

set -e

SKILL_NAME="shopify-performance-audit"
SKILL_DIR="$HOME/.agents/skills/$SKILL_NAME"
SYMLINK_DIR="$HOME/.claude/skills"
REPO_URL="https://github.com/meetdomaine/shopify-performance-audit-skill.git"
TMP_DIR=$(mktemp -d)

echo "=== Installing Shopify Performance Audit Skill ==="
echo ""

# Clone repo
echo "Downloading skill..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>/dev/null || {
  echo "Error: Could not clone repository. Check the URL and your network connection."
  rm -rf "$TMP_DIR"
  exit 1
}

# Create directories
mkdir -p "$SKILL_DIR"
mkdir -p "$SYMLINK_DIR"

# Copy skill files (exclude repo-specific files)
echo "Installing to $SKILL_DIR..."
cp -r "$TMP_DIR/SKILL.md" "$SKILL_DIR/"
cp -r "$TMP_DIR/scripts" "$SKILL_DIR/" 2>/dev/null || true
cp -r "$TMP_DIR/references" "$SKILL_DIR/" 2>/dev/null || true
cp -r "$TMP_DIR/assets" "$SKILL_DIR/" 2>/dev/null || true

# Make scripts executable
chmod +x "$SKILL_DIR/scripts/"*.sh 2>/dev/null || true

# Create symlink for Claude Code
if [ -d "$SYMLINK_DIR" ]; then
  ln -sf "../../.agents/skills/$SKILL_NAME" "$SYMLINK_DIR/$SKILL_NAME"
  echo "Symlink created at $SYMLINK_DIR/$SKILL_NAME"
fi

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Skill installed to: $SKILL_DIR"
echo ""
echo "Optional: Install Playwright for headless browser auditing:"
echo "  npm install playwright && npx playwright install chromium"
echo ""
echo "Usage in Claude Code:"
echo '  "Run a performance audit on our Shopify store"'
echo '  "Check web vitals and third-party scripts"'
echo ""
