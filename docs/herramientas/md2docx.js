// Conversor Markdown -> DOCX para la Base Científica VMNI (subset: headings, párrafos,
// negrita/cursiva/código, tablas, listas, citas, reglas horizontales) con portada y estilos.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle,
  LevelFormat, TableOfContents, PageBreak, ImageRun,
} = require("docx");

const [, , inFile, outFile] = process.argv;
const md = fs.readFileSync(inFile, "utf8");

const C = {
  primary: "0F4C5C",   // azul petróleo oscuro
  secondary: "16697A",
  accent: "2A7F8E",
  light: "EAF3F5",
  grayBorder: "C9D6DA",
  text: "222222",
  muted: "5A6B70",
};
const CONTENT_W = 9638; // A4 con márgenes de 2 cm

// ---------- inline parsing ----------
function inlineRuns(text, base = {}) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    if (m[2] !== undefined) runs.push(new TextRun({ text: m[2], bold: true, ...base }));
    else if (m[4] !== undefined) runs.push(new TextRun({ text: m[4], italics: true, ...base }));
    else if (m[6] !== undefined) runs.push(new TextRun({ text: m[6], font: "Menlo", size: 18, color: C.secondary }));
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  return runs.length ? runs : [new TextRun({ text: "", ...base })];
}

// ---------- tables ----------
function splitRow(line) {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(s => s.trim());
}
function buildTable(lines) {
  const header = splitRow(lines[0]);
  const body = lines.slice(2).map(splitRow);
  const nCols = header.length;
  // anchos ponderados por longitud máxima de contenido
  const maxLen = header.map((h, i) => Math.max(h.length, ...body.map(r => (r[i] || "").length)));
  const weights = maxLen.map(l => Math.min(Math.max(l, 14), 60));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const colW = weights.map(w => Math.round((w / totalW) * CONTENT_W));
  colW[nCols - 1] = CONTENT_W - colW.slice(0, -1).reduce((a, b) => a + b, 0);

  const borders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: C.grayBorder },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayBorder },
    left: { style: BorderStyle.SINGLE, size: 4, color: C.grayBorder },
    right: { style: BorderStyle.SINGLE, size: 4, color: C.grayBorder },
  };
  const mkCell = (text, i, isHeader, rowIdx) => new TableCell({
    width: { size: colW[i], type: WidthType.DXA },
    borders,
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: C.primary }
      : (rowIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F5FAFB" } : undefined),
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      spacing: { before: 0, after: 0 },
      children: inlineRuns(text, isHeader
        ? { bold: true, color: "FFFFFF", size: 18 }
        : { size: 18, color: C.text }),
    })],
  });

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => mkCell(h, i, true, 0)) }),
      ...body.map((r, ri) => new TableRow({
        children: header.map((_, i) => mkCell(r[i] || "", i, false, ri)),
      })),
    ],
  });
}

// ---------- bloques de formulario para las decisiones abiertas ----------
function buildDecisionBlocks(tblLines) {
  const out = [];
  const body = tblLines.slice(2).map(splitRow);
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
    left: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
    right: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
  };
  const ruled = () => new Paragraph({
    spacing: { before: 260, after: 0 },
    border: { bottom: { style: BorderStyle.DOTTED, size: 6, color: "7A9AA2" } },
    children: [new TextRun({ text: " " })],
  });
  for (const [num, cuestion, propuesta] of body) {
    out.push(new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [
        new TableRow({ children: [new TableCell({
          width: { size: CONTENT_W, type: WidthType.DXA }, borders,
          shading: { type: ShadingType.CLEAR, fill: C.primary },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({ children: [
            new TextRun({ text: `${num.replace(/\*\*/g, "")} · `, bold: true, color: "FFFFFF", size: 21 }),
            ...inlineRuns(cuestion, { bold: true, color: "FFFFFF", size: 21 }),
          ] })],
        })] }),
        new TableRow({ children: [new TableCell({
          width: { size: CONTENT_W, type: WidthType.DXA }, borders,
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({ spacing: { after: 120 }, children: [
              new TextRun({ text: "Propuesta: ", bold: true, color: C.secondary, size: 19 }),
              ...inlineRuns(propuesta, { size: 19 }),
            ] }),
            new Paragraph({ spacing: { before: 60, after: 60 }, children: [
              new TextRun({ text: "☐", font: "Arial Unicode MS", size: 26, color: C.primary }),
              new TextRun({ text: "  Aceptamos la propuesta", bold: true, size: 20 }),
              new TextRun({ text: "        " }),
              new TextRun({ text: "☐", font: "Arial Unicode MS", size: 26, color: C.primary }),
              new TextRun({ text: "  La rechazamos", bold: true, size: 20 }),
            ] }),
            new Paragraph({ spacing: { before: 100, after: 0 }, children: [
              new TextRun({ text: "Nuestra decisión:", bold: true, color: C.secondary, size: 19 }),
            ] }),
            ruled(), ruled(),
          ],
        })] }),
      ],
    }));
    out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }
  return out;
}

// ---------- block parsing ----------
const lines = md.split("\n");
const blocks = [];
let inDecisions = false;
let i = 0;
// saltar cabecera markdown hasta la primera regla "---" (la portada se construye aparte)
while (i < lines.length && lines[i].trim() !== "---") i++;
i++;

