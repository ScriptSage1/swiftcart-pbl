// Helpers for assembling the PBL report with docx-js, in the department's report format:
// US Letter, Times New Roman 12 pt, 1.5 line spacing, centred capitalised section titles.
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, BorderStyle, Bookmark,
  WidthType, ShadingType, VerticalAlign, PageBreak, TableLayoutType
} = D;

const FONT = 'Times New Roman';
const MONO = 'Consolas';
const PORTRAIT_W = 8640;     // Letter, 1.5" left and 1" right margins, in DXA
const LANDSCAPE_W = 12960;   // Letter landscape, 1" margins
const PX = { portrait: 576, landscape: 864 };   // the same widths in pixels at 96 dpi
const GRID = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const LINE = 360;            // 1.5 line spacing

function smart(text) {
  return text.replace(/"([^"]*)"/g, '“$1”').replace(/(\w)'(\w)/g, '$1’$2');
}

// Inline markup: **bold**, *italic*, `code`, __underline__.
function runs(text, base) {
  base = base || {};
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|__[^_]+__)/g;
  String(text).split(re).forEach((part) => {
    if (!part) return;
    if (part.startsWith('**')) out.push(new TextRun(Object.assign({}, base, { text: smart(part.slice(2, -2)), bold: true })));
    else if (part.startsWith('__')) out.push(new TextRun(Object.assign({}, base, { text: smart(part.slice(2, -2)), underline: {} })));
    else if (part.startsWith('`')) out.push(new TextRun(Object.assign({}, base, { text: part.slice(1, -1), font: MONO, size: (base.size || 24) - 3 })));
    else if (part.startsWith('*')) out.push(new TextRun(Object.assign({}, base, { text: smart(part.slice(1, -1)), italics: true })));
    else out.push(new TextRun(Object.assign({}, base, { text: smart(part) })));
  });
  return out;
}

