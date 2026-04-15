# ShopifyQL Queries for Real-User Performance Data

Reference queries to pull Chrome CrUX field data via Shopify Analytics.

**Where to run:** Shopify Admin → Analytics → Reports → Custom Report (or the ShopifyQL editor)
**Dataset:** `web_performance`
**Default window:** Last 30 days (adjust `-30d` as needed)

## Field Naming Quirk

Most metrics use `<metric>_p75_ms` suffix pattern:
- `lcp_p75_ms`
- `inp_p75_ms`
- `fcp_p75_ms`
- `ttfb_p75_ms`

CLS uses the `p75_<metric>` prefix pattern (since it's a score, not milliseconds):
- `p75_cls`

If a field name errors ("unknown field"), try the inverse pattern. In the Shopify query editor,
typing `FROM web_performance` + autocomplete lists all available fields for that store.

## Distribution Arrays

Distribution fields return arrays in this shape:
```
[total_sessions, good_sessions, ni_sessions, poor_sessions]
```

## Thresholds (CWV Standard)

| Metric | 🟢 Good | 🟡 Needs Improvement | 🔴 Poor |
|--------|---------|---------------------|---------|
| LCP | ≤ 2,500ms | 2,500-4,000ms | > 4,000ms |
| INP | ≤ 200ms | 200-500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1-0.25 | > 0.25 |
| FCP | ≤ 1,800ms | 1,800-3,000ms | > 3,000ms |
| TTFB | ≤ 800ms | 800-1,800ms | > 1,800ms |

---

## The 9 Queries

### Query 1 — LCP p75 Daily Trend

```shopifyql
FROM web_performance
SHOW lcp_p75_ms, lcp_distribution
GROUP BY day
TIMESERIES day
WITH TOTALS
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY day ASC
LIMIT 1000
VISUALIZE lcp_p75_ms TYPE line
```

### Query 2 — INP p75 Daily Trend

```shopifyql
FROM web_performance
SHOW inp_p75_ms, inp_distribution
GROUP BY day
TIMESERIES day
WITH TOTALS
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY day ASC
LIMIT 1000
VISUALIZE inp_p75_ms TYPE line
```

### Query 3 — CLS p75 Daily Trend

```shopifyql
FROM web_performance
SHOW p75_cls, cls_distribution
GROUP BY day
TIMESERIES day
WITH TOTALS
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY day ASC
LIMIT 1000
VISUALIZE p75_cls TYPE line
```

### Query 4 — FCP p75 Daily Trend

```shopifyql
FROM web_performance
SHOW fcp_p75_ms, fcp_distribution
GROUP BY day
TIMESERIES day
WITH TOTALS
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY day ASC
LIMIT 1000
VISUALIZE fcp_p75_ms TYPE line
```

### Query 5 — TTFB p75 Daily Trend

```shopifyql
FROM web_performance
SHOW ttfb_p75_ms, ttfb_distribution
GROUP BY day
TIMESERIES day
WITH TOTALS
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY day ASC
LIMIT 1000
VISUALIZE ttfb_p75_ms TYPE line
```

### Query 6 — All CWVs by Page Type

Shows which templates are worst. Start here when triaging.

```shopifyql
FROM web_performance
SHOW lcp_p75_ms, inp_p75_ms, p75_cls, fcp_p75_ms, ttfb_p75_ms
GROUP BY page_type
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY lcp_p75_ms DESC
LIMIT 50
```

If `page_type` errors, try `template` or `page_template`.

### Query 7 — All CWVs by Device

Mobile CWV typically 2-3x worse than desktop. Exception: CLS is often worse on desktop
(wide-viewport banners, late-inserted elements).

```shopifyql
FROM web_performance
SHOW lcp_p75_ms, inp_p75_ms, p75_cls, fcp_p75_ms, ttfb_p75_ms
GROUP BY device_type
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
LIMIT 10
```

If `device_type` errors, try `device` or `form_factor`.

### Query 8 — Page × Device Cross-Tab

**Most diagnostic single view.** Reveals exactly which template + device combo to prioritize.

```shopifyql
FROM web_performance
SHOW lcp_p75_ms, inp_p75_ms, p75_cls, fcp_p75_ms
GROUP BY page_type, device_type
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
ORDER BY lcp_p75_ms DESC
LIMIT 100
```

### Query 9 — Distribution Buckets

Percent of sessions in each rating bucket. More actionable than p75 alone — a page with
p75=2,800ms but 80% good + 5% poor is healthier than a page with p75=2,400ms and 15% poor.

```shopifyql
FROM web_performance
SHOW lcp_distribution, inp_distribution, cls_distribution
GROUP BY page_type, device_type
SINCE startOfDay(-30d) UNTIL endOfDay(-1d)
LIMIT 100
```

---

## Export & Handoff Instructions

Present this list to the user:

1. Go to Shopify Admin → Analytics → Reports → Custom Report
2. Paste each query into the ShopifyQL editor
3. Click **Export → CSV** for each result
4. Share all 9 CSVs back

Once CSVs are in hand:
- Replace lab FCP/LCP values with real-user p75
- Build a "Page × Device Hit List" sorted by poor session count
- Calibrate optimization priorities against impact (sessions × poor %)

## Fallback: PageSpeed Insights API (No Admin Access)

If the user can't run ShopifyQL queries (no admin / analytics disabled / not enough traffic):

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&strategy=mobile&category=performance" \
  | jq '.loadingExperience.metrics'
```

Returns per-URL Chrome CrUX data:
- `LARGEST_CONTENTFUL_PAINT_MS`
- `INTERACTION_TO_NEXT_PAINT`
- `CUMULATIVE_LAYOUT_SHIFT_SCORE`
- `FIRST_CONTENTFUL_PAINT_MS`
- `EXPERIMENTAL_TIME_TO_FIRST_BYTE`

Each has `percentile` (p75) and `category` (FAST/AVERAGE/SLOW). Less granular than ShopifyQL
(no page_type or device breakdown) but works without admin access.

## Re-Audit After Fixes

CrUX aggregation window is 28 days. After deploying a fix, field data takes **7-14 days** to
shift noticeably. Re-run Queries 6, 8, 9 weekly and compare:
- p75 deltas (has the line dropped?)
- Distribution shifts (are poor sessions moving into NI/good?)
- Session volume (did traffic change, affecting denominator?)
