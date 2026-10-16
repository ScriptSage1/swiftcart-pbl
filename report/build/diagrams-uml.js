// UML behaviour and structure figures: use case, class, sequence, activity, state machine.
'use strict';
const L = require('./diagram-kit.js');
const { C, text, tag, rect, box, ellipse, circle, diamond, line, actor, classBox, svg } = L;

const F = {};

/* ---------- 06 Use case diagram ---------- */
F['06-use-case'] = () => {
  const W = 860, H = 760;
  let s = '';
  s += rect(182, 28, 496, 712, { rx: 6, fill: '#FCFCFB' });
  s += text(430, 48, 'SwiftCart E-Commerce Platform', { size: 14, weight: 700 });

  const RX = 92, RY = 25;
  const uc = {
    browse: [302, 104, 'Browse and search\nproducts'],
    view: [302, 172, 'View product details'],
    cart: [302, 240, 'Manage cart'],
    checkout: [302, 340, 'Check out as guest'],
    recover: [302, 470, 'Recover abandoned\ncart'],
    track: [302, 594, 'Track order'],
    save: [302, 682, 'Save details for\nnext time'],
    catalogue: [558, 104, 'Manage catalogue\nand offers'],
    analytics: [558, 172, 'View funnel analytics'],
    promo: [558, 252, 'Apply promo code'],
    address: [558, 330, 'Enter contact and\naddress'],
    delivery: [558, 400, 'Select delivery\nmethod'],
    pay: [558, 470, 'Make payment'],
    notify: [558, 560, 'Send notification\n(email, SMS)']
  };

  // associations (drawn first so ellipses sit on top)
  const shopper = [108, 228];
  ['browse', 'view', 'cart', 'checkout', 'recover', 'track'].forEach((k) => {
    s += line([shopper, [uc[k][0] - RX, uc[k][1]]], { color: 'muted', sw: 1.3 });
  });
  s += line([[108, 640], [uc.save[0] - RX, uc.save[1]]], { color: 'muted', sw: 1.3 });
  s += line([[752, 106], [uc.catalogue[0] + RX, uc.catalogue[1]]], { color: 'muted', sw: 1.3 });
  s += line([[752, 112], [uc.analytics[0] + RX, uc.analytics[1]]], { color: 'muted', sw: 1.3 });
  s += line([[752, 338], [uc.pay[0] + RX - 6, uc.pay[1] - 10]], { color: 'muted', sw: 1.3 });
  s += line([[752, 482], [uc.notify[0] + RX - 4, uc.notify[1] - 8]], { color: 'muted', sw: 1.3 });
  s += line([[752, 644], [uc.track[0] + RX, uc.track[1]]], { color: 'muted', sw: 1.3 });

  // include / extend
  const dep = (a, b, label, lx, ly) => line([a, b], { dash: '6 4', end: 'open', sw: 1.3 }) + tag(lx, ly, label, { size: 11, italic: true, bg: '#FCFCFB' });
  s += dep([392, 336], [466, 331], '«include»', 429, 322);
  s += dep([386, 351], [470, 390], '«include»', 440, 364);
  s += dep([366, 359], [480, 456], '«include»', 408, 408);
  s += dep([478, 265], [374, 324], '«extend»', 424, 284);
  s += dep([558, 495], [558, 534], '«include»', 598, 514);
  s += dep([386, 482], [474, 546], '«include»', 420, 522);

  Object.keys(uc).forEach((k) => { s += ellipse(uc[k][0], uc[k][1], RX, RY, uc[k][2]); });

  // actors
  s += actor(86, 190, 'Shopper');
  s += actor(86, 602, 'Registered\nCustomer');
  s += line([[86, 598], [86, 284]], { end: 'tri' });
  s += actor(776, 68, 'Store Admin');
  s += actor(776, 300, 'Payment\nGateway');
  s += actor(776, 444, 'Notification\nService');
  s += actor(776, 606, 'Courier\nPartner');
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 07 Class diagram ---------- */
F['07-class-diagram'] = () => {
  const W = 1400, H = 742;
  const w = 216;
  const X = [28, 310, 592, 874, 1156];
  const R1 = 20, R2 = 262, R3 = 560;
  const k = {};
  k.customer = classBox(X[0], R1, w, 'Customer', ['- id: UUID', '- fullName: String', '- email: String', '- phone: String', '- isGuest: Boolean'], ['+ saveDetails(): void']);
  k.cart = classBox(X[1], R1, w, 'Cart', ['- id: UUID', '- updatedAt: DateTime', '- promoCode: String'], ['+ addItem(p, qty): void', '+ setQty(p, qty): void', '+ removeItem(id): void', '+ getTotals(): Totals']);
  k.item = classBox(X[2], R1, w, 'CartItem', ['- qty: Integer'], ['+ lineTotal(): Money']);
  k.product = classBox(X[3], R1, w, 'Product', ['- id: String', '- name: String', '- price: Money', '- mrp: Money', '- stock: Integer'], ['+ isInStock(): Boolean', '+ discountPercent(): Integer']);
  k.status = classBox(X[4], R1, w, 'OrderStatus', ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], [], { stereo: 'enumeration', noOps: true });
  k.address = classBox(X[0], R2, w, 'Address', ['- line: String', '- city: String', '- state: String', '- pin: String'], ['+ validate(): Boolean']);
  k.session = classBox(X[1], R2, w, 'CheckoutSession', ['- step: Integer', '- startedAt: DateTime'], ['+ validateStep(n): Boolean', '+ next(): void', '+ placeOrder(): Order']);
  k.order = classBox(X[2], R2, w, 'Order', ['- id: String', '- placedAt: DateTime', '- status: OrderStatus', '- subtotal: Money', '- discount: Money', '- deliveryFee: Money', '- total: Money'], ['+ confirm(): void', '+ cancel(): void']);
  k.oitem = classBox(X[3], R2, w, 'OrderItem', ['- name: String', '- qty: Integer', '- unitPrice: Money'], ['+ lineTotal(): Money']);
  k.delivery = classBox(X[4], R2, w, 'DeliveryOption', ['- id: String', '- label: String', '- fee: Money', '- minDays: Integer', '- maxDays: Integer'], ['+ feeFor(subtotal): Money', '+ estimate(from): DateRange']);
  k.promo = classBox(X[0], R3, w, 'PromoCode', ['- code: String', '- type: PromoType', '- value: Number', '- minSubtotal: Money'], ['+ evaluate(subtotal): Result']);
  k.upi = classBox(X[1], R3, w, 'UpiPayment', ['- upiId: String'], ['+ authorise(): Boolean']);
  k.payment = classBox(X[2], R3, w, 'Payment', ['- id: String', '- amount: Money', '- status: PaymentStatus'], ['+ authorise(): Boolean', '+ refund(): void'], { abstract: true, stereo: 'abstract' });
  k.card = classBox(X[3], R3, w, 'CardPayment', ['- brand: String', '- last4: String'], ['+ authorise(): Boolean']);
  k.cod = classBox(X[4], R3, w, 'CashOnDelivery', ['- collected: Boolean'], ['+ authorise(): Boolean']);

  let s = '';
  const m = (x, y, t, anchor) => text(x, y, t, { size: 11.5, fill: C.muted, anchor: anchor || 'middle', weight: 600 });
  const nm = (x, y, t, anchor) => text(x, y, t, { size: 11.5, fill: C.muted, anchor: anchor || 'middle', italic: true });

  // row 1 horizontals
  s += line([[k.customer.right, 78], [k.cart.x, 78]]) + m(k.customer.right + 8, 68, '1', 'start') + m(k.cart.x - 8, 68, '0..1', 'end') + nm(277, 92, 'owns');
  s += line([[k.cart.right, 70], [k.item.x, 70]], { start: 'dia' }) + m(k.item.x - 8, 60, '1..*', 'end') + nm(565, 84, 'contains');
  s += line([[k.item.right, 62], [k.product.x, 62]], { end: 'open' }) + m(k.item.right + 8, 52, '*', 'start') + m(k.product.x - 12, 52, '1', 'end') + nm(841, 76, 'refers to');
  // verticals between rows 1 and 2
  s += line([[136, k.customer.bottom], [136, R2]]) + m(146, k.customer.bottom + 12, '1', 'start') + m(146, R2 - 10, '*', 'start') + nm(128, 236, 'has', 'end');
  s += line([[418, R2], [418, k.cart.bottom]], { end: 'open' }) + nm(428, 244, 'checks out', 'start');
  s += line([[982, R2], [982, k.product.bottom]], { end: 'open' }) + m(992, R2 - 10, '*', 'start') + m(992, k.product.bottom + 12, '1', 'start') + nm(972, 228, 'copy of', 'end');
  // Customer places Order (one crossing with "checks out")
  s += line([[212, k.customer.bottom], [212, 216], [640, 216], [640, R2]]) + m(222, k.customer.bottom + 12, '1', 'start') + m(650, R2 - 10, '*', 'start') + tag(540, 216, 'places', { size: 11.5, italic: true });
  // row 2 horizontals
  s += line([[k.session.right, 330], [k.order.x, 330]], { dash: '6 4', end: 'open' }) + nm(559, 318, '«creates»');
  s += line([[k.order.right, 320], [k.oitem.x, 320]], { start: 'dia' }) + m(k.oitem.x - 8, 310, '1..*', 'end') + nm(841, 334, 'contains');
  // Order hub: elbows through the gap under row 2
  s += line([[612, k.order.bottom], [612, 500], [136, 500], [136, k.address.bottom]], { end: 'open' }) + tag(380, 500, 'ships to', { size: 11.5, italic: true }) + m(146, k.address.bottom + 14, '1', 'start');
  s += line([[636, k.order.bottom], [636, 528], [196, 528], [196, R3]], { end: 'open' }) + tag(420, 528, 'applies', { size: 11.5, italic: true }) + m(206, R3 - 10, '0..1', 'start');
  s += line([[780, k.order.bottom], [780, 500], [1264, 500], [1264, k.delivery.bottom]], { end: 'open' }) + tag(1030, 500, 'delivered by', { size: 11.5, italic: true }) + m(1274, k.delivery.bottom + 14, '1', 'start');
  s += line([[700, k.order.bottom], [700, R3]], { end: 'open' }) + nm(710, 536, 'paid by', 'start') + m(690, R3 - 10, '1', 'end');
  // generalisation
  s += line([[k.upi.right, 606], [k.payment.x, 606]], { end: 'tri' });
  s += line([[k.card.x, 606], [k.payment.right, 606]], { end: 'tri' });
  s += line([[1264, k.cod.bottom], [1264, 722], [700, 722], [700, k.payment.bottom]], { end: 'tri' });

  Object.keys(k).forEach((n) => { s += k[n].svg; });
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 08 Sequence diagram ---------- */
F['08-sequence-checkout'] = () => {
  const W = 1240;
  const P = [
    ['Shopper', 86], [':Storefront (SPA)', 292], [':CartService', 498], [':OrderService', 704], [':PaymentGateway', 910], [':NotificationService', 1124]
  ];
  const x = P.map((p) => p[1]);
  const step = 27;
  let y = 96;
  let body = '';
  const acts = [];   // activation bars [index, y1, y2]

  const msg = (from, to, label, o) => {
    o = o || {};
    const dir = x[to] > x[from] ? 1 : -1;
    const x1 = x[from] + dir * 6;
    const x2 = x[to] - dir * 6;
    body += line([[x1, y], [x2, y]], { end: o.ret || o.async ? 'open' : 'arrow', dash: o.ret ? '6 4' : null, color: o.ret ? 'muted' : 'ink', sw: 1.4 });
    body += tag((x1 + x2) / 2, y - 10, label, { size: 12.5, fill: o.ret ? C.muted : C.ink });
    y += step;
  };
  const self = (i, label) => {
    body += `<path d="M${x[i] + 6} ${y - 6} h34 v16 h-32" fill="none" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#arrow-ink)"/>`;
    body += text(x[i] + 48, y + 2, label, { size: 12.5, anchor: 'start' });
    y += step + 6;
  };

  msg(0, 1, '1: open cart, tap Checkout');
  msg(1, 2, '2: getCart()');
  msg(2, 1, 'items, total incl. delivery', { ret: true });
  msg(0, 1, '3: enter contact and address');
  self(1, '4: validate each field inline');
  msg(1, 3, '5: lookupPin(pin)');
  msg(3, 1, 'city, state, delivery options with dates', { ret: true });
  msg(0, 1, '6: choose delivery method');
  msg(1, 2, '7: recalculate(delivery)');
  msg(2, 1, 'updated total', { ret: true });
  msg(0, 1, '8: choose UPI, tap Pay');
  msg(1, 3, '9: createOrder(cart, address, delivery)');
  msg(3, 2, '10: reserveStock(items)');
  msg(3, 4, '11: requestPayment(amount)');
  msg(4, 0, '12: collect request in the shopper’s UPI app', { async: true });
  msg(0, 4, '13: approve payment');

  // alt fragment
  const altTop = y - 8;
  y += 22;
  msg(4, 3, '14: paymentStatus(SUCCESS)', { ret: true });
  msg(3, 5, '15: sendConfirmation(order)', { async: true });
  msg(3, 2, '16: clearCart()');
  msg(3, 1, 'orderId, ETA', { ret: true });
  msg(1, 0, '17: show order confirmation', { ret: true });
  const altMid = y - 10;
  y += 22;
  msg(4, 3, 'paymentStatus(FAILED)', { ret: true });
  msg(3, 1, 'error; cart and entered details kept', { ret: true });
  msg(1, 0, 'offer retry, nothing re-typed', { ret: true });
  const altBottom = y - 10;
  const H = altBottom + 34;

  let s = '';
  // lifelines + heads
  P.forEach(([label, px], i) => {
    s += `<path d="M${px} 62 V${H - 14}" stroke="${C.faint}" stroke-width="1.3" stroke-dasharray="5 5"/>`;
    s += rect(px - 82, 20, 164, 42, { fill: i === 0 ? C.white : C.sand, rx: 6 });
    s += text(px, 41, label, { size: 13.5, weight: 700 });
  });
  // activation bars
  [[1, 88, altBottom - 4], [3, 400, altBottom - 30], [4, 458, altMid + 40]].forEach(([i, y1, y2]) => {
    s += rect(x[i] - 6, y1, 12, y2 - y1, { rx: 2, fill: C.white, sw: 1.2 });
  });
  // alt frame
  s += rect(30, altTop, W - 60, altBottom - altTop, { rx: 4, fill: 'none', stroke: C.muted, sw: 1.3 });
  s += `<path d="M30 ${altTop} h46 v15 l-8 8 h-38 Z" fill="${C.sand}" stroke="${C.muted}" stroke-width="1.3"/>` + text(50, altTop + 12, 'alt', { size: 12, weight: 700 });
  s += text(88, altTop + 12, '[payment approved]', { size: 12, anchor: 'start', fill: C.muted, weight: 600 });
  s += `<path d="M30 ${altMid} H${W - 30}" stroke="${C.muted}" stroke-width="1.2" stroke-dasharray="6 4"/>`;
  s += text(40, altMid + 13, '[declined or timed out]', { size: 12, anchor: 'start', fill: C.muted, weight: 600 });
  s += body;
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 09 Activity diagram ---------- */
F['09-activity-checkout'] = () => {
  const W = 820, H = 1080;
  const lanes = [['Shopper', 20, 262], ['SwiftCart storefront', 282, 266], ['Back-end services', 548, 252]];
  const cx = [151, 415, 674];
  const aw = 204, ah = 46;
  let s = '';
  lanes.forEach(([label, lx, lw]) => {
    s += rect(lx, 18, lw, H - 36, { rx: 0, fill: C.white, sw: 1.3 });
    s += rect(lx, 18, lw, 36, { rx: 0, fill: C.sand, sw: 1.3 });
    s += text(lx + lw / 2, 36, label, { size: 14, weight: 700 });
  });
  const A = (lane, y, label) => rect(cx[lane] - aw / 2, y - ah / 2, aw, ah, { rx: 23, fill: C.white }) + text(cx[lane], y, label, { size: 13, weight: 500, lh: 1.2 });
  const arrow = (pts, o) => line(pts, Object.assign({ end: 'arrow', sw: 1.4 }, o || {}));
  const half = ah / 2;

  const y = { start: 84, review: 140, tap: 212, enter: 296, valid: 372, options: 448, total: 524, pay: 602, auth: 680, ok: 756, fork: 826, par: 874, join: 922, done: 978, end: 1036 };

  s += circle(cx[0], y.start, 9, { fill: C.ink });
  s += arrow([[cx[0], y.start + 9], [cx[0], y.review - half]]);
  s += A(0, y.review, 'Review cart: items,\ndelivery charge and total');
  s += arrow([[cx[0], y.review + half], [cx[0], y.tap - half]]);
  s += A(0, y.tap, 'Tap Checkout');
  s += arrow([[cx[0] + aw / 2, y.tap], [cx[1] - aw / 2, y.tap]]);
  s += A(1, y.tap, 'Open checkout page,\nrestore saved details');
  s += arrow([[cx[1], y.tap + half], [cx[1], 254], [cx[0], 254], [cx[0], y.enter - half]]);
  s += A(0, y.enter, 'Enter contact details\nand address');
  s += arrow([[cx[0] + aw / 2, y.enter], [cx[1] - aw / 2, y.enter]]);
  s += A(1, y.enter, 'Validate fields inline,\nauto-fill city from PIN');
  s += arrow([[cx[1], y.enter + half], [cx[1], y.valid - 20]]);
  s += diamond(cx[1], y.valid, 44, 40);
  s += arrow([[cx[1] - 22, y.valid], [cx[0], y.valid], [cx[0], y.enter + half]]);
  s += tag(262, y.valid - 12, '[invalid] message shown beside the field', { size: 11.5 });
  s += arrow([[cx[1], y.valid + 20], [cx[1], y.options - half]]);
  s += tag(cx[1] + 30, y.valid + 32, '[valid]', { size: 11.5 });
  s += A(1, y.options, 'Show delivery options\nwith price and arrival date');
  s += arrow([[cx[1] - aw / 2, y.options], [cx[0] + aw / 2, y.options]]);
  s += A(0, y.options, 'Choose delivery method');
  s += arrow([[cx[0], y.options + half], [cx[0], y.total], [cx[1] - aw / 2, y.total]]);
  s += A(1, y.total, 'Update order total');
  s += arrow([[cx[1], y.total + half], [cx[1], 562], [cx[0], 562], [cx[0], y.pay - half]]);
  s += A(0, y.pay, 'Choose UPI, card or cash\non delivery, then confirm');
  s += arrow([[cx[0] + aw / 2, y.pay], [cx[2] - aw / 2, y.pay]]);
  s += A(2, y.pay, 'Create order and\nreserve stock');
  s += arrow([[cx[2], y.pay + half], [cx[2], y.auth - half]]);
  s += A(2, y.auth, 'Authorise payment\nwith the gateway');
  s += arrow([[cx[2], y.auth + half], [cx[2], y.ok - 20]]);
  s += diamond(cx[2], y.ok, 44, 40);
  s += arrow([[cx[2] - 22, y.ok], [cx[1] + aw / 2, y.ok]]);
  s += tag(548, y.ok - 12, '[declined]', { size: 11.5 });
  s += A(1, y.ok, 'Show retry; keep cart\nand entered details');
  s += arrow([[cx[1] - aw / 2, y.ok], [cx[0], y.ok], [cx[0], y.pay + half]]);
  s += arrow([[cx[2], y.ok + 20], [cx[2], y.fork - 3]]);
  s += tag(cx[2] + 38, y.ok + 34, '[approved]', { size: 11.5 });
  // fork / join
  s += `<rect x="${cx[2] - 104}" y="${y.fork - 3}" width="208" height="6" rx="2" fill="${C.ink}"/>`;
  const pw = 108;
  const px1 = cx[2] - 58, px2 = cx[2] + 58;
  s += arrow([[px1, y.fork + 3], [px1, y.par - 21]]) + arrow([[px2, y.fork + 3], [px2, y.par - 21]]);
  s += rect(px1 - pw / 2, y.par - 21, pw, 42, { rx: 21 }) + text(px1, y.par, 'Send email\nand SMS', { size: 12.5, lh: 1.15 });
  s += rect(px2 - pw / 2, y.par - 21, pw, 42, { rx: 21 }) + text(px2, y.par, 'Update stock,\nclear cart', { size: 12.5, lh: 1.15 });
  s += arrow([[px1, y.par + 21], [px1, y.join - 3]]) + arrow([[px2, y.par + 21], [px2, y.join - 3]]);
  s += `<rect x="${cx[2] - 104}" y="${y.join - 3}" width="208" height="6" rx="2" fill="${C.ink}"/>`;
  s += arrow([[cx[2], y.join + 3], [cx[2], y.done], [cx[1] + aw / 2, y.done]]);
  s += A(1, y.done, 'Show order confirmation\nwith order number and ETA');
  s += arrow([[cx[1], y.done + half], [cx[1], y.end - 13]]);
  s += circle(cx[1], y.end, 12, { fill: C.white }) + circle(cx[1], y.end, 7, { fill: C.ink });
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 10 State machine: order lifecycle ---------- */
F['10-state-order'] = () => {
  const W = 820, H = 790;
  const sw = 184, sh = 50;
  const mx = 384;           // main column centre
  let s = '';
  const S = (cx, y, name, sub) => rect(cx - sw / 2, y, sw, sh, { rx: 14, fill: C.white }) +
    text(cx, y + (sub ? 17 : sh / 2), name, { size: 13.5, weight: 700 }) +
    (sub ? text(cx, y + 35, sub, { size: 11, fill: C.muted }) : '');
  const arrow = (pts, o) => line(pts, Object.assign({ end: 'arrow', sw: 1.4 }, o || {}));
  const lab = (x, y, t, anchor) => tag(x, y, t, { size: 11.5, anchor: anchor || 'start' });

  const Y = { created: 70, pending: 180, confirmed: 290, packed: 400, shipped: 510, delivered: 620 };
  // main flow
  s += circle(mx, 34, 9, { fill: C.ink });
  s += arrow([[mx, 43], [mx, Y.created]]) + lab(mx + 12, 56, 'order submitted');
  s += arrow([[mx, Y.created + sh], [mx, Y.pending]]) + lab(mx + 12, 150, '[prepaid] / request payment');
  s += arrow([[mx, Y.pending + sh], [mx, Y.confirmed]]) + lab(mx + 12, 260, 'payment authorised\n/ send confirmation');
  s += arrow([[mx, Y.confirmed + sh], [mx, Y.packed]]) + lab(mx + 12, 370, 'items picked');
  s += arrow([[mx, Y.packed + sh], [mx, Y.shipped]]) + lab(mx + 12, 480, 'handed to courier');
  s += arrow([[mx, Y.shipped + sh], [mx, Y.delivered]]) + lab(mx + 12, 590, 'delivery confirmed');
  s += arrow([[mx, Y.delivered + sh], [mx, 733]]) + lab(mx + 12, 700, 'return window closed');
  s += circle(mx, 746, 12, { fill: C.white }) + circle(mx, 746, 7, { fill: C.ink });

  // cash-on-delivery bypass on the right
  s += arrow([[mx + sw / 2, Y.created + 18], [590, Y.created + 18], [590, Y.confirmed + 14], [mx + sw / 2, Y.confirmed + 14]]);
  s += lab(602, 200, '[cash on delivery]\n/ send confirmation');

  // payment failure and cancellation on the left
  const lx = 104;
  s += arrow([[mx - sw / 2, Y.pending + 16], [lx + sw / 2, Y.pending + 16]]) + tag(244, Y.pending + 4, 'declined', { size: 11.5 });
  s += arrow([[lx + sw / 2, Y.pending + 36], [mx - sw / 2, Y.pending + 36]]) + tag(244, Y.pending + 48, 'retry', { size: 11.5 });
  s += arrow([[lx, Y.pending + sh], [lx, Y.confirmed]]) + lab(lx + 12, 260, '3 failed attempts\nor 15 min timeout', 'start');
  s += arrow([[mx - sw / 2, Y.confirmed + 25], [lx + sw / 2, Y.confirmed + 25]]) + tag(244, Y.confirmed + 13, 'cancel', { size: 11.5 }) + tag(244, Y.confirmed + 38, '[before packing]', { size: 11 });
  s += arrow([[lx, Y.confirmed + sh], [lx, 393]]);
  s += circle(lx, 406, 12, { fill: C.white }) + circle(lx, 406, 7, { fill: C.ink });

  // returns on the right
  const rx = 708;
  s += arrow([[mx + sw / 2, Y.delivered + 25], [rx - sw / 2, Y.delivered + 25]]) + tag(546, Y.delivered + 6, 'return requested\n[within 7 days]', { size: 11.5 });
  s += arrow([[rx, Y.delivered + sh], [rx, 721]]) + lab(rx + 12, 697, 'item received');
  s += arrow([[rx - sw / 2, 746], [mx + 13, 746]]);

  s += S(mx, Y.created, 'Created', 'entry / reserve stock');
  s += S(mx, Y.pending, 'Payment Pending');
  s += S(mx, Y.confirmed, 'Confirmed');
  s += S(mx, Y.packed, 'Packed');
  s += S(mx, Y.shipped, 'Shipped', 'do / track shipment');
  s += S(mx, Y.delivered, 'Delivered');
  s += S(lx, Y.pending, 'Payment Failed');
  s += S(lx, Y.confirmed, 'Cancelled', 'entry / release stock, refund');
  s += S(rx, Y.delivered, 'Return Requested');
  s += S(rx, 721, 'Refunded');
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 16 Object diagram: one placed order ---------- */
F['16-object-diagram'] = () => {
  const W = 960, H = 540;
  const lh = 17;
  let s = '';
  // UML object: underlined "name : Class" heading, then attribute values.
  const obj = (x, y, w, title, attrs) => {
    const head = 28;
    const h = head + attrs.length * lh + 12;
    const tw0 = L.tw(title, 13, 700);
    let o = rect(x, y, w, h, { rx: 4, fill: C.white });
    o += `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${head - 1}" rx="3" fill="${C.sand}"/>`;
    o += `<path d="M${x} ${y + head} h${w}" stroke="${C.ink}" stroke-width="1.2"/>`;
    o += text(x + w / 2, y + head / 2, title, { size: 13, weight: 700 });
    o += `<path d="M${(x + w / 2 - tw0 / 2).toFixed(1)} ${y + head / 2 + 9} h${tw0.toFixed(1)}" stroke="${C.ink}" stroke-width="1"/>`;
    attrs.forEach((a, i) => { o += text(x + 9, y + head + 6 + lh / 2 + i * lh, a, { size: 12, anchor: 'start' }); });
    return o;
  };
  const link = (pts) => line(pts, { sw: 1.3 });
  const lab = (x, y, t, anchor) => text(x, y, t, { size: 12, italic: true, fill: C.muted, anchor: anchor || 'middle' });

  // links first, so the boxes sit on top
  s += link([[280, 75], [420, 75], [420, 180]]) + lab(350, 64, 'places');
  s += link([[560, 180], [560, 75], [680, 75]]) + lab(620, 64, 'contains');
  s += link([[600, 200], [680, 200]]) + lab(640, 189, 'contains');
  s += link([[600, 305], [680, 305]]) + lab(640, 294, 'delivered by');
  s += link([[360, 250], [280, 250]]) + lab(320, 239, 'ships to');
  s += link([[480, 322], [480, 420]]) + lab(490, 372, 'paid by', 'start');
  s += link([[360, 300], [320, 300], [320, 465], [280, 465]]) + lab(312, 384, 'applies', 'end');

  s += obj(30, 30, 250, 'riya : Customer', ['fullName = "Riya Sharma"', 'email = "riya.sharma@example.com"', 'isGuest = true']);
  s += obj(30, 196, 250, 'addr1 : Address', ['line = "14, 2nd Cross, Indiranagar"', 'city = "Bengaluru"', 'state = "Karnataka"', 'pin = "560001"']);
  s += obj(30, 420, 250, 'welcome10 : PromoCode', ['code = "WELCOME10"', 'type = percent', 'value = 10 (max ₹500)']);
  s += obj(360, 180, 240, 'order1 : Order', ['id = "SC-482913"', 'status = CONFIRMED', 'subtotal = ₹7,398', 'discount = ₹500', 'deliveryFee = ₹0', 'total = ₹6,898']);
  s += obj(360, 420, 240, 'pay1 : UpiPayment', ['upiId = "demo@upi"', 'amount = ₹6,898', 'status = SUCCESS']);
  s += obj(680, 30, 250, 'item1 : OrderItem', ['name = "Aura Wireless Headphones"', 'qty = 1', 'unitPrice = ₹6,499']);
  s += obj(680, 150, 250, 'item2 : OrderItem', ['name = "Ember Ceramic Mug Set"', 'qty = 1', 'unitPrice = ₹899']);
  s += obj(680, 280, 250, 'standard : DeliveryOption', ['label = "Standard delivery"', 'fee = ₹79 (free from ₹999)', 'eta = 3 to 5 working days']);
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 17 Collaboration (communication) diagram: placing an order in the prototype ---------- */
F['17-collaboration-order'] = () => {
  const W = 1000, H = 500;
  const bw = 180, bh = 58;
  let s = '';
  const obj = (x, y, name, file) => rect(x, y, bw, bh, { rx: 4, fill: C.sand }) +
    text(x + bw / 2, y + 22, name, { size: 13.5, weight: 700 }) + text(x + bw / 2, y + 41, file, { size: 11, fill: C.muted });
  const link = (pts) => line(pts, { sw: 1.3, color: 'muted' });
  // message label with a short arrow showing its direction
  const msg = (x, y, label, dir, anchor) => {
    const n = String(label).split('\n').length;
    const top = y - (n * 12.5 * 1.28) / 2 - 8;
    const a = { r: [[x, top], [x + 24, top]], l: [[x + 24, top], [x, top]], u: [[x, top + 12], [x, top - 10]], d: [[x, top - 10], [x, top + 12]] }[dir];
    const ax = anchor === 'end' ? x - 4 : x;
    return line(a, { end: 'arrow', sw: 1.4 }) + text(ax, y + 6, label, { size: 12.5, anchor: anchor || 'start', lh: 1.28 });
  };

  const A = 200, B = 520, Cx = 800;          // column x positions
  const top = 40, mid = 210, low = 400;      // row y positions
  // links
  s += link([[95, mid + 29], [A, mid + 29]]);
  s += link([[70, 300], [70, low + 29], [A, low + 29]]);
  s += link([[A + bw / 2, mid], [A + bw / 2, top + bh]]);
  s += link([[A + bw, mid + 29], [B, mid + 29]]);
  s += link([[A + bw / 2, mid + bh], [A + bw / 2, low]]);
  s += link([[B + bw / 2, mid], [B + bw / 2, top + bh]]);
  s += link([[B + bw, mid + 29], [Cx, mid + 29]]);
  s += link([[A + bw, low + 29], [B, low + 29]]);
  s += link([[B + bw / 2, low], [B + bw / 2, mid + bh]]);

  // messages
  s += msg(104, mid + 2, '1: place order', 'r');
  s += msg(82, 362, '2: open\n"My orders"', 'd');
  s += msg(A + bw / 2 + 12, 150, '1.1: validateStep(3)\n1.2: computeTotals(cart)\n1.3: generateOrderId()', 'u');
  s += msg(A + bw + 12, mid + 72, '1.4: set(orders,\ncart: [ ])', 'r');
  s += msg(A + bw / 2 + 12, 335, '1.5: go to\n#/order/{id}', 'd');
  s += msg(B + bw / 2 + 12, 150, '1.4.1: setItem(\n"swiftcart:v1")', 'u');
  s += msg(B + bw + 12, mid + 62, '1.4.2:\nrenderCart()', 'r');
  s += msg(A + bw + 12, low - 10, '1.5.1: viewOrder(id)\n2.1: viewOrders()', 'r');
  s += msg(B + bw / 2 + 12, 335, '1.5.1.1, 2.1.1:\nread orders', 'u');

  // objects
  s += actor(70, mid - 20, 'Shopper');
  s += obj(A, top, ':CoreRules', 'js/core.js');
  s += obj(A, mid, ':CheckoutView', 'js/app.js');
  s += obj(A, low, ':Router', 'js/app.js');
  s += obj(B, top, ':localStorage', 'browser');
  s += obj(B, mid, ':Store', 'js/store.js');
  s += obj(B, low, ':OrderViews', 'js/app.js');
  s += obj(Cx, mid, ':CartDrawer', 'js/app.js');
  return { w: W, h: H, svg: svg(W, H, s) };
};

module.exports = F;
