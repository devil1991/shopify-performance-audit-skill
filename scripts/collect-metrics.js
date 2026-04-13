#!/usr/bin/env node
/**
 * Shopify Performance Audit — Playwright Metrics Collector
 *
 * Fallback when Chrome MCP is not available. Collects the same metrics as the
 * browser-injected script but via Playwright automation.
 *
 * Usage:
 *   npx playwright install chromium  # one-time setup
 *   node collect-metrics.js <url> [--mobile] [--output <path>]
 *
 * Examples:
 *   node collect-metrics.js https://www.example.com
 *   node collect-metrics.js https://www.example.com --mobile
 *   node collect-metrics.js https://www.example.com --output results/homepage.json
 *
 * Outputs JSON with: timing, paints, dom, memory, resources, third-party domains, CLS, etc.
 */

const METRICS_SCRIPT = `
(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');

  const timing = nav ? {
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domInteractive: Math.round(nav.domInteractive),
    domComplete: Math.round(nav.domComplete),
    loadComplete: Math.round(nav.loadEventEnd),
    transferSizeKB: Math.round((nav.transferSize || 0) / 1024)
  } : {};

  const paints = {};
  performance.getEntriesByType('paint').forEach(p => {
    paints[p.name] = Math.round(p.startTime);
  });

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

  let cls = 0;
  try { performance.getEntriesByType('layout-shift').forEach(e => { if (!e.hadRecentInput) cls += e.value; }); } catch(e) {}

  const domainCounts = {};
  const domainSizes = {};
  resources.forEach(r => {
    try {
      const h = new URL(r.name).hostname;
      if (!h.includes('shopify') && !h.includes(location.hostname.replace('www.',''))) {
        const base = h.replace(/^(www|cdn|api|static|scripts|st|async-px|conf|config|app|assets|content)\\./,'');
        domainCounts[base] = (domainCounts[base] || 0) + 1;
        domainSizes[base] = (domainSizes[base] || 0) + (r.transferSize || 0);
      }
    } catch(e) {}
  });
  const topDomains = Object.entries(domainCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 30)
    .map(([d,c]) => ({ domain: d, requests: c, sizeKB: Math.round((domainSizes[d]||0)/1024) }));

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

  return {
    timestamp: new Date().toISOString(),
    url: location.href,
    timing, paints, dom, byType,
    totalResources: resources.length,
    totalTransferKB: Math.round(totalTransfer / 1024),
    cls: Math.round(cls * 1000) / 1000,
    topDomains,
    hiddenImages,
    offscreenIframes,
    scriptResourceCount: resources.filter(r => r.initiatorType === 'script').length,
    fetchXhrCount: resources.filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest').length
  };
})()
`;

async function main() {
  const args = process.argv.slice(2);
  const url = args.find(a => a.startsWith('http'));
  const isMobile = args.includes('--mobile');
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : null;

  if (!url) {
    console.error('Usage: node collect-metrics.js <url> [--mobile] [--output <path>]');
    process.exit(1);
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('Playwright not installed. Run: npx playwright install chromium');
    console.error('Then: npm install playwright');
    process.exit(1);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: isMobile ? { width: 375, height: 812 } : { width: 1440, height: 900 },
    userAgent: isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      : undefined
  });

  const page = await context.newPage();

  // Collect network requests
  const networkRequests = [];
  page.on('request', req => {
    networkRequests.push({
      url: req.url().substring(0, 200),
      method: req.method(),
      resourceType: req.resourceType()
    });
  });

  console.error(`Navigating to ${url} (${isMobile ? 'mobile' : 'desktop'})...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit more for lazy-loaded scripts
  await page.waitForTimeout(3000);

  // Collect performance metrics
  const metrics = await page.evaluate(METRICS_SCRIPT);

  // Add JS heap from CDP
  try {
    const client = await page.context().newCDPSession(page);
    const heapInfo = await client.send('Runtime.getHeapUsage');
    metrics.mem = {
      usedHeapMB: Math.round(heapInfo.usedSize / 1048576),
      totalHeapMB: Math.round(heapInfo.totalSize / 1048576)
    };
  } catch (e) {
    metrics.mem = { note: 'CDP heap metrics not available' };
  }

  metrics.viewport = isMobile ? 'mobile (375x812)' : 'desktop (1440x900)';
  metrics.networkRequestCount = networkRequests.length;

  // Take screenshot
  const screenshotPath = outputPath
    ? outputPath.replace('.json', '.png')
    : `screenshot-${isMobile ? 'mobile' : 'desktop'}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: false });
  metrics.screenshotPath = screenshotPath;

  await browser.close();

  const output = JSON.stringify(metrics, null, 2);

  if (outputPath) {
    const fs = require('fs');
    const path = require('path');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    console.error(`Results saved to ${outputPath}`);
  }

  console.log(output);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
