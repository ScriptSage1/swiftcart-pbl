/*
 * End-to-end tests for the SwiftCart prototype.
 * Drives the real page in a headless Chromium-based browser (Edge or Chrome).
 * Run with:  npm install  (once)  then  npm run test:e2e
 * Set BROWSER_PATH if your browser is installed somewhere unusual.
 */
'use strict';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

const APP = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const BROWSER_PATHS = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const CONTACT = {
  email: 'riya.sharma@example.com',
  phone: '9876543210',
  fullName: 'Riya Sharma',
  pin: '560001',
  address: '14, 2nd Cross, Indiranagar'
};

let browser;
let page;

/* ---------- helpers ---------- */

async function open(hash) {
  await page.goto('about:blank');
  await page.goto(APP + hash);
  await page.evaluate(() => document.fonts.ready); // web fonts in place, so the layout is settled
  if (hash === '#/') await page.waitForSelector('#grid .card');
}

// Lets pending style changes and the (instant, reduced-motion) transitions finish,
// so a click is never aimed at an element that is still sliding or expanding.
const settle = () => page.evaluate(() => new Promise((resolve) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
}));

async function click(selector) {
  await settle();
  await page.click(selector);
}

async function tap(selector) {
  await settle();
  await page.tap(selector);
}

const text = (selector) => page.$eval(selector, (el) => el.textContent.trim());
const rupees = async (selector) => Number((await text(selector)).replace(/[^\d]/g, ''));
const count = (selector) => page.$$eval(selector, (els) => els.length);
const cartBadge = () => page.$eval('#cartCount', (el) => (el.hidden ? 0 : Number(el.textContent)));

async function addFromGrid(id) {
  const selector = '[data-action="add"][data-id="' + id + '"]';
  // Centre the button first so it is never underneath the sticky header or a toast.
  await page.$eval(selector, (el) => el.scrollIntoView({ block: 'center' }));
  await click(selector);
}

async function openCart() {
  await click('#cartBtn');
  await page.waitForSelector('#cartDrawer.is-open');
  await page.waitForFunction(() => document.querySelector('#cartDrawer').getBoundingClientRect().right <= window.innerWidth + 1);
}

async function goToCheckout() {
  await openCart();
  await click('#drawerCheckout');
  await page.waitForSelector('#checkoutForm');
}

async function setField(name, value) {
  const selector = '#f-' + name;
  await page.$eval(selector, (el) => { el.value = ''; });
  await page.type(selector, value);
}

async function fillContact(overrides) {
  const c = Object.assign({}, CONTACT, overrides);
  await setField('email', c.email);
  await setField('phone', c.phone);
  await setField('fullName', c.fullName);
  await setField('pin', c.pin);
  await page.waitForFunction(() => document.querySelector('#f-city').value !== '');
  await setField('address', c.address);
}

async function nextStep(expected) {
  await click('.step.is-active [data-action="next-step"]');
  if (expected) await page.waitForSelector('.step[data-step="' + expected + '"].is-active');
}

async function reachPaymentStep() {
  await fillContact();
  await nextStep(2);
  await nextStep(3);
}

async function payByUpi() {
  await page.type('#f-upiId', 'demo@upi');
  await click('#payBtn');
  await page.waitForFunction(() => window.location.hash.startsWith('#/order/'));
  await page.waitForSelector('.confirm');
}

/* ---------- lifecycle ---------- */

before(async () => {
  const executablePath = BROWSER_PATHS.find((p) => fs.existsSync(p));
  assert.ok(executablePath, 'No Chromium-based browser found. Set BROWSER_PATH to msedge.exe or chrome.exe.');
  browser = await puppeteer.launch({ executablePath, headless: 'new' });
});

after(async () => {
  if (browser) await browser.close();
});

beforeEach(async () => {
  if (page) await page.close();
  page = await browser.newPage();
  page.pageErrors = [];
  page.on('pageerror', (err) => page.pageErrors.push(err.message));
  // Reduced motion makes transitions instant, so assertions do not race animations.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(APP + '#/');
  await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await open('#/');
});

