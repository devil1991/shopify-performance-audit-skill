# Known Third-Party Services Database

Use this database to identify services by their domain patterns, understand their typical impact,
and recommend loading strategies.

## How to Use

When you detect an external domain in the resource timing data, match it against the patterns
below. The `requests_typical` field tells you what's normal — if a service is making significantly
more requests than typical, it's likely misconfigured.

---

## Analytics & Session Recording

### Hotjar
- **Domains**: `static.hotjar.com`, `script.hotjar.com`, `*.hotjar.com`
- **Requests typical**: 3-6
- **Can defer**: Yes — wrap in `setTimeout(fn, 5000)` or `requestIdleCallback`
- **Overlaps with**: Microsoft Clarity, FullStory, LogRocket, Heap
- **Recommendation**: If Clarity is also installed, remove Hotjar (Clarity is free and lighter)
- **Loading strategy**: Move to footer, wrap in idle callback

### Microsoft Clarity
- **Domains**: `www.clarity.ms`, `scripts.clarity.ms`, `e.clarity.ms`
- **Requests typical**: 4-10
- **Can defer**: Yes
- **Overlaps with**: Hotjar, FullStory, LogRocket
- **Recommendation**: Best free option for session recording. Keep over Hotjar if both present
- **Loading strategy**: Defer, load after interaction

### FullStory
- **Domains**: `fullstory.com`, `rs.fullstory.com`, `edge.fullstory.com`
- **Requests typical**: 5-15
- **Can defer**: Yes
- **Overlaps with**: Hotjar, Clarity
- **Note**: Enterprise-grade. Heavy JS payload (~80KB)

### Heap
- **Domains**: `cdn.heapanalytics.com`, `heapanalytics.com`
- **Requests typical**: 3-8
- **Can defer**: Yes
- **Overlaps with**: Hotjar, Clarity (partially)

---

## Personalization & A/B Testing

### Dynamic Yield
- **Domains**: `cdn.dynamicyield.com`, `st.dynamicyield.com`, `async-px.dynamicyield.com`
- **Requests typical**: 6-12
- **Can defer**: Partially (recommendations can defer, web layers may need early load)
- **Overlaps with**: Exponea/Bloomreach, Nosto, Klevu
- **Common misconfiguration**: Loading both sync and async variants

### Exponea / Bloomreach
- **Domains**: `api.exponea.com`, `api.us1.exponea.com`, `*.exponea.com`
- **Requests typical**: 6-12
- **Can defer**: The SDK init can move to footer
- **Overlaps with**: Dynamic Yield, Nosto (personalization + A/B)
- **Common misconfiguration**: Large inline init script in `<head>` (40+ lines)
- **Red flag**: If both Exponea AND Dynamic Yield are installed, clarify which owns personalization

### Nosto
- **Domains**: `connect.nosto.com`, `*.nosto.com`
- **Requests typical**: 5-10
- **Can defer**: Partially
- **Overlaps with**: Dynamic Yield, Exponea

### Klevu
- **Domains**: `js.klevu.com`, `*.klevu.com`
- **Requests typical**: 3-8
- **Overlaps with**: Boost Commerce (search), Algolia, Searchspring

---

## Conversion Tracking / Pixel Management

### Elevar
- **Domains**: `useamp.com`, `cdn.useamp.com`, `*.useamp.com`
- **Requests typical**: 10-25
- **Red flag**: > 50 requests per page indicates misconfiguration
- **Critical red flag**: > 80 requests per page — contact Elevar support immediately
- **Can defer**: No (tracking must fire on page load)
- **Overlaps with**: TripleWhale, Littledata
- **Common misconfiguration**: Duplicate event firing, multiple data layer pushes, excessive beacon calls

### TripleWhale
- **Domains**: `*.triplewhale.com`, `api.triplewhale.com`
- **Requests typical**: 3-8
- **Can defer**: No (tracking)
- **Overlaps with**: Elevar, Littledata
- **Note**: If Elevar is installed, TripleWhale may be redundant

### Littledata
- **Domains**: `*.littledata.io`, `t.littledata.io`
- **Requests typical**: 3-6
- **Overlaps with**: Elevar, TripleWhale

---

## Marketing Pixels

### Facebook / Meta Pixel
- **Domains**: `connect.facebook.net`, `www.facebook.com`
- **Requests typical**: 2-5
- **Can defer**: Should be managed via Elevar/GTM if possible
- **Note**: Often loaded both directly AND through a pixel manager — check for duplicates

### Pinterest Pixel
- **Domains**: `ct.pinterest.com`, `s.pinimg.com`
- **Requests typical**: 3-6

### TikTok Pixel
- **Domains**: `analytics.tiktok.com`, `*.tiktok.com`
- **Requests typical**: 3-7

### Google Ads / Conversion
- **Domains**: `googleads.g.doubleclick.net`, `www.googletagmanager.com`, `www.google.com`
- **Requests typical**: 3-8
- **Note**: Should be consolidated through GTM, not loaded separately

---

## Reviews & UGC

### Yotpo
- **Domains**: `cdn-widgetsrepository.yotpo.com`, `api-cdn.yotpo.com`, `cdn-loyalty.yotpo.com`, `cdn-swell-assets.yotpo.com`
- **Requests typical**: 10-30 (includes reviews + loyalty + UGC gallery)
- **Can defer**: Widget JS can defer, API calls needed on demand
- **Note**: Multiple sub-products (reviews, loyalty, UGC) each add their own scripts
- **Optimization**: Load review widget only on PDP, loyalty only when needed

