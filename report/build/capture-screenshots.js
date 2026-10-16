// Captures the prototype screenshots used in the report into report/screenshots.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].filter(Boolean);
const EDGE = BROWSERS.find((p) => fs.existsSync(p));
const root = path.resolve(__dirname, '..', '..');
const out = path.join(root, 'report', 'screenshots');
const base = pathToFileURL(path.join(root, 'prototype', 'index.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  // Product photos are lazy-loaded, so make sure every visible image has finished decoding first.
  const imagesReady = () => page.evaluate(() => Promise.all(Array.from(document.images).map((i) => { i.loading = 'eager'; return i.decode().catch(() => {}); })));
  const shot = async (name) => { await imagesReady(); await page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 88 }); console.log('shot', name); };
  const clearToasts = () => page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));

  await page.goto(base + '#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('about:blank'); await page.goto(base + '#/', { waitUntil: 'networkidle0' });
  await sleep(1800); await shot('01-home');
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#products').offsetTop - 84)); await sleep(1400); await shot('02-catalogue');

  await page.goto('about:blank'); await page.goto(base + '#/product/aura-headphones', { waitUntil: 'networkidle0' });
  await sleep(1300);
  await page.type('#pinCheckInput', '560001'); await page.click('#pinCheck button'); await sleep(400);
  await page.click('[data-action="pdp-add"]'); await sleep(900); await shot('03-product');
  await page.goto('about:blank'); await page.goto(base + '#/', { waitUntil: 'networkidle0' }); await sleep(1200);
  await page.$eval('[data-action="add"][data-id="ember-mug"]', (el) => el.scrollIntoView({ block: 'center' })); await sleep(700);
  await page.click('[data-action="add"][data-id="ember-mug"]'); await sleep(400); await clearToasts();
  await page.click('#cartBtn'); await sleep(1100); await shot('04-cart-drawer');

  await page.click('#drawerCheckout'); await sleep(1200);
  await page.type('#f-email', 'riya.sharma@example'); await page.type('#f-phone', '98765');
  await page.click('.step.is-active [data-action="next-step"]'); await sleep(900);
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await shot('05-checkout-validation');

  const set = async (id, v) => { await page.$eval(id, (el) => { el.value = ''; }); await page.type(id, v); };
  await set('#f-email', 'riya.sharma@example.com'); await set('#f-phone', '9876543210'); await page.type('#f-fullName', 'Riya Sharma');
  await page.type('#f-pin', '560001'); await sleep(900); await page.type('#f-address', '14, 2nd Cross, Indiranagar');
  await page.click('[data-action="toggle-promo"]'); await sleep(500); await page.click('[data-action="use-promo"]'); await sleep(600); await clearToasts();
  await page.click('.checkout__title h1'); await sleep(600); await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await shot('06-checkout-details');

  await page.click('.step.is-active [data-action="next-step"]'); await sleep(1400);
  await page.click('input[value="express"]'); await sleep(800); await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await shot('07-checkout-delivery');
  await page.click('input[value="standard"]'); await sleep(300);
  await page.click('.step.is-active [data-action="next-step"]'); await sleep(1400);
  await page.click('[data-method="card"]'); await sleep(600);
  await page.type('#f-cardNumber', '4111111111111111'); await page.type('#f-expiry', '1229'); await page.type('#f-cvv', '123'); await page.type('#f-cardName', 'Riya Sharma');
  await page.click('.guest-note'); await sleep(500); await page.evaluate(() => window.scrollTo(0, 150)); await sleep(400); await shot('08-checkout-payment');
  await page.click('#payBtn'); await sleep(3600); await shot('09-confirmation');

  // A second order (details are pre-filled from the first), then the order history.
  await page.goto('about:blank'); await page.goto(base + '#/product/flow-bottle', { waitUntil: 'networkidle0' }); await sleep(1000);
  await page.click('[data-action="pdp-buy"]'); await sleep(1200);
  await page.click('.step.is-active [data-action="next-step"]'); await sleep(1000);
  await page.click('.step.is-active [data-action="next-step"]'); await sleep(1000);
  await page.click('[data-method="cod"]'); await sleep(400);
  await page.click('#payBtn'); await sleep(3000);
  await page.goto('about:blank'); await page.goto(base + '#/orders', { waitUntil: 'networkidle0' }); await sleep(1200); await clearToasts(); await shot('13-my-orders');

  // mobile
  await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('about:blank'); await page.goto(base + '#/', { waitUntil: 'networkidle0' }); await sleep(1700); await shot('10-mobile-home');
  await page.$eval('[data-action="add"][data-id="aura-headphones"]', (el) => el.scrollIntoView({ block: 'center' })); await sleep(800);
  await page.tap('[data-action="add"][data-id="aura-headphones"]'); await sleep(500); await clearToasts();
  await page.tap('#cartBtn'); await sleep(1000); await shot('11-mobile-cart');
  await page.tap('#drawerCheckout'); await sleep(1300); await shot('12-mobile-checkout');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
