---
name: shopify-performance-audit
description: >
  Comprehensive Shopify storefront performance auditing — browser metrics, third-party script
  analysis, Core Web Vitals diagnostics, and actionable optimization plans. Use this skill whenever
  the user mentions page speed, web vitals, performance issues, slow loading, LCP, FCP, CLS, TBT,
  INP, render blocking, third-party scripts, script bloat, app performance impact, Shopify speed
  score, or wants to audit/optimize a Shopify store's frontend performance. Also trigger when the
  user asks about reducing network requests, JS heap usage, DOM size, image optimization, lazy
  loading strategy, or diagnosing why a Shopify store feels slow. This skill covers both Liquid
  themes (Dawn, Impulse, custom) and Hydrogen storefronts. Even if the user just says "the site is
  slow" or "check performance" on a Shopify project, use this skill.
compatibility: Claude Code, Cursor, Codex, Windsurf
---

# Shopify Performance Audit

You are a senior web performance engineer specializing in Shopify storefronts. You conduct
systematic, evidence-based audits combining live browser metrics with codebase analysis to produce
actionable optimization plans.

## How This Skill Works

This skill runs in two phases:

1. **Discovery** — gather data from both the live site (if Chrome MCP available) and the codebase
2. **Analysis & Planning** — synthesize findings into a prioritized plan with implementation tickets

The output always includes two deliverables:
- A **client-facing audit document** (markdown, suitable for Slack/Notion/Google Docs)
- An **implementation plan** with ticketed items organized by short/medium/long term

## Contents

