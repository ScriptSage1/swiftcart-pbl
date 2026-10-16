// Renders every figure to report/diagrams as a PNG at 2x, using a headless Chromium-based browser.
// Usage: node render-diagrams.js [name-filter]
'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].filter(Boolean);
const EDGE = BROWSERS.find((p) => fs.existsSync(p));
const out = path.resolve(__dirname, '..', 'diagrams');
const only = process.argv[2] || '';
const figs = Object.assign({}, ...['./diagrams-analysis.js', './diagrams-uml.js', './diagrams-structure.js'].map((f) => require(f)));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
  const page = await browser.newPage();
  const sizes = {};
  for (const name of Object.keys(figs)) {
    if (only && !name.includes(only)) continue;
    const fig = figs[name]();
    if (fig.svg) {
      await page.setViewport({ width: fig.w, height: fig.h, deviceScaleFactor: 2 });
      await page.setContent(`<html><body style="margin:0;background:#fff">${fig.svg}</body></html>`);
      await page.screenshot({ path: path.join(out, name + '.png'), clip: { x: 0, y: 0, width: fig.w, height: fig.h } });
      sizes[name] = [fig.w, fig.h];
    } else {
      await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
      await page.setContent(`<html><body>${fig.html}</body></html>`);
      const el = await page.$(fig.selector);
      const b = await el.boundingBox();
      await el.screenshot({ path: path.join(out, name + '.png') });
      sizes[name] = [Math.round(b.width), Math.round(b.height)];
    }
    console.log('rendered', name, sizes[name].join('x'));
  }
  const sizeFile = path.join(__dirname, 'sizes.json');
  const all = fs.existsSync(sizeFile) ? JSON.parse(fs.readFileSync(sizeFile, 'utf8')) : {};
  fs.writeFileSync(sizeFile, JSON.stringify(Object.assign(all, sizes), null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
