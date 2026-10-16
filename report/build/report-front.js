// Front pages: title page, certificate, declaration and table of contents (roman page numbers).
'use strict';
const fs = require('fs');
const path = require('path');
const { D, runs, GRID, NONE, LINE } = require('./report-kit.js');
const { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, TableLayoutType, VerticalAlign, PageBreak, PageReference, HeightRule } = D;

const NAVY = '1F3864';
const BLUE = '0070C0';
const SKY = '4472C4';
const GREEN = '00B050';
const RED = 'FF0000';
const ORANGE = 'ED7D31';

// Sections listed in the table of contents, with the bookmark each title carries.
const CONTENTS = [
  ['Abstract', 'sec01'], ['Introduction', 'sec02'], ['Problem Statement', 'sec03'], ['Objectives of Project', 'sec04'],
  ['Literature Survey', 'sec05'], ['System Design / Architecture', 'sec06'], ['Hardware and Software Requirements', 'sec07'],
  ['Implementation', 'sec08'], ['Results and Discussion', 'sec09'], ['Conclusion and Future Scope', 'sec10'],
  ['References', 'sec11'], ['GitHub Repository Link', 'sec12']
];

module.exports = function (ctx, env) {
  const d = env.details;
  const logoFile = path.join(env.assets, 'college-logo.png');
  const line = (text, o) => new Paragraph({
    alignment: o.align || AlignmentType.CENTER,
    spacing: { before: o.before || 0, after: o.after || 0, line: o.line || 276 },
    children: [new TextRun({ text, size: o.size || 24, bold: o.bold !== false, color: o.color, underline: o.underline ? {} : undefined, italics: o.italics })]
  });
  const logo = (before, after) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before, after },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(logoFile), transformation: { width: 112, height: 115 }, altText: { title: 'College logo', description: 'College logo', name: 'logo' } })]
  });
  const body = (text) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 540 },
    spacing: { after: 200, line: LINE },
    children: runs(text)
  });
  const studentsInline = d.students.map((s) => '**' + s.name + ' (' + s.roll + ')**').join(', ');
  const guideLong = d.guide.name + ', ' + d.guide.designation;

  ctx.section(false, { front: true });

  /* ------------------------------------------------------------ title page */
  ctx.raw(line(d.project, { before: 120, size: 28, color: NAVY }));
  ctx.raw(line(d.subtitle, { after: 200, size: 28, color: NAVY }));
  ctx.raw(line('Project Based Learning (PBL) Report', { after: 80, size: 28 }));
  ctx.raw(line('for the course', { after: 80, size: 20 }));
  ctx.raw(line(d.course, { after: 220, size: 28 }));
  ctx.raw(line(d.degree, { after: 200, size: 22, color: NAVY }));
  ctx.raw(line('IN', { after: 200, size: 22, color: NAVY }));
  ctx.raw(line(d.branch, { after: 300, size: 22, color: NAVY }));
  ctx.raw(line('By', { after: 200, size: 20 }));
  d.students.forEach((s, i) => ctx.raw(line(s.name + ' (' + s.roll + ')', { after: i === d.students.length - 1 ? 280 : 40, size: 24 })));
  ctx.raw(line('Under the guidance of', { after: 120, size: 22 }));
  ctx.raw(line(d.guide.title + ' ' + d.guide.name, { after: 80, size: 22, color: NAVY }));
  ctx.raw(line(d.guide.designation, { after: 0, size: 22, color: NAVY }));
  ctx.raw(logo(240, 200));
  ctx.raw(line(d.department, { after: 20, size: 28, color: GREEN }));
  ctx.raw(line(d.accreditation, { after: 260, size: 22, color: RED }));
  ctx.raw(line(d.college, { after: 40, size: 28, color: NAVY }));
  ctx.raw(line(d.autonomy, { after: 40, size: 22, color: RED }));
  ctx.raw(line(d.affiliation, { after: 20, size: 22, color: BLUE, bold: false }));
  ctx.raw(line(d.address, { after: 200, size: 22, bold: false }));
  ctx.raw(line(d.month, { size: 28 }));
  ctx.raw(new Paragraph({ children: [new PageBreak()] }));

  /* ----------------------------------------------------------- certificate */
  const collegeHeader = (titleSize, nbaSize) => {
    ctx.raw(line(d.collegeShort, { before: 200, after: 40, size: titleSize, color: RED }));
    ctx.raw(line(d.autonomy, { after: 20, size: 22, color: RED }));
    ctx.raw(line(d.affiliation, { after: 20, size: 22, bold: false }));
    ctx.raw(line(d.address.replace('Keesara (M)', 'Keesara(M)'), { after: 480, size: 22, bold: false }));
    ctx.raw(line(d.department.toUpperCase(), { after: 160, size: 26, color: SKY }));
    ctx.raw(line(d.accreditation, { after: 0, size: nbaSize, color: RED }));
  };
  collegeHeader(36, 24);
  ctx.raw(logo(420, 360));
  ctx.raw(line('CERTIFICATE', { after: 360, size: 32, color: ORANGE, underline: true }));
  ctx.raw(body('This is to certify that the Project-Based Learning (PBL) report entitled **"' + d.fullTitle + '"** has been carried out by ' +
    studentsInline + ', of ' + d.yearSem + ', B.Tech in Computer Science and Engineering, during the academic year ' + d.academicYear +
    ', under the guidance of **' + guideLong + '**, Department of Computer Science and Engineering. This work is submitted in partial fulfillment of the requirements for the Project-Based Learning (PBL) component of the **' + d.lab + '**.'));
  const sigCell = (lines) => new TableCell({
    width: { size: 4320, type: WidthType.DXA },
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
    children: lines.map((t, i) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60, line: 300 }, children: [new TextRun({ text: t, bold: true, size: 24 })] }))
  });
  ctx.raw(new Paragraph({ spacing: { before: 600 }, children: [] }));
  ctx.raw(new Table({
    width: { size: 8640, type: WidthType.DXA },
    columnWidths: [4320, 4320],
    layout: TableLayoutType.FIXED,
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ children: [
      sigCell(['Project Guide', d.guide.name, d.guide.designation]),
      sigCell(['Head of the Department', d.hod.name, d.hod.designation])
    ] })]
  }));
  ctx.raw(new Paragraph({ children: [new PageBreak()] }));

  /* ----------------------------------------------------------- declaration */
  ctx.raw(line('ACKNOWLEDGEMENT', { before: 100, after: 120, size: 36, color: NAVY }));
  collegeHeader(36, 28);
  ctx.raw(logo(300, 300));
  ctx.raw(line('DECLARATION BY THE CANDIDATE', { after: 360, size: 26, color: ORANGE, underline: true }));
  ctx.raw(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: LINE },
    children: runs('We hereby declare that the Project-Based Learning (PBL) report entitled **"' + d.fullTitle + '"** submitted to the Department of Computer Science and Engineering, ' +
      d.college + ', is a record of original work carried out by us during the academic year ' + d.academicYear + ', under the guidance of **' + guideLong +
      ',** Department of Computer Science and Engineering. We further declare that this report has not been submitted to any other institution or university for the award of any degree.')
  }));
  ctx.raw(new Paragraph({ spacing: { after: 120, line: LINE }, children: [new TextRun({ text: 'Name of the Students:', bold: true })] }));
  d.students.forEach((s, i) => ctx.raw(new Paragraph({ spacing: { after: 120, line: LINE }, children: runs((i + 1) + '. __' + s.name + '__ (__' + s.roll + '__)') })));
  ctx.raw(new Paragraph({ spacing: { after: 120, line: LINE }, children: [new TextRun({ text: 'Place: ' + d.college, bold: true, size: 22 })] }));
  ctx.raw(new Paragraph({ spacing: { after: 0, line: LINE }, children: [new TextRun({ text: 'Date:', bold: true, size: 22 })] }));
  ctx.raw(new Paragraph({ children: [new PageBreak()] }));

  /* ----------------------------------------------------- table of contents */
  ctx.raw(line('TABLE OF CONTENTS', { before: 200, after: 300, size: 32 }));
  const W = [1100, 5640, 1900];
  const cell = (children, i, header) => new TableCell({
    width: { size: W[i], type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: [new Paragraph({ alignment: i === 1 && !header ? AlignmentType.LEFT : AlignmentType.CENTER, children })]
  });
  const row = (cells, header) => new TableRow({ height: { value: 470, rule: HeightRule.ATLEAST }, cantSplit: true, children: cells.map((c, i) => cell(c, i, header)) });
  ctx.raw(new Table({
    width: { size: 8640, type: WidthType.DXA },
    columnWidths: W,
    layout: TableLayoutType.FIXED,
    alignment: AlignmentType.CENTER,
    borders: { top: GRID, bottom: GRID, left: GRID, right: GRID, insideHorizontal: GRID, insideVertical: GRID },
    rows: [row(['S.No.', 'Contents', 'Page No.'].map((t) => [new TextRun({ text: t, bold: true, size: 28 })]), true)]
      .concat(CONTENTS.map(([label, id], i) => row([
        [new TextRun({ text: String(i + 1), size: 22 })],
        [new TextRun({ text: label, size: 22 })],
        [new PageReference(id)]
      ])))
  }));
};

module.exports.CONTENTS = CONTENTS;