/* ---------- catalogue ---------- */

describe('Catalogue', () => {
  it('TC-01 shows skeleton placeholders, then all 12 products', async () => {
    await page.goto('about:blank');
    await page.goto(APP + '#/');
    assert.equal(await count('#grid .skeleton'), 8);
    await page.waitForSelector('#grid .card');
    assert.equal(await count('#grid .card'), 12);
    assert.equal(await text('#resultCount'), '12 products');
  });

  it('TC-02 filters products by category', async () => {
    await click('.chip[data-category="Audio"]');
    assert.equal(await count('#grid .card'), 2);
    const categories = await page.$$eval('#grid .card__meta span:first-child', (els) => els.map((el) => el.textContent));
    assert.deepEqual(categories, ['Audio', 'Audio']);
  });

  it('TC-03 searches products and shows an empty state when nothing matches', async () => {
    await page.type('#searchInput', 'bottle');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card').length === 1);
    assert.equal(await text('#grid .card__title'), 'Flow Steel Bottle 750 ml');
    await page.type('#searchInput', 'zzz');
    await page.waitForFunction(() => !document.querySelector('#emptyState').hidden);
    assert.equal(await count('#grid .card'), 0);
  });

  it('TC-04 sorts products by price, low to high', async () => {
    await page.select('#sortSelect', 'price-asc');
    const prices = await page.$$eval('#grid .price__now', (els) => els.map((el) => Number(el.textContent.replace(/[^\d]/g, ''))));
    assert.deepEqual(prices, prices.slice().sort((a, b) => a - b));
    assert.equal(prices[0], 749);
  });
});

/* ---------- cart ---------- */

describe('Cart', () => {
  it('TC-05 adds a product and shows it in the cart drawer', async () => {
    await addFromGrid('aura-headphones');
    assert.equal(await cartBadge(), 1);
    await openCart();
    assert.equal(await text('#drawerLines .line__name'), 'Aura Wireless Headphones');
    assert.equal(await rupees('#drawerFoot [data-total="total"]'), 6499);
  });

  it('TC-06 updates quantity and totals, and empties the cart at zero', async () => {
    await addFromGrid('aura-headphones');
    await openCart();
    await click('#drawerLines [data-action="inc"]');
    assert.equal(await text('#drawerLines output'), '2');
    assert.equal(await rupees('#drawerFoot [data-total="subtotal"]'), 12998);
    await click('#drawerLines [data-action="dec"]');
    await click('#drawerLines [data-action="dec"]');
    await page.waitForSelector('#cartDrawer.is-empty');
    assert.equal(await cartBadge(), 0);
  });

  it('TC-07 does not allow more than the available stock', async () => {
    for (let i = 0; i < 5; i++) await addFromGrid('stride-shoes'); // only 3 in stock
    assert.equal(await cartBadge(), 3);
    await openCart();
    assert.equal(await page.$eval('#drawerLines [data-action="inc"]', (el) => el.disabled), true);
  });

  it('TC-08 keeps the cart after the page is reloaded', async () => {
    await addFromGrid('aura-headphones');
    await addFromGrid('ember-mug');
    await page.reload();
    await page.waitForSelector('#grid .card');
    assert.equal(await cartBadge(), 2);
    await openCart();
    assert.equal(await count('#drawerLines .line'), 2);
  });

  it('TC-09 shows the delivery charge up front and waives it above the threshold', async () => {
    await addFromGrid('terra-planter');                       // 749
    await openCart();
    assert.equal(await text('#drawerFoot [data-total="delivery"]'), '\u20B979');
    assert.equal(await rupees('#drawerFoot [data-total="total"]'), 828);
    assert.match(await text('#shipMsg'), /Add \u20B9250 more/);
    await click('[data-action="close-cart"]');
    await addFromGrid('ember-mug');                           // 749 + 899 = 1,648
    await openCart();
    assert.equal(await text('#drawerFoot [data-total="delivery"]'), 'Free');
    assert.equal(await rupees('#drawerFoot [data-total="total"]'), 1648);
  });

  it('TC-10 restores a removed item with Undo', async () => {
    await addFromGrid('aura-headphones');
    await openCart();
    await click('#drawerLines [data-action="remove"]');
    await page.waitForSelector('#cartDrawer.is-empty');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('.toast__action')).find((b) => b.textContent === 'Undo').click();
    });
    await page.waitForFunction(() => !document.querySelector('#cartDrawer').classList.contains('is-empty'));
    assert.equal(await cartBadge(), 1);
  });

  it('TC-11 closes the drawer with Escape and returns focus to the cart button', async () => {
    await openCart();
    await page.keyboard.press('Escape');
    assert.equal(await page.$('#cartDrawer.is-open'), null);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'cartBtn');
  });
});