while (i < lines.length) {
  const line = lines[i];
  const t = line.trim();
  if (t === "") { i++; continue; }
  if (t === "---") {
    i++; continue; // separadores: los omitimos (los títulos ya separan)
  }
  const img = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (img) {
    const imgPath = path.resolve(path.dirname(inFile), img[2]);
    blocks.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      children: [new ImageRun({ type: "png", data: fs.readFileSync(imgPath), transformation: { width: 640, height: 500 } })],
    }));
    i++; continue;
  }
  const h = t.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const lvl = h[1].length;
    const txt = h[2];
    if (lvl <= 2) inDecisions = /^13\./.test(txt);
    const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
    blocks.push(new Paragraph({
      heading: levels[lvl - 1],
      spacing: { before: lvl === 1 ? 420 : 280, after: 140 },
      pageBreakBefore: lvl === 2 && /^(1|3|6|10|13|14)\./.test(txt), // secciones largas en página nueva
      children: inlineRuns(txt.replace(/\*\*/g, "")),
    }));
    i++; continue;
  }
  if (t.startsWith("|")) {
    const tbl = [];
    while (i < lines.length && lines[i].trim().startsWith("|")) { tbl.push(lines[i].trim()); i++; }
    if (tbl.length >= 2) {
      if (inDecisions) blocks.push(...buildDecisionBlocks(tbl));
      else blocks.push(buildTable(tbl));
    }
    blocks.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    continue;
  }
  if (t.startsWith("> ")) {
    const quote = [];
    while (i < lines.length && lines[i].trim().startsWith(">")) {
      quote.push(lines[i].trim().replace(/^>\s?/, "")); i++;
    }
    for (const q of quote) {
      if (q === "") continue;
      blocks.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 360 },
        shading: { type: ShadingType.CLEAR, fill: C.light },
        border: { left: { style: BorderStyle.SINGLE, size: 24, color: C.accent } },
        children: inlineRuns(q, { size: 19, color: "333333" }),
      }));
    }
    continue;
  }
  const bullet = t.match(/^[-*]\s+(.*)$/);
  if (bullet) {
    blocks.push(new Paragraph({
      numbering: { reference: "vmni-bullets", level: 0 },
      spacing: { after: 60 },
      children: inlineRuns(bullet[1]),
    }));
    i++; continue;
  }
  const num = t.match(/^(\d+)\.\s+(.*)$/);
  if (num) {
    blocks.push(new Paragraph({
      numbering: { reference: "vmni-numbers", level: 0 },
      spacing: { after: 60 },
      children: inlineRuns(num[2]),
    }));
    i++; continue;
  }
  // párrafo normal (acumular líneas contiguas)
  const para = [t];
  i++;
  while (i < lines.length && lines[i].trim() !== "" && !/^(\||#|>|[-*]\s|\d+\.\s|---)/.test(lines[i].trim())) {
    para.push(lines[i].trim()); i++;
  }
  blocks.push(new Paragraph({ spacing: { after: 100 }, children: inlineRuns(para.join(" ")) }));
}

// ---------- portada ----------
const cover = [
  new Paragraph({ spacing: { before: 2600 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "VMNI EN URGENCIAS", bold: true, size: 64, color: C.primary })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 160 },
    children: [new TextRun({ text: "Base de Conocimiento Clínico", size: 40, color: C.secondary })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120 },
    children: [new TextRun({ text: "Ventilación Mecánica No Invasiva: diagnóstico, indicación, programación, seguimiento y resolución de problemas", italics: true, size: 24, color: C.muted })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 600 },
    children: [new TextRun({ text: "Versión 0.1 — borrador para revisión científica", bold: true, size: 24, color: C.accent })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 400 },
    children: [new TextRun({ text: "Carlos J. Galán Doval", bold: true, size: 26, color: C.text })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Coautor y revisor: Enrique Fernández Romero", size: 24, color: C.text })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120 },
    children: [new TextRun({ text: "Urgencias · Hospital de Montilla · Área de Gestión Sanitaria Sur de Córdoba", size: 21, color: C.muted })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120 },
    children: [new TextRun({ text: "27 de octubre de 2026", size: 21, color: C.muted })],
  }),
  new Paragraph({ spacing: { before: 900 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: C.light },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
    },
    children: [new TextRun({ text: "Documento de apoyo a la decisión clínica. No sustituye el criterio del profesional ni los protocolos del centro. Fuente de verdad del motor de decisión de la app VMNI Urgencias: ninguna recomendación entra en la app sin estar validada aquí.", italics: true, size: 19, color: "444444" })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    spacing: { before: 200, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.accent } },
    children: [new TextRun({ text: "Índice", bold: true, size: 32, color: C.primary })],
  }),
  new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
];

const doc = new Document({
  creator: "Carlos J. Galán Doval",
  title: "VMNI en Urgencias — Base de Conocimiento Clínico v0.1",
  styles: {
    default: { document: { run: { font: "Avenir Next", size: 20, color: C.text } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: C.primary },
        paragraph: { spacing: { before: 420, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.accent } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: C.secondary },
        paragraph: { spacing: { before: 300, after: 120 } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, color: C.accent },
        paragraph: { spacing: { before: 220, after: 100 } } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 20, bold: true, italics: true, color: C.muted },
        paragraph: { spacing: { before: 180, after: 80 } } },
    ],
  },
  numbering: {
    config: [
      { reference: "vmni-bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] },
      { reference: "vmni-numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ],
  },
  features: { updateFields: true },
  sections: [{
    properties: {
      page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
    },
    children: [...cover, ...blocks],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outFile, buf);
  console.log("OK", outFile, buf.length, "bytes");
});
