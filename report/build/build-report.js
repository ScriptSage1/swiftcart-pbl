// Builds report/PBL_Report_SwiftCart.docx in the department's PBL report format, from the diagrams,
// screenshots, prototype source and saved test output. Run finalize-report.ps1 afterwards to fill in
// the page numbers in the table of contents and export the PDF.
'use strict';
const fs = require('fs');
const path = require('path');
const { D, FONT, createContext } = require('./report-kit.js');
const { Document, Packer, Paragraph, TextRun, Footer, AlignmentType, PageOrientation, LevelFormat, PageNumber, NumberFormat } = D;

const ROOT = path.resolve(__dirname, '..', '..');
const env = {
  diagrams: path.join(ROOT, 'report', 'diagrams'),
  screenshots: path.join(ROOT, 'report', 'screenshots'),
  assets: path.join(ROOT, 'report', 'assets'),
  prototype: path.join(ROOT, 'prototype'),
  details: require('./report-details.js')
};

/* ---------- measured results, read from the saved test-run output ---------- */
const INFO = 'ℹ';
function parseRun(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const num = (key) => {
    const hit = lines.find((l) => l.startsWith(INFO + ' ' + key + ' '));
    return hit ? Number(hit.split(' ')[2]) : 0;
  };
  return { tests: num('tests'), pass: num('pass'), fail: num('fail'), skipped: num('skipped'), ms: num('duration_ms') };
}
const unit = parseRun(path.join(__dirname, 'test-output', 'unit.txt'));
const e2e = parseRun(path.join(__dirname, 'test-output', 'e2e.txt'));
const runtimeFiles = ['index.html', 'css/styles.css', 'js/data.js', 'js/core.js', 'js/store.js', 'js/ui.js', 'js/app.js'];
const imageDir = path.join(env.prototype, 'images');
env.results = {
  node: process.version.replace('v', ''),
  puppeteer: JSON.parse(fs.readFileSync(path.join(env.prototype, 'node_modules', 'puppeteer-core', 'package.json'), 'utf8')).version,
  unit: Object.assign({}, unit, { duration: (unit.ms / 1000).toFixed(1) + ' s' }),
  e2e: Object.assign({}, e2e, { duration: (e2e.ms / 1000).toFixed(1) + ' s' }),
  sizeKb: Math.round(runtimeFiles.reduce((s, f) => s + fs.statSync(path.join(env.prototype, f)).size, 0) / 1024),
  fileCount: runtimeFiles.length,
  imagesKb: Math.round(fs.readdirSync(imageDir).filter((f) => f.endsWith('.jpg')).reduce((s, f) => s + fs.statSync(path.join(imageDir, f)).size, 0) / 1024)
};
if (unit.fail || e2e.fail || !unit.tests || !e2e.tests) {
  throw new Error('test results are not clean: ' + JSON.stringify([unit, e2e].map((r) => [r.tests, r.pass, r.fail])));
}

/* ---------- content ---------- */
const figures = ['architecture', 'usecase', 'class', 'object', 'activity', 'sequence', 'collab', 'state', 'component', 'deployment',
  'shot-catalogue', 'shot-product', 'shot-cart', 'shot-details', 'shot-confirm', 'shot-orders', 'shot-mobile'];
const tables = ['hardware', 'software', 'release', 'results', 'beforeafter'];
const sizes = JSON.parse(fs.readFileSync(path.join(__dirname, 'sizes.json'), 'utf8'));
const ctx = createContext({ figures, tables, sizes });
require('./report-front.js')(ctx, env);
require('./report-part1.js')(ctx, env);
require('./report-part2.js')(ctx, env);
require('./report-part3.js')(ctx, env);

// Numbering must follow the order of appearance.
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
if (!same([...ctx.used.fig], figures)) throw new Error('figure order mismatch: ' + [...ctx.used.fig].join(','));
if (!same([...ctx.used.tab], tables)) throw new Error('table order mismatch: ' + [...ctx.used.tab].join(','));

/* ---------- document ---------- */
const footer = new Footer({ children: [new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })]
})] });

const doc = new Document({
  creator: env.details.students.map((s) => s.name).join(', '),
  title: env.details.fullTitle + ': PBL Report',
  description: 'Project Based Learning report, ' + env.details.course,
  styles: {
    default: { document: { run: { font: FONT, size: 24 }, paragraph: { spacing: { after: 120 } } } }
  },
  numbering: {
    config: [
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 400 } } } }] },
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] },
      { reference: 'refs', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 440 } } } }] }
    ]
  },
  sections: ctx.sections.map((s) => ({
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: s.landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
        margin: s.landscape
          ? { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 720, footer: 576 }
          : { top: 1440, right: 1440, bottom: 1440, left: 2160, header: 720, footer: 576 },
        pageNumbers: s.front ? { start: 1, formatType: NumberFormat.LOWER_ROMAN } : (s.first ? { start: 1, formatType: NumberFormat.DECIMAL } : undefined)
      }
    },
    footers: { default: footer },
    children: s.children
  }))
});

const out = path.join(ROOT, 'report', 'PBL_Report_SwiftCart.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('wrote', out, Math.round(buf.length / 1024) + ' KB', '| sections', ctx.sections.length,
    '| results', JSON.stringify({ unit: [unit.tests, unit.pass], e2e: [e2e.tests, e2e.pass], kb: env.results.sizeKb, img: env.results.imagesKb }));
});