/* ---------- checkout ---------- */

describe('Checkout', () => {
  it('TC-12 shows a message instead of the form when the cart is empty', async () => {
    await open('#/checkout');
    assert.equal(await text('.notice h1'), 'Your cart is empty');
    assert.equal(await page.$('#checkoutForm'), null);
  });

  it('TC-13 blocks progress and explains every missing field', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await nextStep();
    assert.equal(await count('.step[data-step="1"] .field.is-invalid'), 7);
    assert.equal(await text('#f-email-msg'), 'Enter your email address');
    assert.notEqual(await page.$('.step[data-step="1"].is-active'), null);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'f-email');
  });

  it('TC-14 validates email and mobile number formats inline', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await page.type('#f-email', 'riya@example');
    await page.type('#f-phone', '12345');
    await click('#f-fullName');
    assert.equal(await text('#f-email-msg'), 'Enter a valid email, like name@example.com');
    assert.equal(await text('#f-phone-msg'), 'Enter a valid 10-digit mobile number');
    await page.type('#f-email', '.com');
    assert.notEqual(await page.$('[data-field="email"].is-valid'), null);
  });

  it('TC-15 fills in city and state from the PIN code', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await page.type('#f-pin', '560001');
    await page.waitForFunction(() => document.querySelector('#f-city').value !== '');
    assert.equal(await page.$eval('#f-city', (el) => el.value), 'Bengaluru');
    assert.equal(await page.$eval('#f-state', (el) => el.value), 'Karnataka');
  });

  it('TC-16 rejects an unknown promo code and applies a valid one', async () => {
    await addFromGrid('aura-headphones');                     // 6,499
    await goToCheckout();
    await click('[data-action="toggle-promo"]');
    await page.type('#promoInput', 'NOPE');
    await click('[data-action="apply-promo"]');
    assert.equal(await text('#promoMsg'), 'That code is not valid');
    await page.$eval('#promoInput', (el) => { el.value = ''; });
    await page.type('#promoInput', 'welcome10');
    await click('[data-action="apply-promo"]');
    await page.waitForSelector('#promoApplied:not([hidden])');
    assert.equal(await text('#promoCode'), 'WELCOME10');
    assert.equal(await rupees('#summary [data-total="discount"]'), 500);   // 10%, capped at 500
    assert.equal(await rupees('#summary [data-total="total"]'), 5999);
  });

  it('TC-17 updates the total when the delivery method changes', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await fillContact();
    await nextStep(2);
    assert.equal(await rupees('#summary [data-total="total"]'), 6499);
    await click('input[name="delivery"][value="express"]');
    assert.equal(await text('#summary [data-total="delivery"]'), '\u20B9149');
    assert.equal(await rupees('#summary [data-total="total"]'), 6648);
  });

  it('TC-18 lets the shopper go back and edit a completed step', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await fillContact();
    await nextStep(2);
    assert.match(await text('[data-summary="1"]'), /Riya Sharma/);
    await click('.step[data-step="1"] [data-action="edit-step"]');
    await page.waitForSelector('.step[data-step="1"].is-active');
    assert.equal(await page.$eval('#f-email', (el) => el.value), CONTACT.email);
  });

  it('TC-19 rejects an invalid card number', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await reachPaymentStep();
    await click('[data-method="card"]');
    await page.type('#f-cardNumber', '4111111111111112');
    await page.type('#f-expiry', '1230');
    await page.type('#f-cvv', '123');
    await page.type('#f-cardName', 'Riya Sharma');
    await click('#payBtn');
    assert.equal(await text('#f-cardNumber-msg'), 'Check the card number and try again');
    assert.equal(await page.evaluate(() => window.location.hash), '#/checkout');
  });

  it('TC-20 completes a guest checkout with UPI and shows the confirmation', async () => {
    await addFromGrid('aura-headphones');
    await addFromGrid('ember-mug');
    await goToCheckout();
    await reachPaymentStep();
    assert.equal(await text('#payLabel'), 'Pay \u20B97,398');
    await payByUpi();
    assert.match(await text('.confirm .eyebrow'), /^Order SC-\d{6}$/);
    assert.match(await text('.confirm h1'), /Thank you, Riya/);
    assert.equal(await rupees('.confirm .totals__row--grand dd'), 7398);
    assert.equal(await cartBadge(), 0);
  });

  it('TC-21 completes a checkout with a card and stores only the last four digits', async () => {
    await addFromGrid('halo-lamp');
    await goToCheckout();
    await reachPaymentStep();
    await click('[data-method="card"]');
    await page.type('#f-cardNumber', '4111111111111111');
    await page.type('#f-expiry', '1230');
    await page.type('#f-cvv', '123');
    await page.type('#f-cardName', 'Riya Sharma');
    await click('#payBtn');
    await page.waitForSelector('.confirm');
    assert.match(await text('.confirm__side'), /Visa ending 1111/);
    const stored = await page.evaluate(() => window.localStorage.getItem('swiftcart:v1'));
    assert.equal(stored.includes('4111111111111111'), false);
    assert.equal(stored.includes('"cvv"'), false);
  });

  it('TC-22 completes a cash-on-delivery order without payment details', async () => {
    await addFromGrid('flow-bottle');
    await goToCheckout();
    await reachPaymentStep();
    await click('[data-method="cod"]');
    assert.equal(await text('#payLabel'), 'Place order \u00B7 \u20B91,199');
    await click('#payBtn');
    await page.waitForSelector('.confirm');
    assert.match(await text('.confirm__side'), /Cash on delivery/);
  });

  it('TC-23 pre-fills saved details on the next checkout', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await reachPaymentStep();
    await payByUpi();
    await open('#/');
    await addFromGrid('ember-mug');
    await goToCheckout();
    assert.equal(await page.$eval('#f-email', (el) => el.value), CONTACT.email);
    assert.equal(await page.$eval('#f-city', (el) => el.value), 'Bengaluru');
  });

  it('TC-24 takes "Buy now" straight to checkout with the item in the cart', async () => {
    await open('#/product/pulse-watch');
    await click('[data-action="pdp-buy"]');
    await page.waitForSelector('#checkoutForm');
    assert.equal(await text('#summaryLines .line__name'), 'Pulse Smart Watch');
    assert.equal(await rupees('#summary [data-total="total"]'), 8999);
  });

  it('TC-25 renders shopper-entered HTML as plain text (no script injection)', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await fillContact({ address: '<img src=x onerror="window.__xss=1"> 12 Main Road' });
    await nextStep(2);
    assert.equal(await page.$('[data-summary="1"] img'), null);
    await nextStep(3);
    await payByUpi();
    assert.equal(await page.$('.confirm__side img'), null);
    assert.match(await text('.confirm__side'), /<img src=x/);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
  });
});

