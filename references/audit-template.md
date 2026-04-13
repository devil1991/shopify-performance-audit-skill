# Performance Audit Output Template

Use this template verbatim for the client-facing audit document. Replace all `[bracketed]` values.
Preserve the heading structure — clients share these documents across teams.

---

```markdown
# [Store Name] - Storefront Performance Audit
**Date:** [YYYY-MM-DD] | **Audited by:** [team/agency] | **Site:** [domain]

---

## Executive Summary

[2-3 sentences summarizing: the severity of the issues, the root cause categories (third-party
scripts, code patterns, image loading, etc.), and the expected improvement if recommendations
are followed. Be specific with numbers — e.g., "FCP can improve from 13s to under 3s".]

---

## Metrics at a Glance

| Metric | Homepage | Collection | PDP | PDP + Cart | Target |
|--------|----------|------------|-----|------------|--------|
| First Contentful Paint | [x]ms | [x]ms | [x]ms | -- | < 1,800ms |
| DOM Elements | [x] | [x] | [x] | [x] | < 1,500 |
| Script Tags | [x] | [x] | [x] | [x] | < 30 |
| Network Requests | [x] | [x] | [x] | -- | < 80 |
| JS Heap Memory | [x] MB | [x] MB | [x] MB | [x] MB | < 30 MB |
| Images (total / lazy) | [x] / [x] | [x] / [x] | [x] / [x] | -- | 90%+ lazy |
| Iframes | [x] | [x] | [x] | -- | < 3 |
| CLS | [x] | [x] | [x] | -- | < 0.1 |
| TTFB | [x]ms | [x]ms | [x]ms | -- | < 200ms |

---

## Top External Services by Request Volume

| # | Service | Requests/page | What it does | Verdict |
|---|---------|---------------|--------------|---------|
| 1 | [service] | [x] | [purpose] | [KEEP/REVIEW/REMOVE/CONTACT] |
| 2 | ... | ... | ... | ... |

**Total external domains loaded per page: [x]**

---

## Duplicate & Overlapping Tools

[For each overlap category found:]

### [Category] (pick one)
- **[Tool A]** - [what it does]
- **[Tool B]** - [what it does, why it overlaps]
- *Recommendation:* [which to keep and why]

---

## Issues We Can Fix (Code Changes)

| Priority | Issue | File(s) | Impact | Effort |
|----------|-------|---------|--------|--------|
| Critical | [issue] | `[file:line]` | [impact] | [hours] |
| High | [issue] | `[file:line]` | [impact] | [hours] |
| ... | ... | ... | ... | ... |

---

## Issues Requiring App/Vendor Action

| Priority | Issue | Vendor | Suggested Action |
|----------|-------|--------|------------------|
| Critical | [issue] | [vendor] | [action] |
| High | [issue] | [vendor] | [action] |
| ... | ... | ... | ... |

---

## Recommended Roadmap

### Phase 1: Quick Wins (Week 1-2)
*No-risk changes with immediate impact*

- [ ] [ticket description]
- [ ] [ticket description]

**Expected impact:** [e.g., "FCP improvement of 5-8 seconds, 30-50 fewer requests"]

### Phase 2: Code Optimization (Week 3-4)
*Targeted code changes with testing*

- [ ] [ticket description]
- [ ] [ticket description]

**Expected impact:** [e.g., "100+ fewer requests, 50-80KB less JS"]

### Phase 3: Architecture (Month 2+)
*Deeper structural improvements*

- [ ] [ticket description]
- [ ] [ticket description]

**Expected impact:** [e.g., "<100 initial requests, <30MB heap, <3s FCP"]

---

## Decisions Needed from Client

[Numbered list. Each item should be a clear question with context and a recommendation.]

1. **[Decision]** — [context]. We recommend [recommendation].
2. ...

---

## Appendix: All External Services Detected

<details>
<summary>Full list of [x]+ external domains loaded per page</summary>

**[Category]:**
[comma-separated list of services]

**[Category]:**
[comma-separated list of services]

</details>

---

*Prepared by [team] | [date]*
```