### Judge.me
- **Domains**: `judgeme.imgix.net`, `*.judge.me`
- **Requests typical**: 3-8
- **Can defer**: Yes

### Stamped.io
- **Domains**: `stamped.io`, `*.stamped.io`
- **Requests typical**: 3-6

### Okendo
- **Domains**: `*.okendo.io`
- **Requests typical**: 3-8

---

## Chat & Support

### Gorgias
- **Domains**: `config.gorgias.chat`, `assets.gorgias.chat`, `config.gorgias.help`
- **Requests typical**: 10-18
- **Can defer**: Yes — load on user interaction (scroll, mousemove, click)
- **Loading strategy**: Facade pattern — show static chat button, load widget on click/hover
- **Common misconfiguration**: Loading without `defer` attribute

### Zendesk
- **Domains**: `*.zendesk.com`, `static.zdassets.com`
- **Requests typical**: 8-15
- **Can defer**: Yes — facade pattern

### Tidio
- **Domains**: `*.tidio.co`, `code.tidio.co`
- **Requests typical**: 5-10
- **Can defer**: Yes

### Intercom
- **Domains**: `*.intercom.io`, `widget.intercom.io`
- **Requests typical**: 8-15
- **Can defer**: Yes

---

## Accessibility Overlays

### UserWay
- **Domains**: `cdn.userway.org`, `*.userway.org`
- **Requests typical**: 10-25
- **Can defer**: Yes — load on first interaction
- **Loading strategy**: `requestIdleCallback` or scroll trigger
- **Note**: Heavy widget. Consider native accessibility improvements instead

### accessiBe
- **Domains**: `*.accessibe.com`, `acsbapp.com`
- **Requests typical**: 5-15
- **Can defer**: Yes

---

## BNPL (Buy Now Pay Later)

### Klarna
- **Domains**: `js.klarna.com`, `*.klarna.com`
- **Requests typical**: 2-5
- **Can defer**: Messaging widget can defer, checkout integration cannot
- **Loading strategy**: Load messaging on PDP only when product price is visible

### Afterpay / Clearpay
- **Domains**: `js.afterpay.com`, `*.afterpay.com`
- **Requests typical**: 2-4

### Affirm
- **Domains**: `cdn1.affirm.com`, `*.affirm.com`
- **Requests typical**: 2-4

---

## Email / SMS Marketing

### Klaviyo
- **Domains**: `*.klaviyo.com`, `static.klaviyo.com`
- **Requests typical**: 3-8
- **Can defer**: Forms can defer, tracking should stay

### Attentive
- **Domains**: `cdn.attn.tv`, `*.attn.tv`, `tags.pw.adn.cloud`
- **Requests typical**: 3-8
- **Can defer**: Yes — load after page interactive

### Postscript
- **Domains**: `*.postscript.io`, `sdk.postscript.io`
- **Requests typical**: 2-5

---

## Search & Discovery

### Boost Commerce
- **Domains**: `cdn.boostcommerce.io`, `*.boostcommerce.io`
- **Requests typical**: 3-6
- **Loading strategy**: Load only on collection pages and search

### Searchspring
- **Domains**: `*.searchspring.net`
- **Requests typical**: 3-8

### Algolia
- **Domains**: `*.algolia.net`, `*.algolianet.com`
- **Requests typical**: 3-6

---

## Returns & Post-Purchase

### Narvar
- **Domains**: `szero.narvar.com`, `*.narvar.com`
- **Requests typical**: 1-3
- **Can defer**: Yes

### Loop Returns
- **Domains**: `*.loopreturns.com`
- **Requests typical**: 1-3

### Reshop
- **Domains**: `d1fghtjypwlbrf.cloudfront.net` (Reshop widgets)
- **Requests typical**: 2-4
- **Loading strategy**: Load on PDP only, defer

---

## Consent Management

### Consentmo
- **Domains**: `app.consentmo.com`, `config-security.com`, `conf.config-security.com`
- **Requests typical**: 3-6
- **Can defer**: No — must load before other tracking scripts
- **Note**: Required for GDPR compliance, don't remove

### CookieYes
- **Domains**: `*.cookieyes.com`, `cdn-cookieyes.com`
- **Requests typical**: 2-4

### OneTrust
- **Domains**: `cdn.cookielaw.org`, `*.onetrust.com`
- **Requests typical**: 3-6

---

## Other Common Services

### Instafeed / nfcube
- **Domains**: `instafeed.nfcube.com`, `cdn.nfcube.com`
- **Requests typical**: 3-6
- **Can defer**: Yes — load on scroll to Instagram section
- **Loading strategy**: IntersectionObserver on the Instagram section container

### DailyKarma
- **Domains**: `assets.dailykarma.io`, `*.dailykarma.io`
- **Requests typical**: 3-5
- **Can defer**: Yes
- **Note**: Charity/giveback widget. Often installed and forgotten

### Seel / Worry Free
- **Domains**: `static.seel.com`, `api.seel.com`
- **Requests typical**: 3-6
- **Can defer**: Widget can defer, API calls on PDP
- **Note**: Purchase protection. Review conversion impact vs. performance cost

### Purple Dot
- **Domains**: `www.purpledotprice.com`, `cf.getpurpledot.com`
- **Requests typical**: 3-10
- **Can defer**: Yes
- **Common misconfiguration**: Loading in `<head>` with cart/customer data exposed