/* ---------- responsive ---------- */

describe('Mobile layout', () => {
  it('TC-26 fits a 390px screen and collapses the order summary', async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await open('#/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, 'page should not scroll sideways');
    await tap('[data-action="add"][data-id="aura-headphones"]');
    await tap('#cartBtn');
    await page.waitForSelector('#cartDrawer.is-open');
    await tap('#drawerCheckout');
    await page.waitForSelector('#checkoutForm');
    const rows = () => page.$eval('.summary__panel', (el) => window.getComputedStyle(el).gridTemplateRows);
    assert.equal(await rows(), '0px');
    await tap('[data-action="toggle-summary"]');
    await page.waitForFunction(() => window.getComputedStyle(document.querySelector('.summary__panel')).gridTemplateRows !== '0px');
    assert.notEqual(await page.$('#summary.is-open'), null);
  });
});

describe('Recovery and analytics', () => {
  it('TC-27 reminds a returning shopper that the cart was saved', async () => {
    await addFromGrid('aura-headphones');
    await page.evaluate(() => window.sessionStorage.clear()); // a new browsing session
    await page.reload();
    await page.waitForSelector('.toast');
    assert.match(await text('.toast__msg'), /Welcome back\. Your cart was saved \(1 item\)/);
  });

  it('TC-28 records the checkout funnel events for analysis', async () => {
    await addFromGrid('aura-headphones');
    await goToCheckout();
    await reachPaymentStep();
    await payByUpi();
    const names = await page.evaluate(() => JSON.parse(window.localStorage.getItem('swiftcart:v1')).events.map((e) => e.name));
    for (const expected of ['add_to_cart', 'view_cart', 'begin_checkout', 'checkout_step_complete', 'purchase']) {
      assert.ok(names.includes(expected), 'missing event ' + expected);
    }
    assert.equal(names.filter((n) => n === 'checkout_step_complete').length, 2);
  });
});

