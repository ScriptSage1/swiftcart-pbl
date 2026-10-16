// Analysis and planning figures: feedback chart, priority matrix, story map, workflows.
'use strict';
const L = require('./diagram-kit.js');
const { C, text, tag, rect, box, circle, line, svg, esc } = L;

const F = {};

/* ---------- 01 Feedback themes (bar chart) ---------- */
F['01-feedback-themes'] = () => {
  const W = 820;
  const rows = [
    ['Slow page loads and site performance', 132, 'perf'],
    ['Unexpected delivery or extra costs at checkout', 96, 'chk'],
    ['Forced to create an account before checkout', 71, 'chk'],
    ['Checkout too long or complicated', 63, 'chk'],
    ['Cart not saved between visits', 44, 'chk'],
    ['Too few payment options, or payment failed', 38, 'chk'],
    ['Hard to use on a mobile phone', 29, 'perf'],
    ['Unclear delivery dates or returns policy', 17, 'chk'],
    ['Other', 10, 'other']
  ];
  const total = rows.reduce((s, r) => s + r[1], 0);
  const fill = { perf: '#2a78d6', chk: '#eb6834', other: '#9aa1ab' };
  const x0 = 338;
  const perPct = 12.4;            // px per percentage point
  const top = 78;
  const step = 38;
  let s = '';

  // legend
  const legend = [['perf', 'Performance and usability'], ['chk', 'Cart and checkout friction'], ['other', 'Other']];
  let lx = 24;
  legend.forEach(([k, label]) => {
    s += `<rect x="${lx}" y="22" width="12" height="12" rx="3" fill="${fill[k]}"/>` + text(lx + 19, 28, label, { size: 13, anchor: 'start', fill: C.muted });
    lx += 19 + L.tw(label, 13) + 26;
  });
  s += text(W - 24, 28, 'n = ' + total + ' coded feedback items', { size: 13, anchor: 'end', fill: C.muted });

  // grid
  [0, 10, 20, 30].forEach((p) => {
    const x = x0 + p * perPct;
    s += `<path d="M${x} ${top - 12} V${top + rows.length * step - 6}" stroke="${p === 0 ? C.faint : '#E6E8EB'}" stroke-width="1"/>`;
    s += text(x, top + rows.length * step + 8, p + '%', { size: 12, fill: C.muted });
  });

  rows.forEach(([label, n, k], i) => {
    const y = top + i * step;
    const pct = (n / total) * 100;
    const w = pct * perPct;
    s += text(x0 - 12, y + 10, label, { size: 13.5, anchor: 'end' });
    s += `<path d="M${x0} ${y} h${w - 4} a4 4 0 0 1 4 4 v12 a4 4 0 0 1 -4 4 h${-(w - 4)} Z" fill="${fill[k]}"/>`;
    s += text(x0 + w + 9, y + 10, n + '  (' + pct.toFixed(1) + '%)', { size: 13, anchor: 'start', weight: 600 });
  });
  const H = top + rows.length * step + 30;
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 02 Impact / effort matrix ---------- */
F['02-priority-matrix'] = () => {
  const W = 820, H = 560;
  const px = 70, py = 40, pw = 470, ph = 440;            // plot area
  const items = [
    ['A', 'Guest checkout', 2.4, 9.2],
    ['B', 'Delivery cost and total shown in cart', 1.5, 8.2],
    ['C', 'Three-step checkout with fewer fields', 4.1, 8.9],
    ['D', 'Cart saved between visits', 2.9, 6.9],
    ['E', 'Skeleton loading and lazy images', 3.9, 7.6],
    ['F', 'Inline validation and PIN auto-fill', 3.3, 5.8],
    ['G', 'UPI, card and cash on delivery', 6.1, 7.5],
    ['H', 'CDN, caching and query tuning', 7.7, 8.9],
    ['I', 'Mobile-optimised checkout', 5.6, 6.3],
    ['J', 'Abandoned-cart reminders', 6.7, 5.5],
    ['K', 'Promo codes', 2.3, 3.4],
    ['L', 'Order tracking page', 4.2, 2.5],
    ['M', 'Personalised recommendations', 8.3, 3.3],
    ['N', 'Loyalty programme', 7.0, 1.9]
  ];
  const X = (e) => px + (e / 10) * pw;
  const Y = (i) => py + ph - (i / 10) * ph;
  let s = '';
  const quad = [
    [px, py, C.greenSoft, 'QUICK WINS', 'Do first'],
    [px + pw / 2, py, C.blueSoft, 'MAJOR PROJECTS', 'Plan and schedule'],
    [px, py + ph / 2, C.grey, 'FILL-INS', 'If capacity allows'],
    [px + pw / 2, py + ph / 2, C.amberSoft, 'RECONSIDER', 'Defer']
  ];
  quad.forEach(([x, y, fill, title, sub]) => {
    s += `<rect x="${x}" y="${y}" width="${pw / 2}" height="${ph / 2}" fill="${fill}"/>`;
    s += text(x + 12, y + 18, title, { size: 11.5, weight: 700, anchor: 'start', spacing: '0.06em', fill: C.muted });
    s += text(x + 12, y + 34, sub, { size: 12, anchor: 'start', fill: C.muted });
  });
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  s += `<path d="M${px + pw / 2} ${py} v${ph} M${px} ${py + ph / 2} h${pw}" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 4"/>`;
  // axes
  s += text(px + pw / 2, py + ph + 34, 'Effort to deliver', { size: 13.5, weight: 600 });
  s += text(px, py + ph + 16, 'Low', { size: 12, fill: C.muted, anchor: 'start' }) + text(px + pw, py + ph + 16, 'High', { size: 12, fill: C.muted, anchor: 'end' });
  s += text(26, py + ph / 2, 'Impact on abandonment and speed', { size: 13.5, weight: 600, rotate: -90 });
  s += text(52, py + ph, 'Low', { size: 12, fill: C.muted, rotate: -90 }) + text(52, py + 14, 'High', { size: 12, fill: C.muted, rotate: -90 });

  items.forEach(([id, , e, i]) => {
    s += circle(X(e), Y(i), 13, { fill: C.ink, stroke: C.white, sw: 2 }) + text(X(e), Y(i), id, { size: 12.5, weight: 700, fill: C.white });
  });
  // key
  const kx = 572;
  s += text(kx, 50, 'Improvement', { size: 12, weight: 700, anchor: 'start', fill: C.muted, spacing: '0.05em' });
  items.forEach(([id, label], n) => {
    const y = 78 + n * 31;
    s += circle(kx + 11, y, 11, { fill: C.ink, stroke: C.ink }) + text(kx + 11, y, id, { size: 11.5, weight: 700, fill: C.white });
    const words = label.split(' ');
    let l1 = '', l2 = '';
    words.forEach((wd) => { if (!l2 && L.tw((l1 + ' ' + wd).trim(), 12.5) < 200) l1 = (l1 + ' ' + wd).trim(); else l2 = (l2 + ' ' + wd).trim(); });
    s += text(kx + 30, y, l2 ? l1 + '\n' + l2 : l1, { size: 12.5, anchor: 'start', lh: 1.15 });
  });
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 03 User story map (HTML) ---------- */
F['03-user-story-map'] = () => {
  const activities = [
    { name: 'Discover products', tasks: ['Browse the catalogue', 'Search and filter'] },
    { name: 'Evaluate a product', tasks: ['View price and details', 'Check delivery date'] },
    { name: 'Build the cart', tasks: ['Add items', 'Review cart and total'] },
    { name: 'Check out', tasks: ['Enter contact and address', 'Choose delivery'] },
    { name: 'Pay', tasks: ['Choose payment method', 'Confirm the order'] },
    { name: 'After purchase', tasks: ['Track the order', 'Improve the funnel'] }
  ];
  const S = (id, title, pri, pts) => ({ id, title, pri, pts });
  const releases = [
    {
      name: 'Release 1 · Sprint 1', goal: 'A guest can buy with the full price visible', points: 32,
      cells: [
        [S('US-01', 'Fast catalogue load with skeletons', 'M', 5)],
        [S('US-03', 'Tax-inclusive price on product page', 'M', 2)],
        [S('US-05', 'Add to cart without leaving the page', 'M', 3), S('US-06', 'Cart saved between visits', 'M', 3), S('US-07', 'Delivery charge and total in cart', 'M', 3)],
        [S('US-09', 'Guest checkout', 'M', 5), S('US-10', 'Three-step checkout with progress', 'M', 8)],
        [S('US-16', 'Order confirmation with ETA', 'M', 3)],
        []
      ]
    },
    {
      name: 'Release 2 · Sprint 2', goal: 'Checkout is forgiving, flexible and trusted', points: 32,
      cells: [
        [S('US-02', 'Instant search and filters', 'S', 5)],
        [S('US-04', 'Delivery estimate by PIN code', 'S', 3)],
        [S('US-08', 'Undo after removing an item', 'C', 2)],
        [S('US-11', 'Inline validation with clear messages', 'M', 5), S('US-12', 'City and state auto-filled from PIN', 'S', 3), S('US-13', 'Saved details for next time', 'S', 3)],
        [S('US-14', 'Pay by UPI, card or cash on delivery', 'M', 8), S('US-15', 'Promo code', 'C', 3)],
        []
      ]
    },
    {
      name: 'Release 3 · Sprint 3', goal: 'Fast everywhere, and lost carts are recovered', points: 31,
      cells: [
        [S('US-20', 'CDN and server-side caching', 'S', 8)],
        [],
        [S('US-18', 'Abandoned-cart reminder', 'S', 5)],
        [S('US-19', 'Mobile-optimised checkout', 'M', 5)],
        [S('US-17', 'Retry a failed payment', 'S', 5)],
        [S('US-22', 'Order status tracking', 'C', 3), S('US-21', 'Checkout funnel analytics', 'S', 5)]
      ]
    }
  ];
  const card = (st) => `<div class="story ${st.pri}"><b>${st.id}</b><span>${esc(st.title)}</span><i>${st.pts} pt</i></div>`;
  const html = `
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; font-family: ${L.FONT}; color: ${C.ink}; }
    #fig { width: 1500px; padding: 22px 22px 20px; }
    .grid { display: grid; grid-template-columns: 150px repeat(6, 1fr); gap: 8px; }
    .rowlabel { font-size: 13px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: ${C.muted}; align-self: center; }
    .act { background: ${C.ink}; color: #fff; border-radius: 9px; padding: 13px 10px; font-size: 16px; font-weight: 700; text-align: center; }
    .tasks { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .task { background: ${C.grey}; border: 1.4px solid ${C.rule}; border-radius: 8px; padding: 9px 6px; font-size: 13.5px; font-weight: 600; text-align: center; line-height: 1.25; display: flex; align-items: center; justify-content: center; }
    .slice { grid-column: 1 / -1; display: grid; grid-template-columns: 150px repeat(6, 1fr); gap: 8px; border-top: 2px dashed ${C.faint}; padding-top: 12px; margin-top: 6px; }
    .rel b { display: block; font-size: 15px; }
    .rel span { display: block; font-size: 13px; color: ${C.muted}; line-height: 1.3; margin-top: 3px; }
    .rel em { display: inline-block; margin-top: 7px; font-style: normal; font-size: 12.5px; font-weight: 700; background: ${C.sand}; border: 1.2px solid ${C.rule}; border-radius: 99px; padding: 2px 9px; }
    .cell { display: grid; gap: 6px; align-content: start; }
    .story { position: relative; background: #fff; border: 1.4px solid ${C.rule}; border-left: 6px solid ${C.faint}; border-radius: 8px; padding: 7px 44px 8px 9px; font-size: 13.5px; line-height: 1.25; }
    .story b { display: block; font-size: 12px; color: ${C.muted}; letter-spacing: .03em; }
    .story i { position: absolute; right: 8px; top: 7px; font-style: normal; font-size: 12px; font-weight: 700; color: ${C.muted}; }
    .story.M { border-left-color: ${C.green}; }
    .story.S { border-left-color: #D99A1C; }
    .story.C { border-left-color: ${C.faint}; }
    .legend { display: flex; gap: 22px; align-items: center; margin-top: 16px; font-size: 13px; color: ${C.muted}; }
    .legend span { display: inline-flex; align-items: center; gap: 7px; }
    .legend u { width: 6px; height: 16px; border-radius: 2px; display: inline-block; }
  </style>
  <div id="fig">
    <div class="grid">
      <div class="rowlabel">User activities<br>(backbone)</div>
      ${activities.map((a) => `<div class="act">${a.name}</div>`).join('')}
      <div class="rowlabel">User tasks</div>
      ${activities.map((a) => `<div class="tasks">${a.tasks.map((t) => `<div class="task">${t}</div>`).join('')}</div>`).join('')}
      ${releases.map((r) => `
        <div class="slice">
          <div class="rel"><b>${r.name}</b><span>${r.goal}</span><em>${r.points} story points</em></div>
          ${r.cells.map((cell) => `<div class="cell">${cell.map(card).join('')}</div>`).join('')}
        </div>`).join('')}
    </div>
    <div class="legend">
      <b style="color:${C.ink}">Priority (MoSCoW)</b>
      <span><u style="background:${C.green}"></u>Must have</span>
      <span><u style="background:#D99A1C"></u>Should have</span>
      <span><u style="background:${C.faint}"></u>Could have</span>
      <span style="margin-left:auto">Read left to right for the shopper journey, top to bottom for delivery order.</span>
    </div>
  </div>`;
  return { html, selector: '#fig' };
};

/* ---------- 04 As-is checkout workflow ---------- */
function stepBox(x, y, w, h, n, label, kind) {
  const bad = kind === 'bad';
  const good = kind === 'good';
  const stroke = bad ? C.red : good ? C.green : C.ink;
  const fill = bad ? C.redSoft : good ? C.greenSoft : C.white;
  return rect(x, y, w, h, { fill, stroke, rx: 10 }) +
    text(x + w / 2, y + h / 2 + (n ? 5 : 0), label, { size: 14, weight: 600, lh: 1.2 }) +
    (n ? circle(x + 16, y + 15, 10, { fill: stroke, stroke }) + text(x + 16, y + 15, String(n), { size: 11.5, weight: 700, fill: C.white }) : '');
}

F['04-workflow-as-is'] = () => {
  const W = 820, H = 372;
  const bw = 136, bh = 66;
  const xs = [22, 182, 342, 502, 662];
  let s = '';
  s += text(22, 26, 'BEFORE', { size: 12, weight: 700, anchor: 'start', spacing: '0.08em', fill: C.red });
  s += text(86, 26, '8 screens before the order is placed, account required, costs revealed late', { size: 13.5, anchor: 'start', fill: C.muted });

  const row1 = [
    ['Cart page', 'Full page reload;\ntotal excludes delivery', 'bad'],
    ['Sign in or\nregister', 'Account is\nmandatory', 'bad'],
    ['Verify email\n(OTP)', 'Shopper leaves the\nsite to read email', 'bad'],
    ['Shipping\naddress', '12 fields; errors shown\nonly after submit', 'bad'],
    ['Billing\naddress', 'Same address\ntyped again', 'bad']
  ];
  const y1 = 52;
  row1.forEach(([label, note, kind], i) => {
    s += stepBox(xs[i], y1, bw, bh, i + 1, label, kind);
    s += text(xs[i] + bw / 2, y1 + bh + 26, note, { size: 12, fill: C.red, lh: 1.25 });
    if (i < 4) s += line([[xs[i] + bw, y1 + bh / 2], [xs[i + 1] - 2, y1 + bh / 2]], { end: 'arrow' });
  });
  // down to row 2 (runs right to left)
  const y2 = 204;
  s += line([[xs[4] + bw / 2, y1 + bh + 48], [xs[4] + bw / 2, y2 - 2]], { end: 'arrow' });
  const row2 = [
    [4, 'Shipping\nmethod', 'Delivery charge first\nappears here', 'bad', 6],
    [3, 'Payment', 'Card only; redirect\nto the bank page', 'bad', 7],
    [2, 'Order\nreview', 'Fees added at\nthe final step', 'bad', 8],
    [1, 'Order\nconfirmation', 'Reached by a minority\nof shoppers', '', 9]
  ];
  row2.forEach(([col, label, note, kind, n], i) => {
    s += stepBox(xs[col], y2, bw, bh, n, label, kind);
    s += text(xs[col] + bw / 2, y2 + bh + 26, note, { size: 12, fill: kind ? C.red : C.muted, lh: 1.25 });
    if (i < 3) s += line([[xs[col], y2 + bh / 2], [xs[col - 1] + bw + 2, y2 + bh / 2]], { end: 'arrow' });
  });
  // session timeout note
  s += rect(22, y2 + 4, 136, 100, { fill: C.sand, stroke: C.rule, rx: 10, sw: 1.2 });
  s += text(90, y2 + 54, 'Session timeout\nat any step empties\nthe cart: the shopper\nstarts again', { size: 12, fill: C.muted, lh: 1.3 });
  return { w: W, h: H, svg: svg(W, H, s) };
};

/* ---------- 05 To-be checkout workflow ---------- */
F['05-workflow-to-be'] = () => {
  const W = 820, H = 392;
  const bw = 134, bh = 70, y = 118;
  let s = '';
  s += text(22, 26, 'AFTER', { size: 12, weight: 700, anchor: 'start', spacing: '0.08em', fill: C.green });
  s += text(76, 26, 'One checkout page, three steps, guest by default, full price visible from the cart', { size: 13.5, anchor: 'start', fill: C.muted });

  // single-page container
  s += rect(178, 62, 464, 164, { fill: C.sand, stroke: C.faint, rx: 14, dash: '6 5', sw: 1.3 });
  s += text(410, 82, 'Single checkout page: no reloads, completed steps stay editable', { size: 12.5, fill: C.muted, weight: 600 });

  const xs = [22, 196, 343, 490, 664];
  const steps = [
    ['Cart drawer', 'Cart saved automatically;\ntotal already includes\ndelivery', 0],
    ['Contact and\naddress', '7 fields, PIN auto-fill,\ninline validation,\nno account', 1],
    ['Delivery', 'Price and arrival date\nshown for every\noption', 2],
    ['Payment', 'UPI, card or cash on\ndelivery; no redirect,\nretry keeps details', 3],
    ['Order\nconfirmation', 'Order number and ETA;\ndetails saved for\nnext time', 0]
  ];
  steps.forEach(([label, note, n], i) => {
    s += stepBox(xs[i], y, bw, bh, n, label, 'good');
    s += text(xs[i] + bw / 2, y + bh + 72, note, { size: 12, fill: C.green, lh: 1.28 });
    if (i < 4) s += line([[xs[i] + bw, y + bh / 2], [xs[i + 1] - 2, y + bh / 2]], { end: 'arrow' });
  });
  // edit loop
  s += `<path d="M${xs[3] + bw / 2} ${y + bh} q0 22 -22 22 H${xs[1] + bw / 2 + 22} q-22 0 -22 -19" fill="none" stroke="${C.muted}" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#open-muted)"/>`;
  s += tag(410, y + bh + 22, 'Edit an earlier step without losing data', { size: 11.5, bg: C.sand });

  // summary strip
  const facts = [['8 → 3', 'steps to place an order'], ['Account → guest', 'sign-up no longer required'], ['Late → up front', 'delivery cost shown in the cart'], ['Card → UPI, card, COD', 'payment choice']];
  facts.forEach(([big, small], i) => {
    const fx = 22 + i * 197;
    s += rect(fx, 320, 185, 54, { fill: C.white, stroke: C.rule, rx: 10, sw: 1.2 });
    s += text(fx + 92, 338, big, { size: 14.5, weight: 700 }) + text(fx + 92, 358, small, { size: 12, fill: C.muted });
  });
  return { w: W, h: H, svg: svg(W, H, s) };
};

module.exports = F;
