# Shopify Performance Audit Skill

A comprehensive Shopify storefront performance auditing skill for Claude Code, Cursor, Codex, and Windsurf. Conducts systematic, evidence-based audits combining live browser metrics with codebase analysis to produce actionable optimization plans.

## What It Does

- **Browser-based metrics collection** — Navigation Timing, Resource Timing, Paint Timing, JS Heap, DOM stats, CLS, layout shifts
- **Third-party script analysis** — Identifies all external domains, request counts, duplicate/overlapping services
- **Shopify-specific best practices** — Script loading order, defer/async patterns, image optimization, section rendering
- **Code-level issue detection** — `location.reload()` patterns, jQuery dependencies, inline scripts, DOM explosion
- **Mobile-specific auditing** — Hidden images, offscreen iframes, viewport simulation
- **Actionable output** — Client-facing audit document + implementation tickets (short/medium/long term)

## Installation

### Via npx skills (recommended)
```bash
npx skills add devil1991/shopify-performance-audit-skill
```

### Via curl installer
```bash
curl -s https://raw.githubusercontent.com/devil1991/shopify-performance-audit-skill/main/install.sh | bash
```

### Manual Installation
```bash
# Clone the repo
git clone git@github.com:devil1991/shopify-performance-audit-skill.git

# Create skill directory
mkdir -p ~/.agents/skills/shopify-performance-audit

# Copy files
cp -r shopify-performance-audit-skill/* ~/.agents/skills/shopify-performance-audit/

# Create symlink for Claude Code
ln -sf ../../.agents/skills/shopify-performance-audit ~/.claude/skills/shopify-performance-audit
```

### Optional: Playwright for headless auditing
```bash
npm install playwright
npx playwright install chromium
```

## Usage

In Claude Code, Cursor, or Codex, just ask:

```
"Run a performance audit on our Shopify store"
"The site is slow, check web vitals"
"Audit page speed on pjsalvage.com"
"Check third-party scripts and performance blockers"
```

The skill auto-detects available tools:
1. **Chrome MCP** (best) — Real browser metrics via Chrome extension
2. **Playwright** (fallback) — Headless browser metrics via bundled script
3. **Code-only** (minimal) — Theme file anti-pattern detection

## Companion Skills

This skill works best alongside:
- `shopify-liquid` — Liquid syntax validation and patterns
- `shopify-dev` — Shopify developer documentation
- `theme-development` — Domaine Foundation theme framework
- `solutions-engineering` — LOE estimation and scoping

## Output

The skill produces two documents:

1. **Client-facing audit** — Markdown document with executive summary, metrics tables, duplicate tool analysis, roadmap
2. **Implementation plan** — Ticketed items with file paths, effort estimates, impact ratings

## Standalone Scripts

You can also run the metrics collector independently:

```bash
# Single page
node scripts/collect-metrics.js https://www.example.com --output results.json

# Mobile viewport
node scripts/collect-metrics.js https://www.example.com --mobile --output results-mobile.json

# All core pages
bash scripts/audit-all-pages.sh https://www.example.com ./audit-results
```

## License

MIT