describe('My orders', () => {
  it('TC-30 shows an empty state before any order is placed', async () => {
    await click('#ordersBtn');
    await page.waitForSelector('.notice');
    assert.equal(await page.evaluate(() => window.location.hash), '#/orders');
    assert.equal(await text('.notice h1'), 'No orders yet');
  });

  it('TC-31 lists placed orders, newest first, with total and estimated arrival', async () => {
    await addFromGrid('aura-headphones');
    await addFromGrid('ember-mug');
    await goToCheckout();
    await reachPaymentStep();
    await payByUpi();
    const firstId = (await text('.confirm .eyebrow')).replace('Order ', '');
    const eta = await page.evaluate((id) => JSON.parse(window.localStorage.getItem('swiftcart:v1')).orders[id].delivery.eta, firstId);

    await open('#/');
    await addFromGrid('flow-bottle');
    await goToCheckout();
    await nextStep(2);
    await nextStep(3);
    await payByUpi();
    const secondId = (await text('.confirm .eyebrow')).replace('Order ', '');

    await click('.confirm__actions a[href="#/orders"]');
    await page.waitForSelector('.orders');
    assert.equal(await count('.order-card'), 2);
    assert.deepEqual(await page.$$eval('.order-card', (els) => els.map((el) => el.dataset.order)), [secondId, firstId]);
    const first = '.order-card[data-order="' + firstId + '"] ';
    assert.equal(await rupees(first + '.order-card__total'), 7398);
    assert.match(await text(first + '.order-card__placed'), /2 items$/);
    assert.ok((await text(first + '.order-card__eta')).includes(eta), 'card should show the estimated arrival');

    await click(first + '.btn');
    await page.waitForSelector('.confirm');
    assert.equal(await text('.confirm .eyebrow'), 'Order ' + firstId);
  });
});

describe('Stability', () => {
  it('TC-29 runs a full purchase without any JavaScript errors', async () => {
    await open('#/product/aura-headphones');
    await click('[data-action="pdp-add"]');
    await open('#/');
    await goToCheckout();
    await reachPaymentStep();
    await payByUpi();
    assert.deepEqual(page.pageErrors, []);
  });
});
