# Output Doc Structure — Parent/Child Hierarchy

Ready-to-paste templates for structuring audit output docs. Works for ClickUp, Notion, Google
Docs, or any multi-page doc format. Covered here: ClickUp specifics (page hierarchy via
`parent_page_id`), Notion (sub-pages), Google Docs (H1 section dividers + linked TOC).

## Why Hierarchy Matters

Flat audit docs with 10+ root pages bury findings. Readers scroll past data looking for
recommendations and vice versa. Hierarchical structure:

1. Forces separation of **raw findings** from **action items**
2. Gives readers a collapsible TOC they can scan
3. Lets the team link to the exact page for a specific conversation (e.g. "see CLS distribution
   for Collection desktop")
4. Keeps the Executive Summary scannable as the landing page

## Target Structure

```
📊 Executive Summary  (root — 1-page landing)
📈 Metrics & Data  (parent, is an index page)
    🧪 Lab Metrics (Chrome/Playwright)
    📈 Real-User CWVs (30-Day)
    🎯 Page × Device Hit List
    📊 Distribution Buckets
    🔌 Third-Party Services
    📦 Weight/Bandwidth Analysis
    📎 Appendix: ShopifyQL Queries
🛠️ Implementation & Fixes  (parent, is an index page)
    🚨 Critical Issues (Revised w/ Field Data)
    🗺️ Implementation Roadmap
    ❓ Decisions & Verification
```

## Rules

1. **Executive Summary stays at root.** Cross-cutting, lands first.
2. **Metrics & Data = raw findings only.** Lab captures, field data, source queries, distribution
   tables. No recommendations.
3. **Implementation & Fixes = action items only.** Issues, tickets, roadmap, decisions, QA
   checklist. No raw data dumps — reference Metrics pages instead.
4. **Each parent is an index page**, not just a heading. 1-sentence section purpose + table of
   children with descriptions.
5. **Source queries live next to their data.** Reader can re-run independently.

---

## 📈 Metrics & Data — Parent Index Template

```markdown
All raw findings, source queries, real-user CrUX data, lab captures, and distributions used to
diagnose <store> performance. No recommendations here — head to **🛠️ Implementation & Fixes**
for action items.

---

## 📂 Index

| Page | What it covers | Answers |
|------|---------------|---------|
| 🧪 Lab Metrics (Chrome/Playwright) | Headless browser captures per page type — DOM size, script count, images, requests, transfer | What does the page look like technically on first paint? |
| 📈 Real-User CWVs (30-Day) | 30-day p75 LCP/INP/CLS/FCP/TTFB site-wide + by page type + by device. Daily raw tables. | How do real users experience the site? |
| 🎯 Page × Device Hit List | Cross-tab of every page_type × device_type ranked by LCP. Impact-ranked hit list. | Where do the fires burn hottest? |
| 📊 Distribution Buckets | % of sessions in Good / NI / Poor per page × device for LCP, INP, CLS | How many users suffer, not just p75? |
| 🔌 Third-Party Services | Inventory of external domains with request counts + verdicts | Which vendors inflate page weight? |
| 📦 Weight/Bandwidth Analysis | Deep-dive on heavy templates (usually PDP — large image counts, inline styles) | Why is this page heavy? |
| 📎 Appendix: ShopifyQL Queries | All 9 queries used to pull field data, with thresholds + field-name quirks | How is this data collected? Can we re-run it? |

---

## 🧭 How to read this section

1. Start with **Real-User CWVs** — ground truth for CWV scoring
2. Jump to **Page × Device Hit List** — ranked by sessions × poor %
3. Pull supporting detail from **Distribution Buckets** and **Lab Metrics**
4. **Third-Party Services** + **Weight/Bandwidth Analysis** explain specific weight problems
5. **Appendix** has queries if you want to re-run or extend

---

## 📊 Data Sources

| Source | Window | Used for |
|--------|--------|----------|
| Shopify Analytics `web_performance` dataset | Last 30 days | Field CrUX data (p75 + distributions) |
| Chrome MCP (real browser) | Single capture | Lab measurements |
| Playwright (headless) | Single capture | Cross-check + screenshots |
```

---

## 🛠️ Implementation & Fixes — Parent Index Template

```markdown
Action items, roadmap, and open questions. Raw data lives in **📈 Metrics & Data**.

---

## 📂 Index

| Page | What it covers | Answers |
|------|---------------|---------|
| 🚨 Critical Issues (Revised) | P0/P1/P2 problems ranked by field-data impact with specific fix recommendations per issue | What's broken and how do we fix each one? |
| 🗺️ Implementation Roadmap | Ticketed work plan Short/Medium/Long term, grouped by code fixes vs config vs vendor actions | What ships in Week 1-2, Week 3-4, Month 2+? |
| ❓ Decisions & Verification | Open questions for the client + QA checklist + verification plan after each phase | What do we need from the client? How do we validate fixes? |

---

## 🧭 How to use this section

1. Start with **Critical Issues** — aligned with priorities
2. Pick tickets from **Roadmap** for the current sprint
3. Route **Decisions** items to client before starting P0 work
4. After each deploy, run the **Verification** checklist + re-query Shopify Analytics (7-14d CrUX lag)

---

## 🎯 Top Priorities (Summary — hydrate with actual data)

| # | Issue | Category | Effort |
|---|-------|----------|--------|
| 1 | <top field-data issue> | Code Fix / Config / Vendor | Low/Med/High |
```

---

## Platform-Specific Notes

### ClickUp

Tool: `mcp__*__clickup_create_document_page` with `parent_page_id` parameter.

1. Create parent page first (no `parent_page_id`). Capture returned `page_id`.
2. Create each child with `parent_page_id` = parent's ID.
3. **Reparenting is NOT supported** via `clickup_update_document_page` — hierarchy must be
   correct on create, or recreate under a new parent.

Handoff URL format: `https://app.clickup.com/<workspace>/docs/<document_id>`

### Notion

Use sub-pages. Inside parent page, type `/page` then name the child — each child is nested.
Works the same way for link aggregation. Share the parent page URL; nested pages inherit access.

### Google Docs

Google Docs doesn't have native sub-pages. Simulate hierarchy with:
1. Clear H1 dividers for each top-level section
2. A linked Table of Contents at the top (Insert → Table of contents)
3. Headings H2/H3 inside each section for sub-parts

For large audits, consider splitting into multiple Docs in a shared Drive folder — treat the
folder as the "doc" and each file as a "page".

### Confluence / Jira

Confluence supports true page hierarchy via "child pages". Create parents first, then children
with the parent set. Same index-table pattern applies.

---

## Anti-Patterns to Avoid

- ❌ **Mixing metrics and recommendations in the same page.** Reader can't tell what's a finding
  vs what's an action item.
- ❌ **Index with only bullet point links, no descriptions.** Reader must open each page to know
  what it contains. Always include 1-2 line description + "what question it answers".
- ❌ **Source queries buried in an appendix only.** Paste the query above the table it produced
  so the reader sees provenance inline.
- ❌ **Flat 10-page structure.** Use hierarchy. Always.
- ❌ **Executive Summary that just repeats page titles.** It should state (a) what's wrong,
  (b) how bad, (c) top 3 priorities, (d) fix path.
