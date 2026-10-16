/*
 * SwiftCart prototype — core business logic.
 * Pure functions only (no DOM, no storage) so the same file runs in the
 * browser and under Node's test runner.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SC_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_MAX_QTY = 10;

  function digitsOnly(value) {
    return String(value == null ? '' : value).replace(/\D+/g, '');
  }

  function formatMoney(amount, config) {
    const c = config || {};
    return new Intl.NumberFormat(c.locale || 'en-IN', {
      style: 'currency',
      currency: c.currency || 'INR',
      maximumFractionDigits: 0
    }).format(Math.round(Number(amount) || 0));
  }

  /* ---------- Cart ---------- */

  function qtyLimit(product, maxQty) {
    return Math.max(0, Math.min(maxQty == null ? DEFAULT_MAX_QTY : maxQty, product.stock));
  }

  function addItem(cart, product, qty, maxQty) {
    const n = qty == null ? 1 : qty;
    if (!product || !Number.isInteger(n) || n < 1) return cart;
    const limit = qtyLimit(product, maxQty);
    if (limit === 0) return cart;
    let found = false;
    const next = cart.map(function (line) {
      if (line.id !== product.id) return line;
      found = true;
      return { id: line.id, qty: Math.min(limit, line.qty + n) };
    });
    if (!found) next.push({ id: product.id, qty: Math.min(limit, n) });
    return next;
  }

  function setQty(cart, product, qty, maxQty) {
    if (!product) return cart;
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n <= 0) return removeItem(cart, product.id);
    const limit = qtyLimit(product, maxQty);
    return cart.map(function (line) {
      return line.id === product.id ? { id: line.id, qty: Math.min(limit, n) } : line;
    });
  }

  function removeItem(cart, id) {
    return cart.filter(function (line) { return line.id !== id; });
  }

  function countItems(cart) {
    return cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  /* ---------- Promotions and totals ---------- */

  function evaluatePromo(code, subtotal, promoCodes) {
    const key = String(code || '').trim().toUpperCase();
    if (!key) return { ok: false, code: '', discount: 0, freeDelivery: false, message: 'Enter a promo code' };
    const promo = promoCodes && promoCodes[key];
    if (!promo) return { ok: false, code: key, discount: 0, freeDelivery: false, message: 'That code is not valid' };
    if (subtotal < (promo.minSubtotal || 0)) {
      return {
        ok: false, code: key, discount: 0, freeDelivery: false,
        message: 'Add ' + formatMoney(promo.minSubtotal - subtotal) + ' more to use ' + key
      };
    }
    let discount = 0;
    if (promo.type === 'percent') {
      discount = Math.round(subtotal * promo.value / 100);
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else if (promo.type === 'flat') {
      discount = Math.min(promo.value, subtotal);
    }
    return { ok: true, code: key, discount: discount, freeDelivery: promo.type === 'shipping', message: promo.label };
  }

  function computeTotals(cart, products, opts) {
    const o = opts || {};
    const config = o.config || {};
    const threshold = config.freeDeliveryThreshold || 0;
    const rate = config.gstRate || 0;
    const byId = {};
    products.forEach(function (p) { byId[p.id] = p; });

    const lines = [];
    cart.forEach(function (line) {
      const product = byId[line.id];
      if (!product) return; // ignore items no longer in the catalogue
      lines.push({
        id: line.id,
        qty: line.qty,
        product: product,
        lineTotal: product.price * line.qty,
        lineSaving: Math.max(0, product.mrp - product.price) * line.qty
      });
    });

    const subtotal = lines.reduce(function (s, l) { return s + l.lineTotal; }, 0);
    const promo = o.promoCode ? evaluatePromo(o.promoCode, subtotal, o.promoCodes) : null;
    let discount = promo && promo.ok ? promo.discount : 0;
    const afterDiscount = subtotal - discount;

    const options = o.deliveryOptions || [];
    const option = options.filter(function (d) { return d.id === o.deliveryId; })[0] || options[0] || null;
    let delivery = 0;
    if (lines.length && option) {
      delivery = option.fee;
      if (option.freeAboveThreshold && afterDiscount >= threshold) delivery = 0;
      if (promo && promo.ok && promo.freeDelivery) delivery = 0;
    }

    return {
      lines: lines,
      itemCount: countItems(lines),
      subtotal: subtotal,
      promo: promo,
      discount: discount,
      delivery: delivery,
      deliveryOption: option,
      total: afterDiscount + delivery,
      taxIncluded: Math.round(afterDiscount * rate / (1 + rate)),
      savings: lines.reduce(function (s, l) { return s + l.lineSaving; }, 0) + discount,
      freeDeliveryRemaining: lines.length ? Math.max(0, threshold - afterDiscount) : threshold,
      freeDeliveryProgress: threshold ? Math.min(1, afterDiscount / threshold) : 1
    };
  }

  /* ---------- Payment helpers ---------- */

  function luhnValid(number) {
    const digits = digitsOnly(number);
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let doubleIt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (doubleIt) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      doubleIt = !doubleIt;
    }
    return sum % 10 === 0;
  }

  function cardBrand(number) {
    let d = digitsOnly(number);
    if (/^4/.test(d)) return 'visa';
    if (/^3[47]/.test(d)) return 'amex';
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return 'mastercard';
    if (/^(60|65|81|82|508)/.test(d)) return 'rupay';
    return '';
  }

  function formatCardNumber(value) {
    let d = digitsOnly(value).slice(0, 19);
    if (cardBrand(d) === 'amex') {
      return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
    }
    return d.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(value) {
    let d = digitsOnly(value).slice(0, 4);
    if (d.length === 1 && d > '1') d = '0' + d; // typing "5" means May
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  }

  /* ---------- Validation: each validator returns '' when the value is valid ---------- */

  const validators = {
    email: function (v) {
      const s = String(v || '').trim();
      if (!s) return 'Enter your email address';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? '' : 'Enter a valid email, like name@example.com';
    },
    phone: function (v) {
      let d = digitsOnly(v);
      if (!d) return 'Enter your mobile number';
      return /^[6-9]\d{9}$/.test(d) ? '' : 'Enter a valid 10-digit mobile number';
    },
    fullName: function (v) {
      const s = String(v || '').trim();
      if (!s) return 'Enter your full name';
      if (s.length < 2) return 'Name looks too short';
      return /^[\p{L}][\p{L} .'-]*$/u.test(s) ? '' : 'Use letters and spaces only';
    },
    pin: function (v) {
      const s = String(v || '').trim();
      if (!s) return 'Enter your PIN code';
      return /^[1-9]\d{5}$/.test(s) ? '' : 'Enter a valid 6-digit PIN code';
    },
    address: function (v) {
      const s = String(v || '').trim();
      if (!s) return 'Enter your address';
      return s.length >= 8 ? '' : 'Add your house or flat number and street';
    },
    city: function (v) {
      return String(v || '').trim().length >= 2 ? '' : 'Enter your city';
    },
    state: function (v) {
      return String(v || '').trim().length >= 2 ? '' : 'Enter your state';
    },
    upiId: function (v) {
      const s = String(v || '').trim();
      if (!s) return 'Enter your UPI ID';
      return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(s) ? '' : 'Enter a valid UPI ID, like name@bank';
    },
    cardNumber: function (v) {
      let d = digitsOnly(v);
      if (!d) return 'Enter your card number';
      return luhnValid(d) ? '' : 'Check the card number and try again';
    },
    expiry: function (v, now) {
      const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(v || '').trim());
      if (!m) return 'Enter the expiry as MM/YY';
      const month = Number(m[1]);
      const year = 2000 + Number(m[2]);
      if (month < 1 || month > 12) return 'Enter a valid month (01-12)';
      const today = now || new Date();
      const expired = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1);
      return expired ? 'This card has expired' : '';
    },
    cvv: function (v, brand) {
      let d = String(v || '').trim();
      const length = brand === 'amex' ? 4 : 3;
      if (!d) return 'Enter the security code';
      return new RegExp('^\\d{' + length + '}$').test(d) ? '' : 'Enter the ' + length + '-digit code';
    },
    cardName: function (v) {
      return String(v || '').trim().length >= 2 ? '' : 'Enter the name on the card';
    }
  };

  /* ---------- Delivery ---------- */

  function lookupPin(pin, directory) {
    const key = String(pin || '').trim();
    return (directory && directory[key]) || null;
  }

  function addWorkingDays(from, days) {
    let d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) added++; // couriers do not deliver on Sundays
    }
    return d;
  }

  function estimateDelivery(option, from) {
    const start = from || new Date();
    return {
      earliest: addWorkingDays(start, option.minDays),
      latest: addWorkingDays(start, option.maxDays)
    };
  }

  function formatDate(date, locale) {
    return new Intl.DateTimeFormat(locale || 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  }

  function generateOrderId(random) {
    const r = typeof random === 'function' ? random : Math.random;
    return 'SC-' + String(Math.floor(100000 + r() * 900000));
  }

  return {
    digitsOnly: digitsOnly,
    formatMoney: formatMoney,
    addItem: addItem,
    setQty: setQty,
    removeItem: removeItem,
    countItems: countItems,
    evaluatePromo: evaluatePromo,
    computeTotals: computeTotals,
    luhnValid: luhnValid,
    cardBrand: cardBrand,
    formatCardNumber: formatCardNumber,
    formatExpiry: formatExpiry,
    validators: validators,
    lookupPin: lookupPin,
    addWorkingDays: addWorkingDays,
    estimateDelivery: estimateDelivery,
    formatDate: formatDate,
    generateOrderId: generateOrderId
  };
});
