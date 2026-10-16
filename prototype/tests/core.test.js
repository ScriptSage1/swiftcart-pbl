/*
 * Unit tests for the SwiftCart core logic (js/core.js).
 * Run with:  npm test      (uses Node's built-in test runner, no dependencies)
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const C = require('../js/core.js');
const D = require('../js/data.js');

const byId = Object.fromEntries(D.products.map((p) => [p.id, p]));
const headphones = byId['aura-headphones'];   // 6,499, stock 12
const shoes = byId['stride-shoes'];           // 4,799, stock 3
const planter = byId['terra-planter'];        // 749, stock 30
const mug = byId['ember-mug'];                // 899, stock 40

function totals(cart, extra) {
  return C.computeTotals(cart, D.products, Object.assign({
    deliveryOptions: D.deliveryOptions,
    promoCodes: D.promoCodes,
    config: D.config,
    deliveryId: 'standard'
  }, extra));
}

// A catalogue with round prices, for exact boundary checks.
const fixture = [
  { id: 'a', name: 'A', price: 998, mrp: 998, stock: 50 },
  { id: 'b', name: 'B', price: 999, mrp: 1200, stock: 50 },
  { id: 'c', name: 'C', price: 1180, mrp: 1180, stock: 50 }
];
function fixtureTotals(cart, extra) {
  return C.computeTotals(cart, fixture, Object.assign({
    deliveryOptions: D.deliveryOptions,
    promoCodes: D.promoCodes,
    config: D.config,
    deliveryId: 'standard'
  }, extra));
}

describe('formatMoney', () => {
  it('UT-01 formats rupees with Indian digit grouping', () => {
    assert.equal(C.formatMoney(6499, D.config), '₹6,499');
    assert.equal(C.formatMoney(123456, D.config), '₹1,23,456');
    assert.equal(C.formatMoney(0, D.config), '₹0');
  });
});

describe('cart operations', () => {
  it('UT-02 adds a new product as a line with quantity 1', () => {
    assert.deepEqual(C.addItem([], headphones, 1), [{ id: 'aura-headphones', qty: 1 }]);
  });

  it('UT-03 merges repeat adds into one line', () => {
    const cart = C.addItem(C.addItem([], headphones, 1), headphones, 2);
    assert.deepEqual(cart, [{ id: 'aura-headphones', qty: 3 }]);
  });

  it('UT-04 never exceeds the available stock', () => {
    const cart = C.addItem([], shoes, 5);
    assert.equal(cart[0].qty, 3);
    assert.equal(C.addItem(cart, shoes, 1)[0].qty, 3);
  });

  it('UT-05 never exceeds the per-order limit', () => {
    const cart = C.addItem([], mug, 25, D.config.maxQtyPerItem);
    assert.equal(cart[0].qty, 10);
  });

  it('UT-06 ignores invalid quantities and does not mutate the input', () => {
    const cart = [{ id: 'aura-headphones', qty: 1 }];
    assert.equal(C.addItem(cart, headphones, 0), cart);
    assert.equal(C.addItem(cart, headphones, -2), cart);
    assert.equal(C.addItem(cart, headphones, 1.5), cart);
    C.addItem(cart, headphones, 1);
    assert.deepEqual(cart, [{ id: 'aura-headphones', qty: 1 }]);
  });

  it('UT-07 sets a quantity, and removes the line at zero', () => {
    const cart = [{ id: 'aura-headphones', qty: 1 }, { id: 'ember-mug', qty: 2 }];
    assert.equal(C.setQty(cart, mug, 5)[1].qty, 5);
    assert.deepEqual(C.setQty(cart, mug, 0), [{ id: 'aura-headphones', qty: 1 }]);
    assert.deepEqual(C.setQty(cart, shoes, 4), cart, 'a product that is not in the cart is a no-op');
  });

  it('UT-08 removes a line and counts items', () => {
    const cart = [{ id: 'aura-headphones', qty: 2 }, { id: 'ember-mug', qty: 3 }];
    assert.equal(C.countItems(cart), 5);
    assert.deepEqual(C.removeItem(cart, 'ember-mug'), [{ id: 'aura-headphones', qty: 2 }]);
    assert.equal(C.countItems([]), 0);
  });
});

describe('promo codes', () => {
  it('UT-09 rejects empty and unknown codes', () => {
    assert.equal(C.evaluatePromo('', 5000, D.promoCodes).ok, false);
    const unknown = C.evaluatePromo('NOPE', 5000, D.promoCodes);
    assert.equal(unknown.ok, false);
    assert.equal(unknown.message, 'That code is not valid');
  });

  it('UT-10 applies a percentage discount and respects the cap', () => {
    assert.equal(C.evaluatePromo('WELCOME10', 2000, D.promoCodes).discount, 200);
    assert.equal(C.evaluatePromo('WELCOME10', 6499, D.promoCodes).discount, 500);
  });

  it('UT-11 enforces the minimum order value', () => {
    const result = C.evaluatePromo('SAVE200', 2000, D.promoCodes);
    assert.equal(result.ok, false);
    assert.match(result.message, /Add .*499 more/);
    assert.equal(C.evaluatePromo('SAVE200', 2499, D.promoCodes).discount, 200);
  });

  it('UT-12 is case-insensitive and trims spaces', () => {
    const result = C.evaluatePromo('  welcome10 ', 2000, D.promoCodes);
    assert.equal(result.ok, true);
    assert.equal(result.code, 'WELCOME10');
  });

  it('UT-13 recognises a free-delivery code', () => {
    const result = C.evaluatePromo('FREESHIP', 300, D.promoCodes);
    assert.equal(result.ok, true);
    assert.equal(result.discount, 0);
    assert.equal(result.freeDelivery, true);
  });
});

describe('order totals', () => {
  it('UT-14 returns zeros for an empty cart', () => {
    const t = totals([]);
    assert.equal(t.subtotal, 0);
    assert.equal(t.delivery, 0);
    assert.equal(t.total, 0);
    assert.equal(t.itemCount, 0);
  });

  it('UT-15 charges standard delivery below the free-delivery threshold', () => {
    const t = totals([{ id: planter.id, qty: 1 }]);
    assert.equal(t.subtotal, 749);
    assert.equal(t.delivery, 79);
    assert.equal(t.total, 828);
    assert.equal(t.freeDeliveryRemaining, 250);
  });

  it('UT-16 makes standard delivery free exactly at the threshold (boundary)', () => {
    assert.equal(fixtureTotals([{ id: 'a', qty: 1 }]).delivery, 79);   // 998
    assert.equal(fixtureTotals([{ id: 'b', qty: 1 }]).delivery, 0);    // 999
    assert.equal(fixtureTotals([{ id: 'b', qty: 1 }]).freeDeliveryRemaining, 0);
  });

  it('UT-17 always charges express delivery unless a code waives it', () => {
    const cart = [{ id: headphones.id, qty: 1 }];
    assert.equal(totals(cart, { deliveryId: 'express' }).delivery, 149);
    assert.equal(totals(cart, { deliveryId: 'express', promoCode: 'FREESHIP' }).delivery, 0);
  });

  it('UT-18 applies the threshold after the discount', () => {
    // 1,180 - 10% = 1,062 (still free); 999 - 10% = 899 (delivery charged again)
    assert.equal(fixtureTotals([{ id: 'c', qty: 1 }], { promoCode: 'WELCOME10' }).delivery, 0);
    const t = fixtureTotals([{ id: 'b', qty: 1 }], { promoCode: 'WELCOME10' });
    assert.equal(t.discount, 100);
    assert.equal(t.delivery, 79);
    assert.equal(t.total, 999 - 100 + 79);
  });

  it('UT-19 reports the GST contained in a tax-inclusive price', () => {
    assert.equal(fixtureTotals([{ id: 'c', qty: 1 }]).taxIncluded, 180); // 1,180 = 1,000 + 18%
  });

  it('UT-20 adds line totals, savings and ignores unknown products', () => {
    const t = totals([{ id: headphones.id, qty: 2 }, { id: 'deleted-product', qty: 4 }, { id: mug.id, qty: 1 }]);
    assert.equal(t.lines.length, 2);
    assert.equal(t.subtotal, 6499 * 2 + 899);
    assert.equal(t.savings, (7999 - 6499) * 2 + (1099 - 899));
    assert.equal(t.itemCount, 3);
  });

  it('UT-21 ignores a promo code that does not qualify', () => {
    const t = totals([{ id: planter.id, qty: 1 }], { promoCode: 'WELCOME10' });
    assert.equal(t.promo.ok, false);
    assert.equal(t.discount, 0);
    assert.equal(t.total, 828);
  });
});

describe('card helpers', () => {
  it('UT-22 validates card numbers with the Luhn checksum', () => {
    assert.equal(C.luhnValid('4111 1111 1111 1111'), true);
    assert.equal(C.luhnValid('5555555555554444'), true);
    assert.equal(C.luhnValid('4111 1111 1111 1112'), false);
    assert.equal(C.luhnValid('4111'), false);
    assert.equal(C.luhnValid(''), false);
  });

  it('UT-23 detects the card network from the prefix', () => {
    assert.equal(C.cardBrand('4111111111111111'), 'visa');
    assert.equal(C.cardBrand('5555555555554444'), 'mastercard');
    assert.equal(C.cardBrand('378282246310005'), 'amex');
    assert.equal(C.cardBrand('6521000000000000'), 'rupay');
    assert.equal(C.cardBrand('9999'), '');
  });

  it('UT-24 formats card numbers and expiry dates as the shopper types', () => {
    assert.equal(C.formatCardNumber('4111111111111111'), '4111 1111 1111 1111');
    assert.equal(C.formatCardNumber('4111-1111 11'), '4111 1111 11');
    assert.equal(C.formatCardNumber('378282246310005'), '3782 822463 10005');
    assert.equal(C.formatExpiry('1229'), '12/29');
    assert.equal(C.formatExpiry('5'), '05');
    assert.equal(C.formatExpiry('12/2'), '12/2');
  });
});

describe('form validation', () => {
  const v = C.validators;

  it('UT-25 validates email addresses', () => {
    assert.equal(v.email('riya@example.com'), '');
    assert.equal(v.email('  riya.sharma+shop@mail.co.in '), '');
    assert.notEqual(v.email(''), '');
    assert.notEqual(v.email('riya@example'), '');
    assert.notEqual(v.email('riya example.com'), '');
  });

  it('UT-26 validates 10-digit Indian mobile numbers', () => {
    assert.equal(v.phone('9876543210'), '');
    assert.equal(v.phone('98765 43210'), '');
    assert.notEqual(v.phone('1234567890'), '');
    assert.notEqual(v.phone('98765'), '');
    assert.notEqual(v.phone(''), '');
  });

  it('UT-27 validates names, addresses and PIN codes', () => {
    assert.equal(v.fullName('Riya Sharma'), '');
    assert.equal(v.fullName("Anne-Marie D'Souza"), '');
    assert.notEqual(v.fullName('R'), '');
    assert.notEqual(v.fullName('<script>'), '');
    assert.equal(v.address('14, 2nd Cross, Indiranagar'), '');
    assert.notEqual(v.address('Flat 2'), '');
    assert.equal(v.pin('560001'), '');
    assert.notEqual(v.pin('056001'), '');
    assert.notEqual(v.pin('5600'), '');
  });

  it('UT-28 validates UPI IDs', () => {
    assert.equal(v.upiId('demo@upi'), '');
    assert.equal(v.upiId('riya.sharma-1@okbank'), '');
    assert.notEqual(v.upiId('riya'), '');
    assert.notEqual(v.upiId('riya@'), '');
    assert.notEqual(v.upiId('@upi'), '');
  });

  it('UT-29 validates card expiry against the current date', () => {
    const now = new Date(2026, 9, 12); // 12 Oct 2026
    assert.equal(v.expiry('10/26', now), '');
    assert.equal(v.expiry('12/29', now), '');
    assert.equal(v.expiry('09/26', now), 'This card has expired');
    assert.equal(v.expiry('13/27', now), 'Enter a valid month (01-12)');
    assert.equal(v.expiry('1227', now), 'Enter the expiry as MM/YY');
  });

  it('UT-30 validates the card number and security code', () => {
    assert.equal(v.cardNumber('4111 1111 1111 1111'), '');
    assert.notEqual(v.cardNumber('4111 1111 1111 1112'), '');
    assert.equal(v.cvv('123', 'visa'), '');
    assert.notEqual(v.cvv('12', 'visa'), '');
    assert.equal(v.cvv('1234', 'amex'), '');
    assert.notEqual(v.cvv('123', 'amex'), '');
  });
});

describe('delivery', () => {
  it('UT-31 looks up the city and state for a PIN code', () => {
    assert.deepEqual(C.lookupPin('560001', D.pinDirectory), { city: 'Bengaluru', state: 'Karnataka' });
    assert.equal(C.lookupPin('999999', D.pinDirectory), null);
  });

  it('UT-32 skips Sundays when counting delivery days', () => {
    const saturday = new Date(2026, 9, 10);
    assert.equal(C.addWorkingDays(saturday, 1).toDateString(), 'Mon Oct 12 2026');
  });

  it('UT-33 estimates a delivery window for each delivery option', () => {
    const monday = new Date(2026, 9, 12);
    const standard = C.estimateDelivery(D.deliveryOptions[0], monday);
    assert.equal(standard.earliest.toDateString(), 'Thu Oct 15 2026');
    assert.equal(standard.latest.toDateString(), 'Sat Oct 17 2026');
    const express = C.estimateDelivery(D.deliveryOptions[1], monday);
    assert.equal(express.earliest.toDateString(), 'Tue Oct 13 2026');
    assert.equal(express.latest.toDateString(), 'Wed Oct 14 2026');
  });

  it('UT-34 generates order numbers in the SC-000000 format', () => {
    assert.equal(C.generateOrderId(() => 0), 'SC-100000');
    assert.equal(C.generateOrderId(() => 0.999999), 'SC-999999');
    assert.match(C.generateOrderId(), /^SC-\d{6}$/);
  });
});
