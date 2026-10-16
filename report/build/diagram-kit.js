// Small SVG drawing kit for the report diagrams.
'use strict';

const C = {
  ink: '#1B1F24', muted: '#5B6470', faint: '#9AA1AB', rule: '#D5D9DE',
  green: '#1C6B50', greenSoft: '#E7F2EC',
  red: '#B3261E', redSoft: '#FCEEEC',
  amber: '#8A5A00', amberSoft: '#FFF4DC',
  blue: '#24598A', blueSoft: '#E8F0F8',
  sand: '#F6F5F2', grey: '#F1F2F4', white: '#FFFFFF'
};
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const STROKES = { ink: C.ink, muted: C.muted, green: C.green, red: C.red, blue: C.blue, faint: C.faint };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Rough text width, good enough for label backgrounds.
function tw(str, size, weight) {
  let w = 0;
  for (const ch of String(str)) {
    if (/[iljtfrI.,:;'|!()\[\] ]/.test(ch)) w += 0.3;
    else if (/[mwMW@]/.test(ch)) w += 0.86;
    else if (/[A-Z]/.test(ch)) w += 0.65;
    else if (/[0-9]/.test(ch)) w += 0.56;
    else w += 0.53;
  }
  return w * size * ((weight || 400) >= 600 ? 1.06 : 1);
}

function text(x, y, str, o) {
  o = o || {};
  const size = o.size || 14;
  const lh = o.lh || 1.28;
  const lines = String(str).split('\n');
  const first = y - ((lines.length - 1) * size * lh) / 2;
  const attrs = `font-size="${size}" font-weight="${o.weight || 400}" text-anchor="${o.anchor || 'middle'}" fill="${o.fill || C.ink}"` +
    (o.italic ? ' font-style="italic"' : '') + (o.spacing ? ` letter-spacing="${o.spacing}"` : '') +
    (o.rotate ? ` transform="rotate(${o.rotate} ${x} ${y})"` : '');
  return lines.map((l, i) => `<text x="${x}" y="${(first + i * size * lh).toFixed(1)}" dy="0.35em" ${attrs}>${esc(l)}</text>`).join('');
}

// Text on a small background plate, for labels that sit on a line.
function tag(x, y, str, o) {
  o = o || {};
  const size = o.size || 12;
  const lines = String(str).split('\n');
  const w = Math.max(...lines.map((l) => tw(l, size, o.weight))) + 10;
  const h = lines.length * size * 1.28 + 4;
  const ax = o.anchor === 'start' ? x - 5 : o.anchor === 'end' ? x - w + 5 : x - w / 2;
  return `<rect x="${ax.toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${o.bg || C.white}" rx="3"/>` +
    text(x, y, str, { size, fill: o.fill || C.muted, anchor: o.anchor, weight: o.weight, italic: o.italic });
}

function rect(x, y, w, h, o) {
  o = o || {};
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx == null ? 8 : o.rx}" fill="${o.fill || C.white}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw == null ? 1.5 : o.sw}"` +
    (o.dash ? ` stroke-dasharray="${o.dash}"` : '') + '/>';
}

function box(x, y, w, h, label, o) {
  o = o || {};
  return rect(x, y, w, h, o) + text(x + w / 2, y + h / 2, label, { size: o.size || 13.5, weight: o.weight || 500, fill: o.color || C.ink, lh: o.lh });
}

function ellipse(cx, cy, rx, ry, label, o) {
  o = o || {};
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${o.fill || C.white}" stroke="${o.stroke || C.ink}" stroke-width="1.5"/>` +
    (label ? text(cx, cy, label, { size: o.size || 12.5, weight: o.weight || 500 }) : '');
}

function circle(cx, cy, r, o) {
  o = o || {};
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || C.white}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw == null ? 1.5 : o.sw}"/>`;
}

function diamond(cx, cy, w, h, o) {
  o = o || {};
  return `<path d="M${cx} ${cy - h / 2} L${cx + w / 2} ${cy} L${cx} ${cy + h / 2} L${cx - w / 2} ${cy} Z" fill="${o.fill || C.white}" stroke="${o.stroke || C.ink}" stroke-width="1.5"/>`;
}

// Polyline with optional markers. o.end / o.start: arrow | open | tri | dia | diao
function line(pts, o) {
  o = o || {};
  const key = o.color || 'ink';
  const d = 'M' + pts.map((p) => p[0] + ' ' + p[1]).join(' L');
  return `<path d="${d}" fill="none" stroke="${STROKES[key]}" stroke-width="${o.sw || 1.5}" stroke-linejoin="round"` +
    (o.dash ? ` stroke-dasharray="${o.dash}"` : '') +
    (o.end ? ` marker-end="url(#${o.end}-${key})"` : '') +
    (o.start ? ` marker-start="url(#${o.start}-${key})"` : '') + '/>';
}

function defs() {
  const markers = Object.keys(STROKES).map((k) => {
    const c = STROKES[k];
    const m = (id, w, h, body) => `<marker id="${id}-${k}" viewBox="0 0 ${w} ${h}" refX="${w - 0.5}" refY="${h / 2}" markerWidth="${w}" markerHeight="${h}" markerUnits="userSpaceOnUse" orient="auto-start-reverse">${body}</marker>`;
    return m('arrow', 11, 10, `<path d="M0.5 1 L10.5 5 L0.5 9 Z" fill="${c}"/>`) +
      m('open', 11, 10, `<path d="M1 1 L10 5 L1 9" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/>`) +
      m('tri', 15, 14, `<path d="M1 1 L14 7 L1 13 Z" fill="#fff" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>`) +
      m('dia', 19, 10, `<path d="M1 5 L9.5 1 L18 5 L9.5 9 Z" fill="${c}" stroke="${c}" stroke-width="1"/>`) +
      m('diao', 19, 10, `<path d="M1 5 L9.5 1 L18 5 L9.5 9 Z" fill="#fff" stroke="${c}" stroke-width="1.3"/>`);
  }).join('');
  return `<defs>${markers}</defs>`;
}