function createContext(opts) {
  const figKeys = opts.figures;
  const tabKeys = opts.tables;
  const sizes = opts.sizes;
  const sections = [];
  let current = null;
  let listing = 0;
  let listInstance = 0;

  const ctx = {
    get width() { return current.landscape ? LANDSCAPE_W : PORTRAIT_W; },
    F: (key) => { const i = figKeys.indexOf(key); if (i < 0) throw new Error('unknown figure ' + key); return 'Figure ' + (i + 1); },
    T: (key) => { const i = tabKeys.indexOf(key); if (i < 0) throw new Error('unknown table ' + key); return 'Table ' + (i + 1); },
    used: { fig: new Set(), tab: new Set() },

    // extra: { front } for the roman-numbered front matter, { first } for the first body section.
    section(landscape, extra) {
      current = Object.assign({ landscape: !!landscape, children: [] }, extra || {});
      sections.push(current);
      return ctx;
    },
    raw(el) { current.children.push(el); return ctx; },
    pageBreak() { return ctx.raw(new Paragraph({ children: [new PageBreak()] })); },

    // Main section title: centred, bold, capitals, on a new page unless it shares one (o.sameStart).
    title(text, id, o) {
      o = o || {};
      const label = new TextRun({ text: text.toUpperCase(), bold: true, size: 32 });
      return ctx.raw(new Paragraph({
        alignment: AlignmentType.CENTER,
        pageBreakBefore: !o.samePage && current.children.length > 0,
        keepNext: true,
        spacing: { before: o.samePage ? 300 : 240, after: 300 },
        children: [id ? new Bookmark({ id, children: [label] }) : label]
      }));
    },
    h2(text) {
      return ctx.raw(new Paragraph({ keepNext: true, keepLines: true, spacing: { before: 280, after: 120, line: LINE }, children: [new TextRun({ text, bold: true, size: 28 })] }));
    },
    h3(text) {
      return ctx.raw(new Paragraph({ keepNext: true, keepLines: true, spacing: { before: 200, after: 80, line: LINE }, children: [new TextRun({ text, bold: true, size: 24 })] }));
    },

    p(text, o) {
      o = o || {};
      return ctx.raw(new Paragraph({
        alignment: o.align || AlignmentType.JUSTIFIED,
        spacing: { after: o.after == null ? 200 : o.after, before: o.before || 0, line: LINE },
        keepNext: !!o.keepNext,
        indent: o.indent ? { left: o.indent } : undefined,
        children: runs(text, { size: o.size, italics: o.italics, color: o.color })
      }));
    },

    // Numbered list "1." that restarts at 1 for every call.
    list(items, o) {
      o = o || {};
      listInstance += 1;
      items.forEach((item, i) => ctx.raw(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        numbering: { reference: 'nums', level: 0, instance: listInstance },
        spacing: { after: i === items.length - 1 ? 200 : 60, line: LINE },
        keepNext: !!o.keepNext,
        children: runs(item)
      })));
      return ctx;
    },
    bullets(items) {
      items.forEach((item, i) => ctx.raw(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        numbering: { reference: 'bullets', level: 0 },
        spacing: { after: i === items.length - 1 ? 200 : 60, line: LINE },
        children: runs(item)
      })));
      return ctx;
    },
    refs(items) {
      items.forEach((item, i) => ctx.raw(new Paragraph({
        alignment: AlignmentType.LEFT,
        numbering: { reference: 'refs', level: 0 },
        spacing: { after: i === items.length - 1 ? 200 : 100, line: LINE },
        children: runs(item)
      })));
      return ctx;
    },

    caption(text, above) {
      return ctx.raw(new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: !!above,
        spacing: { before: above ? 200 : 80, after: above ? 100 : 280 },
        children: runs(text, { size: 22 })
      }));
    },

    // Weights are relative column widths; cells may be strings, arrays of strings (paragraphs) or { text, bold, align }.
    table(key, title, headers, rows, weights, o) {
      o = o || {};
      const size = o.size || 22;
      const total = o.width || ctx.width;
      const sum = weights.reduce((a, b) => a + b, 0);
      const widths = weights.map((w) => Math.round((w / sum) * total));
      widths[widths.length - 1] += total - widths.reduce((a, b) => a + b, 0);

      const cell = (value, i, header, keep) => {
        const spec = value && typeof value === 'object' && !Array.isArray(value) ? value : { text: value };
        const paras = (Array.isArray(spec.text) ? spec.text : String(spec.text == null ? '' : spec.text).split('\n')).map((line) => new Paragraph({
          alignment: spec.align || (header ? AlignmentType.CENTER : (o.center && o.center.includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT)),
          spacing: { after: 20, line: 260 },
          keepNext: !!keep,
          children: runs(line, { size, bold: header || spec.bold })
        }));
        return new TableCell({
          children: paras,
          width: { size: widths[i], type: WidthType.DXA },
          verticalAlign: VerticalAlign.TOP,
          shading: header && o.shade ? { type: ShadingType.CLEAR, fill: 'EDEDED', color: 'auto' } : undefined,
          margins: { top: 50, bottom: 40, left: 100, right: 100 }
        });
      };

      if (key) {
        ctx.used.tab.add(key);
        ctx.caption('**' + ctx.T(key) + ':** ' + title, true);
      }
      ctx.raw(new Table({
        width: { size: total, type: WidthType.DXA },
        columnWidths: widths,
        layout: TableLayoutType.FIXED,
        alignment: AlignmentType.CENTER,
        borders: { top: GRID, bottom: GRID, left: GRID, right: GRID, insideHorizontal: GRID, insideVertical: GRID },
        rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, true, o.keepTogether)) })]
          .concat(rows.map((r, n) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false, o.keepTogether && n < rows.length - 1)) })))
      }));
      return ctx.raw(new Paragraph({ spacing: { after: 200 }, children: [] }));
    },

    image(file, maxW, maxH, o) {
      o = o || {};
      const name = path.basename(file).replace(/\.\w+$/, '');
      const dims = o.dims || sizes[name];
      if (!dims) throw new Error('no size for ' + name);
      const scale = Math.min(maxW / dims[0], maxH / dims[1]);
      return new ImageRun({
        type: file.endsWith('.png') ? 'png' : 'jpg',
        data: fs.readFileSync(file),
        transformation: { width: Math.round(dims[0] * scale), height: Math.round(dims[1] * scale) },
        altText: { title: o.alt || name, description: o.alt || name, name }
      });
    },

    fig(key, file, title, o) {
      o = o || {};
      ctx.used.fig.add(key);
      const maxW = o.maxW || (current.landscape ? PX.landscape : PX.portrait);
      const maxH = o.maxH || (current.landscape ? 470 : 640);
      ctx.raw(new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        spacing: { before: 160, after: 0 },
        border: o.frame ? { top: GRID, bottom: GRID, left: GRID, right: GRID } : undefined,
        children: [ctx.image(file, maxW, maxH, { dims: o.dims, alt: title.replace(/\*/g, '') })]
      }));
      return ctx.caption('**' + ctx.F(key) + ':** ' + title);
    },

    // Several images side by side under one caption.
    figRow(key, files, title, o) {
      ctx.used.fig.add(key);
      const each = Math.floor(ctx.width / files.length);
      ctx.raw(new Table({
        width: { size: ctx.width, type: WidthType.DXA },
        columnWidths: files.map(() => each),
        layout: TableLayoutType.FIXED,
        borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
        rows: [new TableRow({
          cantSplit: true,
          children: files.map((f) => new TableCell({
            width: { size: each, type: WidthType.DXA },
            borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [ctx.image(f, o.maxW, o.maxH, { dims: o.dims })] })]
          }))
        })]
      }));
      return ctx.caption('**' + ctx.F(key) + ':** ' + title);
    },

    code(title, source) {
      listing += 1;
      const lines = source.replace(/\s+$/, '').split('\n');
      ctx.caption('**Listing ' + listing + ':** ' + title, true);
      ctx.raw(new Table({
        width: { size: ctx.width, type: WidthType.DXA },
        columnWidths: [ctx.width],
        layout: TableLayoutType.FIXED,
        borders: { top: GRID, bottom: GRID, left: GRID, right: GRID, insideHorizontal: NONE, insideVertical: NONE },
        rows: [new TableRow({
          children: [new TableCell({
            width: { size: ctx.width, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'F4F4F4', color: 'auto' },
            margins: { top: 90, bottom: 90, left: 130, right: 100 },
            children: lines.map((line) => new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 0, line: 216 },
              children: [new TextRun({ text: line || ' ', font: MONO, size: 16 })]
            }))
          })]
        })]
      }));
      return ctx.raw(new Paragraph({ spacing: { after: 200 }, children: [] }));
    },

    sections
  };
  return ctx;
}

// Pulls a block of source code out of a project file, between two marker strings.
function extract(file, start, end) {
  const src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const a = src.indexOf(start);
  if (a < 0) throw new Error('marker not found: ' + start);
  const b = end ? src.indexOf(end, a + start.length) : src.length;
  if (b < 0) throw new Error('marker not found: ' + end);
  const lines = src.slice(a, b).replace(/\s+$/, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

module.exports = { D, FONT, MONO, PORTRAIT_W, LANDSCAPE_W, LINE, runs, createContext, extract, GRID, NONE };