1. [Audit Phases](#audit-phases)
2. [Phase 1: Data Collection](#phase-1-data-collection)
3. [Phase 2: Codebase Analysis](#phase-2-codebase-analysis)
4. [Phase 3: Synthesis & Scoring](#phase-3-synthesis--scoring)
5. [Phase 4: Output Generation](#phase-4-output-generation)
6. [Shopify-Specific Best Practices](#shopify-specific-best-practices)
7. [Third-Party Script Analysis](#third-party-script-analysis)
8. [Known Offenders Database](#known-offenders-database)
9. [Output Templates](#output-templates)
10. [Cross-References](#cross-references)

---

## Pre-Flight: Environment & Dependency Detection

Before collecting any data, detect what tools and skills are available. This determines your
audit mode and which capabilities you can use.

### Step 1: Detect Browser Automation

Check in this priority order — use the first one available:

1. **Chrome MCP** — Look for `mcp__Claude_in_Chrome__*` tools. If available, this is the best
   option: real Chrome DevTools metrics, JS execution, screenshots, network interception.

2. **Claude Preview MCP** — Look for `mcp__Claude_Preview__*` tools. Good alternative for
   headless browser metrics.

3. **Playwright script** — If neither MCP is available, use the bundled Playwright collector:
   ```bash
   # One-time setup (if not already installed)
   npm install playwright && npx playwright install chromium

   # Run the collector
   node <skill-path>/scripts/collect-metrics.js <url> [--mobile] [--output results.json]

   # Or audit all core pages at once
   bash <skill-path>/scripts/audit-all-pages.sh <base-url> [output-dir]
   ```
   This gives you the same metrics as Chrome MCP but without interactive control.

4. **No browser** — If none of the above are available, fall back to codebase-only analysis.
   Explicitly tell the user: "I can't access the live site. I'll audit the theme code for known
   anti-patterns, but recommend running Lighthouse for live metrics."

### Step 2: Detect Companion Skills

This skill delegates to Shopify-specific skills for domain knowledge. Check which are available
and adapt:

| Skill | What It Provides | If Missing |
|-------|-----------------|------------|
| `shopify-liquid` | Liquid syntax validation, section schema patterns | Use built-in Liquid knowledge, skip validation |
| `shopify-dev` | Shopify platform documentation search | Use built-in Shopify knowledge |
| `theme-development` | Domaine Foundation theme patterns (Lit 3, Tailwind v4) | Skip Foundation-specific checks |
| `solutions-engineering` | LOE estimation patterns, scoping templates | Use generic estimation |

To check: look for these skills in the available skills list in the system prompt. If a skill
is listed, you can invoke it via `/skill-name` or by referencing its patterns. If not listed,
don't try to invoke it — just use the knowledge embedded in this skill.

**Suggest missing skills**: If a companion skill would be useful but isn't installed, tell the
user: "For deeper Liquid validation, consider installing the `shopify-liquid` skill."

### Step 3: Detect Codebase

Check if Shopify theme files exist in the working directory or a nearby path:
```
Glob: layout/theme.liquid
Glob: config/settings_data.json
Glob: sections/*.liquid
Glob: snippets/*.liquid
```

If found, note the theme root path. If not, ask the user if they have local codebase access.

### Audit Modes

Based on detection results:

| Mode | Browser | Codebase | What You Get |
|------|---------|----------|-------------|
| **Full audit** | Chrome MCP or Playwright | Yes | Complete audit with metrics + code fixes |
| **Live-only audit** | Chrome MCP or Playwright | No | Metrics + recommendations (no file paths) |
| **Code-only audit** | None | Yes | Anti-pattern detection (no live metrics) |
| **Minimal audit** | None | No | General Shopify perf recommendations only |

---

## Audit Phases

Run all four phases in order. Phases 1 and 2 can run in parallel when subagents are available.

---

## Phase 1: Data Collection

### 1A. Core Pages to Audit

Always audit these four page types — they represent the critical ecommerce funnel:

| Page | Why It Matters | What to Look For |
|------|---------------|-----------------|
| **Homepage** | First impression, highest traffic | Hero load time, above-fold images, third-party script impact |
| **Collection** | Browse & filter, high bounce risk | Product grid rendering, filter JS, image count, infinite scroll |
| **PDP** (Product Detail Page) | Conversion page | Gallery images, variant JS, reviews widget, BNPL widgets, add-to-cart responsiveness |
| **Cart Drawer / Cart Page** | Checkout funnel | DOM explosion on open, upsell widgets, GWP logic, AJAX vs reload patterns |

If the user specifies particular pages, audit those instead, but suggest the core four.

### 1B. Browser Metrics Collection Script

When Chrome MCP is available, execute this JavaScript on each page after waiting 5-8 seconds for
full load. Navigate to each page in a separate tab when possible for parallel collection.

```javascript
// === SHOPIFY PERFORMANCE AUDIT — METRICS COLLECTOR v1.0 ===
(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');

  // Navigation Timing
  const timing = nav ? {
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domInteractive: Math.round(nav.domInteractive),
    domComplete: Math.round(nav.domComplete),
    loadComplete: Math.round(nav.loadEventEnd),
    transferSizeKB: Math.round((nav.transferSize || 0) / 1024)
  } : {};

  // Paint Timing
  const paints = {};
  performance.getEntriesByType('paint').forEach(p => {
    paints[p.name] = Math.round(p.startTime);
  });

  // DOM Statistics
  const dom = {
    totalElements: document.querySelectorAll('*').length,
    scriptTags: document.querySelectorAll('script').length,
    stylesheetLinks: document.querySelectorAll('link[rel="stylesheet"]').length,
    inlineStyles: document.querySelectorAll('style').length,
    images: document.querySelectorAll('img').length,
    lazyImages: document.querySelectorAll('img[loading="lazy"]').length,
    eagerImages: document.querySelectorAll('img:not([loading="lazy"])').length,
    iframes: document.querySelectorAll('iframe').length,
    forms: document.querySelectorAll('form').length
  };

  // JS Heap Memory (Chrome only)
  const mem = performance.memory ? {
    usedHeapMB: Math.round(performance.memory.usedJSHeapSize / 1048576),
    totalHeapMB: Math.round(performance.memory.totalJSHeapSize / 1048576),
    heapLimitMB: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
  } : { note: 'memory API not available' };

  // Resource Breakdown by Type
  const byType = {};
  let totalTransfer = 0;
  resources.forEach(r => {
    const t = r.initiatorType || 'other';
    if (!byType[t]) byType[t] = { count: 0, sizeKB: 0, totalDurationMs: 0 };
    byType[t].count++;
    byType[t].sizeKB += Math.round((r.transferSize || 0) / 1024);
    byType[t].totalDurationMs += Math.round(r.duration || 0);
    totalTransfer += r.transferSize || 0;
  });

  // CLS (Cumulative Layout Shift)
  let cls = 0;
  try { performance.getEntriesByType('layout-shift').forEach(e => { if (!e.hadRecentInput) cls += e.value; }); } catch(e) {}

  // Third-Party Domain Analysis
  const domainCounts = {};
  const domainSizes = {};
  resources.forEach(r => {
    try {
      const h = new URL(r.name).hostname;
      if (!h.includes('shopify') && !h.includes(location.hostname.replace('www.',''))) {
        // Normalize to base domain
        const base = h.replace(/^(www|cdn|api|static|scripts|st|async-px|conf|config|app|assets|content)\./,'');
        domainCounts[base] = (domainCounts[base] || 0) + 1;
        domainSizes[base] = (domainSizes[base] || 0) + (r.transferSize || 0);
      }
    } catch(e) {}
  });
  const topDomains = Object.entries(domainCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 25)
    .map(([d,c]) => ({ domain: d, requests: c, sizeKB: Math.round((domainSizes[d]||0)/1024) }));

  // Hidden/Offscreen Elements (mobile waste)
  const hiddenImages = Array.from(document.querySelectorAll('img')).filter(img => {
    const rect = img.getBoundingClientRect();
    return rect.width === 0 || rect.height === 0 ||
           window.getComputedStyle(img).display === 'none' ||
           (img.parentElement && window.getComputedStyle(img.parentElement).display === 'none');
  }).length;

  const offscreenIframes = Array.from(document.querySelectorAll('iframe')).filter(f => {
    const rect = f.getBoundingClientRect();
    return rect.top > window.innerHeight * 2 || rect.width === 0;
  }).length;

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    url: location.href,
    timing, paints, dom, mem, byType,
    totalResources: resources.length,
    totalTransferKB: Math.round(totalTransfer / 1024),
    cls: Math.round(cls * 1000) / 1000,
    topDomains,
    hiddenImages,
    offscreenIframes,
    scriptResourceCount: resources.filter(r => r.initiatorType === 'script').length,
    fetchXhrCount: resources.filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest').length
  }, null, 2);
})()
```

### 1C. Mobile Viewport Simulation

After collecting desktop metrics, resize the browser to mobile (375x812) and reload the homepage.
Run the same metrics script. Compare:
- Hidden images count (images rendered on desktop but invisible on mobile)
- Offscreen iframe count
- Whether the same number of resources load (they shouldn't — mobile should load less)

### 1D. Cart Drawer Audit

On the PDP, click "Add to Cart" and capture:
- DOM element count before and after drawer opens (the delta reveals DOM explosion)
- Memory before and after
- Whether any upsell/cross-sell popups appear before the drawer (UX friction)
- Network requests triggered by cart open

---

## Phase 2: Codebase Analysis

Search the theme codebase for known performance anti-patterns. Use the Grep and Read tools
systematically. For Shopify-specific Liquid patterns, delegate to the `shopify-liquid` skill
if available.

### 2A. Layout File Audit (`layout/theme.liquid`)

This file is the most impactful because every page renders through it.

**Search for these patterns:**

| Pattern | Grep Command | Why It Matters |
|---------|-------------|---------------|
| Inline `<script>` in `<head>` | `<script` before `</head>` | Blocks rendering — move to footer or defer |
| Synchronous external scripts | `<script src=` without `defer` or `async` | Blocks parsing |
| `document.createElement('script')` | Pattern in inline JS | Dynamic script injection, often blocking |
| Large inline JS blocks | Inline scripts > 20 lines | Should be external and deferred |
| CSS loaded without preload | `stylesheet_tag` without `preload: true` | Delays first paint |
| Missing preconnect hints | Check for `dns-prefetch` and `preconnect` | Slow third-party connections |
| `content_for_header` placement | Where Shopify injects app scripts | Apps inject here — can't control, but note the bloat |

**Grep commands to run:**

```
# Find all external script sources in layout
Grep: pattern="<script.*src=" path="layout/"

# Find inline scripts (not just src tags)
Grep: pattern="<script>" path="layout/" (multiline)

# Find render-blocking resources
Grep: pattern="stylesheet_tag" path="layout/"

# Find preconnect/prefetch hints
Grep: pattern="preconnect|dns-prefetch|preload" path="layout/"

# Find document.createElement patterns
Grep: pattern="document\.createElement" path="layout/"
```

### 2B. Snippet & Section Audit

```
# location.reload() — full page reload anti-pattern
Grep: pattern="location\.reload" path="snippets/" AND path="sections/" AND path="assets/"

# jQuery dependency — legacy, adds ~90KB
Grep: pattern="jQuery|\\$\\(" path="snippets/"

# Synchronous XHR
Grep: pattern="XMLHttpRequest|\.open\(" path="assets/"

# Inline event handlers
Grep: pattern="onclick=|onload=|onerror=" path="snippets/" AND path="sections/"

# Image loading strategies
Grep: pattern="loading=" path="snippets/"
```

### 2C. Asset Size Analysis

Check file sizes of key assets:

```bash
# List JS files by size
find assets/ -name "*.js" -exec wc -c {} + | sort -rn | head -20

# List CSS files by size
find assets/ -name "*.css" -exec wc -c {} + | sort -rn | head -20
```

### 2D. App Block Detection

Read `config/settings_data.json` and look for enabled app blocks. Cross-reference with the
third-party domains found in Phase 1 to map apps to their network impact.

```
# Find app blocks in settings
Grep: pattern="\"type\".*\"app\"" path="config/settings_data.json"

# Find app embed blocks
Grep: pattern="disabled.*false" path="config/settings_data.json"
```

### 2E. Image Optimization Audit

```
# Check for missing lazy loading in sections
Grep: pattern="<img" path="sections/" (then check which lack loading="lazy")

# Check for srcset usage (responsive images)
Grep: pattern="srcset" path="snippets/"

# Check for image dimension attributes (prevents CLS)
Grep: pattern="width.*height" path="snippets/image"
```

---

## Phase 3: Synthesis & Scoring

After collecting data, score the store against these benchmarks:

### Performance Scoring Matrix

| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| FCP | < 1.8s | 1.8-3.0s | > 3.0s |
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| TBT | < 200ms | 200-600ms | > 600ms |
| DOM Elements | < 1,500 | 1,500-3,000 | > 3,000 |
| JS Heap | < 30MB | 30-60MB | > 60MB |
| Total Requests | < 80 | 80-150 | > 150 |
| Script Tags | < 30 | 30-60 | > 60 |
| Third-Party Domains | < 10 | 10-20 | > 20 |
| Total Transfer | < 1MB | 1-3MB | > 3MB |

### Duplicate Service Detection

Cross-reference all third-party domains against the Known Offenders Database (see
`references/known-services.md`). Flag:
- **Session recording overlap**: Hotjar + Clarity + FullStory + LogRocket (pick one)
- **Personalization overlap**: Dynamic Yield + Exponea/Bloomreach + Nosto + Klevu (pick one)
- **Pixel management overlap**: Elevar + TripleWhale + Littledata (pick one)
- **Analytics overlap**: GA4 via multiple injectors (GTM + direct + Elevar)
- **Review widget overlap**: Yotpo + Judge.me + Stamped + Loox (pick one)
- **Chat widget overlap**: Gorgias + Zendesk + Tidio + Intercom (pick one)

### Categorize All Issues

Every issue must be categorized as one of:

1. **Code Fix** — Our team can fix this directly in theme files
2. **App Configuration** — Requires changing app settings in Shopify admin
3. **Vendor Contact** — Need to reach out to the app/service vendor
4. **Business Decision** — Client needs to decide (e.g., remove an app)
5. **Architecture** — Structural change requiring planning

---

## Phase 4: Output Generation

### Output 1: Client-Facing Audit Document

Use this structure (see `references/audit-template.md` for the full template):

```markdown
# [Store Name] - Storefront Performance Audit
**Date:** [date] | **Audited by:** [team] | **Site:** [url]

## Executive Summary
[2-3 sentences: what's wrong, how bad, what the fix path looks like]

## Metrics at a Glance
[Table comparing all pages against benchmarks with color coding]

## Top External Services by Request Volume
[Table: rank, service, requests/page, purpose, verdict]

## Duplicate & Overlapping Tools
[Group by category, recommend which to keep]

## Issues We Can Fix (Code Changes)
[Table: priority, issue, impact, effort]

## Issues Requiring App/Vendor Action
[Table: priority, issue, vendor, suggested action]

## Recommended Roadmap
### Phase 1: Quick Wins (Week 1-2)
### Phase 2: Code Optimization (Week 3-4)
### Phase 3: Architecture (Month 2+)

## Decisions Needed from Client
[Numbered list of questions]

## Appendix: All External Services Detected
[Expandable full list]
```

### Output 2: Implementation Plan

Organize tickets by timeline with these fields:

```markdown
| Ticket ID | Title | Estimate | Impact | Category |
```

- **Short term (Week 1-2)**: No-risk changes — defer scripts, add lazy loading, remove duplicates
- **Medium term (Week 3-4)**: Code changes — replace patterns, split bundles, conditional loading
- **Long term (Month 2+)**: Architecture — facades, service workers, app pruning

Each ticket should be specific enough to copy directly into Linear/Jira/ClickUp:
- Exact file paths and line numbers where applicable
- The specific change to make
- Expected impact on metrics
- Risk level (low/medium/high)

---

## Shopify-Specific Best Practices

These are the patterns every Shopify theme should follow. When auditing, check each one.

### Script Loading Order (layout/theme.liquid)

The ideal loading order in a Shopify theme:

```html
<head>
  <!-- 1. Critical preconnects (only domains needed for above-fold content) -->
  <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
  <link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>

  <!-- 2. Critical CSS (preloaded) -->
  {{ 'theme.css' | asset_url | stylesheet_tag: preload: true }}

  <!-- 3. Font face declarations (with font-display: swap) -->
  {% render 'font-face' %}

  <!-- 4. Minimal critical inline JS (theme config only, < 10 lines) -->
  <script>window.theme = { routes: {{ routes | json }} };</script>

  <!-- 5. Shopify required (cannot control) -->
  {{ content_for_header }}

  <!-- 6. Theme JS (ALWAYS deferred) -->
  <script src="{{ 'vendor.js' | asset_url }}" defer></script>
  <script src="{{ 'theme.js' | asset_url }}" defer></script>
</head>
<body>
  <!-- ... page content ... -->

  <!-- 7. Non-critical third-party scripts (before </body>, deferred or async) -->
  <!-- Chat widgets, analytics, accessibility — load LAST -->
</body>
```

**Anti-patterns to flag:**
- Analytics scripts (Exponea, Hotjar, Clarity) in `<head>` instead of before `</body>`
- Any `<script src="...">` without `defer` or `async`
- Large inline `<script>` blocks (> 20 lines) in `<head>`
- `document.createElement('script')` patterns that bypass defer
- Third-party scripts loaded before `content_for_header`

### Image Optimization

```liquid
{% comment %} GOOD: Lazy loading with responsive images {% endcomment %}
{% render 'image-element',
  image: section.settings.image,
  loading: 'lazy',
  preload: false,
  sizes: '(min-width: 769px) 50vw, 100vw'
%}

{% comment %} GOOD: Eager load ONLY above-fold hero images {% endcomment %}
{% render 'image-element',
  image: section.settings.hero_image,
  loading: 'eager',
  preload: true,
  fetchpriority: 'high'
%}
```

**Rules:**
- Only the first visible image (hero/banner) should be `loading="eager"` with `fetchpriority="high"`
- All other images: `loading="lazy"`
- All images need `width` and `height` attributes (prevents CLS)
- Use Shopify's `image_url` filter with size parameters, never raw URLs
- Use `srcset` for responsive images

### Section Rendering Performance

```liquid
{% comment %} GOOD: Conditional rendering prevents unnecessary DOM {% endcomment %}
{%- if section.settings.show_section -%}
  {% render 'heavy-component' %}
{%- endif -%}

{% comment %} BAD: Hidden with CSS but still in DOM {% endcomment %}
<div style="display: none">
  {% render 'heavy-component' %}
</div>
```

### Cart Operations

```javascript
// GOOD: AJAX cart update without page reload
async function updateCart(data) {
  const response = await fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const cart = await response.json();
  document.dispatchEvent(new CustomEvent('cart:build', { detail: { cart } }));
}

// BAD: Full page reload after cart update
jQuery.post('/cart/add.js', data).done(function() {
  location.reload(); // Destroys performance — reloads ALL scripts
});
```

### App Block Impact Awareness

Every Shopify app installed adds scripts via `content_for_header`. You can't control this
injection point, but you can:
- Audit which apps are installed vs. actually used
- Identify apps that inject multiple scripts (some inject 3-5 separate files)
- Recommend removing unused apps (each removal = fewer injected scripts)
- Use Shopify's built-in "App embeds" toggle to disable per-app without uninstalling

---

## Third-Party Script Analysis

### Methodology

For each external domain detected:

1. **Identify the service** — match domain against Known Offenders Database
2. **Count requests** — how many network requests does this service make?
3. **Measure size** — total transfer size from this domain
4. **Assess necessity** — is this service essential for the store's business?
5. **Check for overlap** — does another installed service do the same thing?
6. **Rate impact** — low (<3 requests), medium (3-10), high (10-30), critical (30+)

### Common Shopify Third-Party Services

See `references/known-services.md` for the comprehensive database. Key categories:

- **Analytics & Tracking**: GA4, GTM, Hotjar, Clarity, FullStory, Heap
- **Personalization**: Dynamic Yield, Exponea/Bloomreach, Nosto, Klevu
- **Conversion Tracking**: Elevar, TripleWhale, Littledata
- **Marketing Pixels**: Facebook, Pinterest, TikTok, Google Ads, Snapchat
- **Reviews**: Yotpo, Judge.me, Stamped, Loox, Okendo
- **Chat**: Gorgias, Zendesk, Tidio, Intercom, Gladly
- **Accessibility**: UserWay, accessiBe, AudioEye
- **BNPL**: Klarna, Afterpay/Clearpay, Affirm, Sezzle
- **Returns**: Narvar, Loop, Returnly, AfterShip
- **Email/SMS**: Klaviyo, Attentive, Postscript, Omnisend
- **Search**: Boost Commerce, Searchspring, Algolia, Klevu
- **Loyalty**: Yotpo Loyalty, Smile.io, LoyaltyLion, Stamped
- **Consent**: Consentmo, CookieYes, OneTrust, Termly

---

## Known Offenders Database

See `references/known-services.md` for the full database of third-party services with:
- Domain patterns for identification
- Typical request counts per page
- Whether they can be deferred/lazy-loaded
- Common misconfigurations
- Recommended loading strategies

---

## Cross-References

This skill works alongside other Domaine and Shopify skills:

- **`shopify-liquid`** — For Liquid syntax, section schemas, and Online Store 2.0 patterns.
  Delegate to this skill when you need to write or validate Liquid code.
- **`theme-development`** — For Domaine Foundation theme architecture (Lit 3, Tailwind v4, Vite).
  Use when the project is a Foundation theme.
- **`shopify-dev`** — For general Shopify developer documentation search.
  Use when you need to look up Shopify API behavior or platform capabilities.
- **`solutions-engineering`** — For scoping and estimation patterns.
  Use when structuring the implementation plan and LOE estimates.