function actor(cx, y, label, o) {
  o = o || {};
  return `<g stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round">` +
    `<circle cx="${cx}" cy="${y + 9}" r="9" fill="#fff"/>` +
    `<path d="M${cx} ${y + 18}v22M${cx - 15} ${y + 27}h30M${cx} ${y + 40}l-12 18M${cx} ${y + 40}l12 18"/></g>` +
    text(cx, y + 60 + 8 + ((String(label).split('\n').length - 1) * 8), label, { size: o.size || 12.5, weight: 600, lh: 1.25 });
}

// UML component: a box with the component glyph in the top-right corner.
function component(x, y, w, h, label, o) {
  o = o || {};
  const gx = x + w - 26;
  const gy = y + 9;
  const stroke = o.stroke || C.ink;
  const glyph = `<g fill="#fff" stroke="${stroke}" stroke-width="1.2"><rect x="${gx}" y="${gy}" width="15" height="17" rx="1.5"/>` +
    `<rect x="${gx - 4}" y="${gy + 3}" width="8" height="4" rx="1"/><rect x="${gx - 4}" y="${gy + 10}" width="8" height="4" rx="1"/></g>`;
  const lines = [];
  if (o.stereo) lines.push(text(x + w / 2, y + h / 2 - 10, '«' + o.stereo + '»', { size: 11, fill: C.muted }));
  lines.push(text(x + w / 2, y + h / 2 + (o.stereo ? 8 : 0), label, { size: o.size || 13, weight: 600, lh: 1.2 }));
  return rect(x, y, w, h, { fill: o.fill, stroke, rx: 6, dash: o.dash }) + glyph + lines.join('');
}

// UML node: a box drawn as a cube.
function node3d(x, y, w, h, o) {
  o = o || {};
  const d = 12;
  const fill = o.fill || C.white;
  const side = o.side || C.grey;
  return `<path d="M${x} ${y} l${d} ${-d} h${w} l${-d} ${d} Z" fill="${side}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M${x + w} ${y} l${d} ${-d} v${h} l${-d} ${d} Z" fill="${side}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${C.ink}" stroke-width="1.4"/>` +
    (o.stereo ? text(x + w / 2, y + 15, '«' + o.stereo + '»', { size: 11, fill: C.muted }) : '') +
    (o.title ? text(x + w / 2, y + (o.stereo ? 32 : 18), o.title, { size: o.size || 13, weight: 600 }) : '');
}

// Artifact / inner element used inside nodes.
function chip(x, y, w, h, label, o) {
  o = o || {};
  return rect(x, y, w, h, { fill: o.fill || C.sand, stroke: o.stroke || C.rule, sw: 1.2, rx: 5 }) +
    text(x + w / 2, y + h / 2, label, { size: o.size || 12, fill: o.color || C.ink, weight: o.weight || 400, lh: 1.2 });
}

// UML class box. Returns { svg, h } so callers can lay out connectors.
function classBox(x, y, w, name, attrs, ops, o) {
  o = o || {};
  const lh = 17;
  const headH = o.stereo ? 42 : 28;
  const aH = attrs.length ? attrs.length * lh + 12 : 10;
  const oH = ops.length ? ops.length * lh + 12 : (o.noOps ? 0 : 10);
  const h = headH + aH + oH;
  let s = rect(x, y, w, h, { rx: 4, fill: C.white });
  s += `<path d="M${x} ${y + headH} h${w}" stroke="${C.ink}" stroke-width="1.2"/>`;
  s += `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${headH - 1}" rx="3" fill="${o.head || C.sand}"/>`;
  s += `<path d="M${x} ${y + headH} h${w}" stroke="${C.ink}" stroke-width="1.2"/>`;
  if (o.stereo) s += text(x + w / 2, y + 13, '«' + o.stereo + '»', { size: 11, fill: C.muted });
  s += text(x + w / 2, y + (o.stereo ? 29 : headH / 2), name, { size: 13.5, weight: 700, italic: !!o.abstract });
  attrs.forEach((a, i) => { s += text(x + 9, y + headH + 6 + lh / 2 + i * lh, a, { size: 12, anchor: 'start' }); });
  if (oH) {
    s += `<path d="M${x} ${y + headH + aH} h${w}" stroke="${C.ink}" stroke-width="1.2"/>`;
    ops.forEach((a, i) => { s += text(x + 9, y + headH + aH + 6 + lh / 2 + i * lh, a, { size: 12, anchor: 'start' }); });
  }
  return { svg: s, h, x, y, w, cx: x + w / 2, bottom: y + h, right: x + w };
}

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}">` +
    `<rect width="${w}" height="${h}" fill="#fff"/>${defs()}${body}</svg>`;
}

module.exports = { C, FONT, esc, tw, text, tag, rect, box, ellipse, circle, diamond, line, actor, component, node3d, chip, classBox, svg };
