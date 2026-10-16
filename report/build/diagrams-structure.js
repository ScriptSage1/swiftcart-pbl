// Structural figures: component, deployment, DFD level 0 and 1, architecture style.
'use strict';
const L = require('./diagram-kit.js');
const { C, text, tag, rect, box, ellipse, circle, line, component, node3d, chip, svg } = L;

const F = {};

/* ---------- 11 Component diagram ---------- */
F['11-component'] = () => {
  const W = 1240, H = 640;
  let s = '';
  const dep = (pts, label, lx, ly, o) => line(pts, Object.assign({ dash: '6 4', end: 'open', sw: 1.4 }, o || {})) + (label ? tag(lx, ly, label, { size: 11.5, italic: true }) : '');

  // client side
  s += rect(30, 150, 290, 250, { rx: 8, fill: '#FCFCFB' });
  s += text(175, 172, '«web application»', { size: 11, fill: C.muted }) + text(175, 190, 'Storefront SPA', { size: 14, weight: 700 });
  [['Catalogue UI', 0], ['Cart drawer', 1], ['Checkout UI', 2], ['Order confirmation', 3]].forEach(([label, i]) => {
    s += component(52, 208 + i * 46, 246, 38, label, { size: 12.5 });
  });
  s += component(60, 480, 230, 62, 'Content delivery network', { stereo: 'CDN', fill: C.sand });
  s += dep([[175, 400], [175, 480]], 'loads static assets', 245, 440);

  // gateway
  s += component(400, 40, 500, 60, 'API Gateway', { stereo: 'gateway', fill: C.sand });
  s += dep([[175, 150], [175, 70], [400, 70]], 'REST / JSON over HTTPS', 270, 58);

  // services
  s += rect(385, 140, 530, 312, { rx: 8, fill: '#FCFCFB' });
  s += text(650, 160, '«subsystem»  Application services', { size: 12.5, fill: C.muted, weight: 600 });
  const col = [402, 656];
  const rowY = [176, 244, 312, 380];
  const grid = [
    ['Catalogue Service', 'Analytics Service'],
    ['Cart Service', 'Payment Service'],
    ['Checkout and Order Service', 'Delivery Service'],
    ['Promotion Service', 'Notification Service']
  ];
  grid.forEach((pair, r) => pair.forEach((label, c) => { s += component(col[c], rowY[r], 242, 56, label, { size: 12.5 }); }));
  s += dep([[650, 100], [650, 140]], 'routes requests', 715, 120);

  // data stores
  s += rect(385, 494, 530, 116, { rx: 8, fill: '#FCFCFB' });
  s += text(650, 514, '«subsystem»  Data stores', { size: 12.5, fill: C.muted, weight: 600 });
  [['Product DB', 'PostgreSQL', 402], ['Cart and catalogue cache', 'Redis', 572], ['Order DB', 'PostgreSQL', 742]].forEach(([label, kind, x]) => {
    s += component(x, 530, 158, 64, label, { stereo: kind, size: 12 });
  });
  s += dep([[650, 452], [650, 494]], 'read / write', 706, 473);

  // external systems
  const ext = [['Payment gateway (UPI, card)', 244], ['Courier partner API', 312], ['Email and SMS provider', 380]];
  ext.forEach(([label, y]) => {
    s += component(990, y, 222, 56, label, { stereo: 'external', dash: '6 4', size: 12.5 });
    s += dep([[898, y + 28], [990, y + 28]], '', 0, 0);
  });
  s += tag(944, 258, 'HTTPS', { size: 11.5, italic: true });
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 12 Deployment diagram ---------- */
F['12-deployment'] = () => {
  const W = 820, H = 690;
  let s = '';
  const link = (pts, label, lx, ly) => line(pts, { sw: 1.4 }) + (label ? tag(lx, ly, label, { size: 11.5 }) : '');

  // cloud region (behind everything else)
  s += rect(24, 262, 772, 404, { rx: 10, fill: '#FCFCFB', stroke: C.faint, dash: '7 5', sw: 1.3 });
  s += text(40, 284, '«cloud region»  Application hosting (auto-scaled)', { size: 12.5, fill: C.muted, weight: 600, anchor: 'start' });

  // connectors
  s += link([[150, 170], [150, 322]], 'HTTPS (API calls)', 150, 226);
  s += link([[270, 96], [330, 96]], 'HTTPS', 300, 82);
  s += link([[440, 170], [440, 316]], 'origin pull', 440, 226);
  s += link([[150, 408], [150, 522], [316, 522]], 'HTTP', 232, 510);
  s += link([[544, 490], [612, 474]], 'TCP 5432', 584, 512);
  s += link([[544, 548], [612, 580]], 'TCP 6379', 576, 586);
  s += link([[316, 566], [256, 598]], '', 0, 0);
  s += link([[544, 466], [578, 466], [578, 214], [690, 214], [690, 170]], 'HTTPS, webhooks', 640, 200);

  // outside the region
  s += node3d(40, 50, 218, 120, { stereo: 'device', title: 'Shopper phone or laptop' });
  s += chip(58, 100, 182, 54, 'Web browser\nSwiftCart SPA (HTML, CSS, JS)', { size: 11.5 });
  s += node3d(330, 50, 218, 120, { stereo: 'edge network', title: 'CDN' });
  s += chip(348, 100, 182, 54, 'Cached static bundle\nand product images', { size: 11.5 });
  s += node3d(600, 50, 180, 120, { stereo: 'external', title: 'Third-party services', side: C.sand });
  s += chip(614, 96, 152, 62, 'Payment gateway\nCourier API\nEmail and SMS', { size: 11.5 });

  // inside the region
  s += node3d(56, 322, 188, 86, { stereo: 'load balancer', title: 'HTTPS load balancer' });
  s += chip(72, 366, 156, 30, 'TLS termination', { size: 11.5 });
  s += node3d(316, 328, 216, 76, { stereo: 'object storage', title: 'Asset bucket' });
  s += text(424, 384, 'SPA bundle, product images', { size: 11.5, fill: C.muted });
  s += node3d(316, 456, 216, 118, { stereo: 'container cluster', title: 'App servers × N' });
  s += chip(332, 500, 184, 60, 'API gateway\nApplication services', { size: 11.5 });
  s += node3d(612, 436, 164, 76, { stereo: 'managed database', title: 'PostgreSQL' });
  s += text(694, 492, 'primary + read replica', { size: 11.5, fill: C.muted });
  s += node3d(612, 552, 164, 68, { stereo: 'cache', title: 'Redis' });
  s += text(694, 604, 'carts, catalogue cache', { size: 11.5, fill: C.muted });
  s += node3d(56, 564, 188, 72, { stereo: 'monitoring', title: 'Logs and metrics' });
  s += text(150, 620, 'funnel events, alerts', { size: 11.5, fill: C.muted });
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 13 DFD level 0 (context) ---------- */
F['13-dfd-level0'] = () => {
  const W = 820, H = 600;
  const cx = 410, cy = 300;
  let s = '';
  const flow = (a, b, label, lx, ly) => line([a, b], { end: 'arrow', sw: 1.4 }) + tag(lx, ly, label, { size: 11.5 });
  const entity = (x, y, w, h, label) => rect(x, y, w, h, { rx: 0, fill: C.sand }) + text(x + w / 2, y + h / 2, label, { size: 13.5, weight: 700 });

  // shopper
  s += flow([170, 282], [322, 282], 'search, cart updates,\naddress, payment choice', 246, 258);
  s += flow([322, 318], [170, 318], 'product lists, full total,\nconfirmation, order status', 246, 344);
  // admin
  s += flow([392, 86], [392, 214], 'catalogue and\nprice updates', 338, 150);
  s += flow([428, 214], [428, 86], 'sales and\nfunnel reports', 478, 150);
  // payment
  s += flow([488, 258], [650, 210], 'payment request', 548, 206);
  s += flow([650, 236], [496, 282], 'payment status', 612, 286);
  // courier
  s += flow([496, 318], [650, 364], 'shipment request', 612, 316);
  s += flow([650, 390], [488, 342], 'tracking updates', 548, 398);
  // notification
  s += flow([410, 388], [410, 514], 'confirmation and\nreminder messages', 410, 450);

  s += circle(cx, cy, 88, { fill: C.greenSoft, stroke: C.green, sw: 2 });
  s += text(cx, cy - 34, '0', { size: 13, weight: 700, fill: C.green });
  s += text(cx, cy + 4, 'SwiftCart\nE-Commerce\nSystem', { size: 15, weight: 700, lh: 1.25 });

  s += entity(30, 270, 140, 60, 'Shopper');
  s += entity(340, 30, 140, 56, 'Store Admin');
  s += entity(650, 196, 150, 56, 'Payment Gateway');
  s += entity(650, 350, 150, 56, 'Courier Partner');
  s += entity(330, 514, 160, 56, 'Email / SMS Provider');
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 14 DFD level 1 ---------- */
F['14-dfd-level1'] = () => {
  const W = 1240, H = 800;
  let s = '';
  const flow = (pts, label, lx, ly, o) => line(pts, Object.assign({ end: 'arrow', sw: 1.4 }, o || {})) + (label ? tag(lx, ly, label, { size: 11.5 }) : '');
  const entity = (x, y, w, h, label) => rect(x, y, w, h, { rx: 0, fill: C.sand }) + text(x + w / 2, y + h / 2, label, { size: 13.5, weight: 700, lh: 1.25 });
  const proc = (cx, cy, n, label) => circle(cx, cy, 54, { fill: C.greenSoft, stroke: C.green, sw: 1.8 }) +
    text(cx, cy - 30, n, { size: 12, weight: 700, fill: C.green }) + text(cx, cy + 5, label, { size: 13, weight: 700, lh: 1.2 });
  const store = (x, y, w, id, label) => `<path d="M${x + w} ${y} H${x} V${y + 34} H${x + w}" fill="${C.white}" stroke="${C.ink}" stroke-width="1.5"/>` +
    `<path d="M${x + 36} ${y} V${y + 34}" stroke="${C.ink}" stroke-width="1.5"/>` +
    text(x + 18, y + 17, id, { size: 12, weight: 700 }) + text(x + 46, y + 17, label, { size: 12.5, anchor: 'start' });

  const px = 340;                       // process column
  const py = [120, 280, 440, 600];
  const sx = 540, swid = 190;           // data store column

  /* flows (drawn first) */
  // shopper <-> processes
  [[0, 'search text, filters', 'products and prices'], [1, 'items to add or change', 'cart with full total'],
    [2, 'contact, address,\ndelivery choice', 'delivery options\nwith dates'], [3, 'payment method', 'payment result']].forEach(([i, a, b]) => {
    const y = py[i];
    s += flow([[150, y - 14], [px - 53, y - 14]], a, 218, y - 32 - (a.includes('\n') ? 6 : 0));
    s += flow([[px - 53, y + 14], [150, y + 14]], b, 218, y + 32 + (b.includes('\n') ? 6 : 0));
  });
  // process chain
  s += flow([[px, py[0] + 54], [px, py[1] - 54]], 'chosen product', px + 52, 200);
  s += flow([[px, py[1] + 54], [px, py[2] - 54]], 'cart contents', px + 46, 360);
  s += flow([[px, py[2] + 54], [px, py[3] - 54]], 'order draft, amount', px + 62, 520);
  // data stores
  s += flow([[sx, 112], [px + 54, 112]], 'product data', 468, 100);
  s += flow([[sx + 30, 137], [sx + 30, 232], [px + 46, 252]], 'price, stock', 506, 216);
  s += flow([[px + 54, 280], [sx, 280]], '', 0, 0, { start: 'arrow' }); s += tag(468, 268, 'cart', { size: 11.5 });
  s += flow([[px + 54, 440], [sx, 440]], '', 0, 0, { start: 'arrow' }); s += tag(468, 428, 'saved details', { size: 11.5 });
  s += flow([[px + 54, 600], [sx, 600]], 'paid order', 468, 588);
  // payment gateway
  s += flow([[px - 16, py[3] + 52], [px - 16, 714]], 'payment\nrequest', px - 58, 688);
  s += flow([[px + 16, 714], [px + 16, py[3] + 52]], 'payment\nstatus', px + 56, 688);
  // D4 -> P5, P5 <-> courier
  s += flow([[sx + swid, 608], [836, 608]], 'confirmed order', 783, 620);
  s += flow([[942, 586], [1070, 586]], 'shipment request', 1006, 574);
  s += flow([[1070, 614], [942, 614]], 'tracking updates', 1006, 628);
  // P5 -> shopper along the bottom
  s += flow([[890, 654], [890, 772], [90, 772], [90, 662]], 'order confirmation and delivery status (email, SMS)', 560, 772);
  // P5 -> D1 stock update (right-hand channel)
  s += flow([[934, 570], [1010, 500], [1224, 500], [1224, 56], [690, 56], [690, 103]], 'stock update', 960, 56);
  // admin and P6
  s += flow([[1070, 356], [944, 356]], 'catalogue and\nprice updates', 1008, 330);
  s += flow([[944, 384], [1070, 384]], 'sales and\nfunnel reports', 1008, 410);
  s += flow([[866, 322], [866, 130], [sx + swid, 130]], 'product records', 796, 142);
  s += flow([[sx + swid, 592], [780, 592], [780, 384], [836, 378]], '', 0, 0) + tag(772, 480, 'order data', { size: 11.5, anchor: 'end' });

  /* shapes */
  s += entity(30, 80, 120, 582, 'Shopper');
  s += proc(px, py[0], '1.0', 'Browse\ncatalogue');
  s += proc(px, py[1], '2.0', 'Manage\ncart');
  s += proc(px, py[2], '3.0', 'Capture\ncheckout\ndetails');
  s += proc(px, py[3], '4.0', 'Place order\nand pay');
  s += proc(890, 600, '5.0', 'Fulfil order\nand notify');
  s += proc(890, 370, '6.0', 'Manage\ncatalogue,\nreport');
  s += store(sx, 103, swid, 'D1', 'Products');
  s += store(sx, 263, swid, 'D2', 'Carts');
  s += store(sx, 423, swid, 'D3', 'Customers, addresses');
  s += store(sx, 583, swid, 'D4', 'Orders');
  s += entity(270, 714, 140, 46, 'Payment Gateway');
  s += entity(1070, 340, 140, 60, 'Store Admin');
  s += entity(1070, 570, 140, 60, 'Courier\nPartner');
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 15 Architecture style ---------- */
F['15-architecture'] = () => {
  const W = 820, H = 706;
  let s = '';
  const lx = 24, lw = 618;
  const layer = (y, h, tier, name, items, map, fill) => {
    let out = rect(lx, y, lw, h, { rx: 10, fill: fill || C.white });
    out += text(lx + 16, y + 20, tier, { size: 11, weight: 700, fill: C.muted, anchor: 'start', spacing: '0.07em' });
    out += text(lx + 16, y + 40, name, { size: 14.5, weight: 700, anchor: 'start' });
    const cw = (lw - 32 - (items.length - 1) * 8) / items.length;
    items.forEach((it, i) => { out += chip(lx + 16 + i * (cw + 8), y + 56, cw, h - 70, it, { fill: C.white, stroke: C.rule, size: 11.5 }); });
    if (map) out += text(lx + lw - 16, y + 20, 'Prototype: ' + map, { size: 11.5, fill: C.green, anchor: 'end', weight: 600 });
    return out;
  };
  const conn = (y, label) => line([[lx + lw / 2, y], [lx + lw / 2, y + 30]], { end: 'arrow', start: 'arrow', sw: 1.4 }) + tag(lx + lw / 2 + 90, y + 15, label, { size: 11.5 });

  s += text(lx, 22, 'CLIENT TIER', { size: 11.5, weight: 700, anchor: 'start', spacing: '0.08em', fill: C.green });
  s += layer(36, 108, 'LAYER 1', 'Presentation layer: Storefront SPA', ['Catalogue', 'Product page', 'Cart drawer', 'Checkout', 'Confirmation'], 'app.js, ui.js, styles.css', C.greenSoft);
  s += conn(144, 'HTTPS, REST / JSON');
  s += text(lx, 190, 'APPLICATION TIER', { size: 11.5, weight: 700, anchor: 'start', spacing: '0.08em', fill: C.green });
  s += layer(202, 102, 'LAYER 2', 'API layer: gateway', ['Routing', 'Rate limiting', 'Input validation', 'Session and auth'], '', C.sand);
  s += layer(314, 108, 'LAYER 3', 'Service layer: application services', ['Catalogue', 'Cart', 'Checkout\nand order', 'Payment', 'Delivery', 'Promotion', 'Notification'], 'store.js', C.sand);
  s += layer(432, 102, 'LAYER 4', 'Domain layer: business rules', ['Pricing and totals', 'Validation rules', 'Promo engine', 'Order state machine'], 'core.js', C.sand);
  s += conn(534, 'repositories, cache-aside');
  s += text(lx, 580, 'DATA TIER', { size: 11.5, weight: 700, anchor: 'start', spacing: '0.08em', fill: C.green });
  s += layer(592, 100, 'LAYER 5', 'Data layer', ['PostgreSQL', 'Redis cache', 'Object storage', 'Event log'], 'data.js, localStorage', C.blueSoft);

  // cross-cutting column
  const cxx = 662, cw = 134;
  s += rect(cxx, 36, cw, 656, { rx: 10, fill: C.white, dash: '6 4', stroke: C.muted, sw: 1.3 });
  s += text(cxx + cw / 2, 58, 'CROSS-CUTTING', { size: 11, weight: 700, fill: C.muted, spacing: '0.07em' });
  [['Security', 'TLS everywhere,\ntokenised payments,\nno card data stored', 80],
    ['Performance', 'CDN, caching,\nlazy loading,\nperformance budget', 232],
    ['Observability', 'Funnel analytics,\nlogs, alerts', 384],
    ['Integration', 'Payment gateway,\ncourier API,\nemail and SMS', 540]].forEach(([title, body, y]) => {
    s += rect(cxx + 10, y, cw - 20, 132, { rx: 8, fill: C.sand, stroke: C.rule, sw: 1.2 });
    s += text(cxx + cw / 2, y + 22, title, { size: 13, weight: 700 });
    s += text(cxx + cw / 2, y + 78, body, { size: 11.5, fill: C.muted, lh: 1.35 });
  });
  return { w: W, h: H, svg: svg(W, H, s) };
};

module.exports = F;
