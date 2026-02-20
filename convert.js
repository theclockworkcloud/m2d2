#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// M2D2: Markdown → Styled Word Document Converter
// ══════════════════════════════════════════════════════════════
// Usage:
//   node convert.js input.md                     → outputs input.docx (default: renewcorp)
//   node convert.js input.md -o output.docx      → custom output name
//   node convert.js input.md --style clockwork    → use Clockwork Cloud style
//   node convert.js input.md --toc               → include Table of Contents
//   node convert.js input.md --cover "My Title"  → add cover page with title
//
// Supports: headings, paragraphs, bold, italic, bold+italic, code,
//           bullet lists (nested), numbered lists (nested), tables,
//           horizontal rules, blockquotes, links, images (local files)
// ══════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  ImageRun, TableOfContents, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak
} = require("docx");

// ── STYLE DEFINITIONS ──────────────────────────────────────────

const STYLES = {
  renewcorp: {
    name: "RenewCORP",
    font: "Aptos",
    bodySize: 24,        // 12pt in half-points
    colors: {
      h1: "1B96A0",      // teal
      h2: null,           // inherits black
      h3: "1B96A0",      // teal
      h4: null,           // inherits black
      accent: "1B96A0",
      border: "2198A2",
      muted: "595959",
      tableHeader: "1B96A0",
      tableAlt: "E8F7F8",
      link: "467886",
      quote: "F0F9FA",
      quoteBorder: "1B96A0",
      codeBg: "F4F4F4",
    },
    headingSizes: { h1: 36, h2: 32, h3: 28, h4: 24 },
    lineSpacing: 278,
    paraAfter: 160,
    footerText: "Commercial in Confidence",
    companyName: "RenewCORP Pty Ltd",
    coverImage: "assets/renewcorp-cover.png",
    headerLogo: "assets/renewcorp-logo.png",
    headerLogoWidth: 130,
    headerLogoHeight: 35,
    coverImageWidth: 600,
    coverImageHeight: 340,
  },
  clockwork: {
    name: "The Clockwork Cloud",
    font: "Aptos",
    bodySize: 24,
    colors: {
      h1: "2D5F8A",      // steel blue
      h2: null,
      h3: "2D5F8A",
      h4: null,
      accent: "2D5F8A",
      border: "3A7CB8",
      muted: "595959",
      tableHeader: "2D5F8A",
      tableAlt: "EDF3F9",
      link: "2D5F8A",
      quote: "EDF3F9",
      quoteBorder: "2D5F8A",
      codeBg: "F4F4F4",
    },
    headingSizes: { h1: 36, h2: 32, h3: 28, h4: 24 },
    lineSpacing: 278,
    paraAfter: 160,
    footerText: "Commercial in Confidence",
    companyName: "The Clockwork Cloud",
    coverImage: null,
    headerLogo: null,
    headerLogoWidth: 130,
    headerLogoHeight: 35,
    coverImageWidth: 600,
    coverImageHeight: 340,
  },
};

// ── IMAGE LOADING ─────────────────────────────────────────────

function loadImage(relativePath) {
  if (!relativePath) return null;
  try {
    const fullPath = path.join(__dirname, relativePath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fs.readFileSync(fullPath);
    }
  } catch {}
  return null;
}

// ── CLI ARGUMENT PARSING ───────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    output: null,
    style: "renewcorp",
    toc: false,
    cover: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      opts.help = true;
    } else if (arg === "-o" || arg === "--output") {
      opts.output = args[++i];
    } else if (arg === "-s" || arg === "--style") {
      opts.style = args[++i];
    } else if (arg === "--toc") {
      opts.toc = true;
    } else if (arg === "--cover") {
      opts.cover = args[++i];
    } else if (!arg.startsWith("-")) {
      opts.input = arg;
    }
  }

  if (!opts.input) opts.help = true;
  if (opts.input && !opts.output) {
    opts.output = opts.input.replace(/\.md$/i, ".docx");
  }

  return opts;
}

function showHelp() {
  console.log(`
M2D2: Convert Markdown to styled Word documents

Usage:
  node convert.js <input.md> [options]

Options:
  -o, --output <file>     Output filename (default: input.docx)
  -s, --style <name>      Style: renewcorp (default) or clockwork
  --toc                   Include Table of Contents after cover
  --cover "Title"         Add a cover page with the given title
  -h, --help              Show this help

Examples:
  node convert.js proposal.md
  node convert.js report.md -o "Q3 Report.docx" --style clockwork --toc --cover "Q3 Asset Report"
`);
}

// ── MARKDOWN PARSING ───────────────────────────────────────────

function parseMarkdown(mdText) {
  const tokens = marked.lexer(mdText);
  return tokens;
}

// Convert inline tokens (bold, italic, code, links) to TextRun array
function inlineToRuns(tokens, style, baseOpts = {}) {
  const runs = [];

  if (!tokens || !Array.isArray(tokens)) {
    if (typeof tokens === "string") {
      runs.push(new TextRun({ text: tokens, font: style.font, size: style.bodySize, ...baseOpts }));
    }
    return runs;
  }

  for (const token of tokens) {
    switch (token.type) {
      case "text":
      case "raw":
        runs.push(new TextRun({
          text: token.text || token.raw,
          font: style.font,
          size: style.bodySize,
          ...baseOpts,
        }));
        break;

      case "strong":
        runs.push(...inlineToRuns(token.tokens, style, { ...baseOpts, bold: true }));
        break;

      case "em":
        runs.push(...inlineToRuns(token.tokens, style, { ...baseOpts, italics: true }));
        break;

      case "codespan":
        runs.push(new TextRun({
          text: token.text,
          font: "Consolas",
          size: style.bodySize - 2,
          shading: { type: ShadingType.CLEAR, fill: style.colors.codeBg },
          ...baseOpts,
        }));
        break;

      case "link":
        runs.push(new ExternalHyperlink({
          link: token.href,
          children: inlineToRuns(token.tokens || [{ type: "text", text: token.text || token.href }], style, {
            ...baseOpts,
            color: style.colors.link,
            underline: { type: "single" },
          }),
        }));
        break;

      case "br":
        runs.push(new TextRun({ break: 1, font: style.font, size: style.bodySize }));
        break;

      case "escape":
        runs.push(new TextRun({
          text: token.text,
          font: style.font,
          size: style.bodySize,
          ...baseOpts,
        }));
        break;

      default:
        // Fallback: use raw text
        if (token.raw) {
          runs.push(new TextRun({
            text: token.raw,
            font: style.font,
            size: style.bodySize,
            ...baseOpts,
          }));
        }
        break;
    }
  }

  return runs;
}

// ── TOKEN → DOCX ELEMENT CONVERSION ───────────────────────────

function tokensToDocxElements(tokens, style, numbConfig) {
  const elements = [];
  let firstH1Seen = false;

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const level = token.depth;
        const headingLevels = [
          HeadingLevel.HEADING_1, HeadingLevel.HEADING_2,
          HeadingLevel.HEADING_3, HeadingLevel.HEADING_4,
          HeadingLevel.HEADING_5, HeadingLevel.HEADING_6,
        ];
        const sizeKeys = ["h1", "h2", "h3", "h4"];
        const colorKeys = ["h1", "h2", "h3", "h4"];

        const headingSize = style.headingSizes[sizeKeys[Math.min(level - 1, 3)]] || style.bodySize;
        const headingColor = style.colors[colorKeys[Math.min(level - 1, 3)]] || undefined;

        const isH1 = level === 1;
        const usePageBreak = isH1 && firstH1Seen;
        if (isH1) firstH1Seen = true;

        const runs = inlineToRuns(token.tokens, style, {
          bold: true,
          size: headingSize,
          color: headingColor,
        });

        elements.push(new Paragraph({
          heading: headingLevels[Math.min(level - 1, 5)],
          keepNext: true,
          keepLines: true,
          pageBreakBefore: usePageBreak,
          children: runs,
        }));
        break;
      }

      case "paragraph": {
        const runs = inlineToRuns(token.tokens, style);
        elements.push(new Paragraph({
          spacing: { after: style.paraAfter },
          children: runs,
        }));
        break;
      }

      case "list": {
        const ref = token.ordered ? "numbers" : "bullets";
        elements.push(...flattenList(token.items, ref, 0, style));
        break;
      }

      case "table": {
        elements.push(createTable(token, style));
        break;
      }

      case "blockquote": {
        // Render blockquote with left border accent
        const innerElements = tokensToDocxElements(token.tokens, style, numbConfig);
        for (const el of innerElements) {
          // Wrap each inner element with blockquote styling
          if (el instanceof Paragraph) {
            elements.push(new Paragraph({
              spacing: { after: style.paraAfter },
              indent: { left: 400 },
              border: {
                left: { style: BorderStyle.SINGLE, size: 12, color: style.colors.quoteBorder, space: 8 },
              },
              shading: { type: ShadingType.CLEAR, fill: style.colors.quote },
              children: el.root ? [] : [new TextRun({ text: "", font: style.font })],
              ...el,
            }));
          } else {
            elements.push(el);
          }
        }
        break;
      }

      case "code": {
        // Code block — monospace with background
        const lines = token.text.split("\n");
        for (const line of lines) {
          elements.push(new Paragraph({
            spacing: { after: 0 },
            keepNext: true,
            keepLines: true,
            shading: { type: ShadingType.CLEAR, fill: style.colors.codeBg },
            children: [
              new TextRun({
                text: line || " ",
                font: "Consolas",
                size: style.bodySize - 4,
              }),
            ],
          }));
        }
        // Add spacing after code block
        elements.push(new Paragraph({ spacing: { after: style.paraAfter }, children: [] }));
        break;
      }

      case "hr": {
        elements.push(new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: style.colors.border, space: 1 },
          },
          spacing: { before: 200, after: 200 },
          children: [],
        }));
        break;
      }

      case "space":
        // Ignore whitespace tokens
        break;

      case "html":
        // Skip raw HTML
        break;

      default:
        // Fallback: try to render as paragraph
        if (token.raw) {
          elements.push(new Paragraph({
            spacing: { after: style.paraAfter },
            children: [new TextRun({ text: token.raw, font: style.font, size: style.bodySize })],
          }));
        }
        break;
    }
  }

  return elements;
}

// Flatten nested list items into paragraphs with numbering
function flattenList(items, reference, level, style) {
  const elements = [];

  for (const item of items) {
    // Process the item's own tokens (skip nested lists, we handle those recursively)
    for (const token of item.tokens) {
      if (token.type === "text" || token.type === "paragraph") {
        const inlineTokens = token.tokens || [{ type: "text", text: token.text || token.raw }];
        const runs = inlineToRuns(inlineTokens, style);
        elements.push(new Paragraph({
          numbering: { reference, level },
          spacing: { after: 80 },
          children: runs,
        }));
      } else if (token.type === "list") {
        const subRef = token.ordered ? "numbers" : "bullets";
        elements.push(...flattenList(token.items, subRef, level + 1, style));
      }
    }
  }

  return elements;
}

// Create a table from markdown table token
function createTable(token, style) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: style.colors.border };
  const borders = { top: border, bottom: border, left: border, right: border };

  const numCols = token.header.length;
  const colWidth = Math.floor(9026 / numCols);
  const columnWidths = Array(numCols).fill(colWidth);
  // Adjust last column to absorb rounding
  columnWidths[numCols - 1] = 9026 - colWidth * (numCols - 1);

  // Header row
  const headerRow = new TableRow({
    children: token.header.map((cell, i) => {
      const runs = inlineToRuns(cell.tokens, style, { bold: true, color: "FFFFFF" });
      return new TableCell({
        borders,
        width: { size: columnWidths[i], type: WidthType.DXA },
        shading: { fill: style.colors.tableHeader, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ spacing: { after: 0 }, children: runs })],
      });
    }),
  });

  // Data rows
  const dataRows = token.rows.map((row, rowIdx) =>
    new TableRow({
      children: row.map((cell, colIdx) => {
        const runs = inlineToRuns(cell.tokens, style);
        return new TableCell({
          borders,
          width: { size: columnWidths[colIdx], type: WidthType.DXA },
          shading: rowIdx % 2 === 1
            ? { fill: style.colors.tableAlt, type: ShadingType.CLEAR }
            : undefined,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ spacing: { after: 0 }, children: runs })],
        });
      }),
    })
  );

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ── DOCUMENT ASSEMBLY ──────────────────────────────────────────

function buildHeader(style) {
  const logoData = loadImage(style.headerLogo);
  if (logoData) {
    return new Header({
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        children: [new ImageRun({
          data: logoData,
          transformation: { width: style.headerLogoWidth || 130, height: style.headerLogoHeight || 35 },
          type: "png",
        })],
      })],
    });
  }
  return new Header({ children: [new Paragraph({ children: [] })] });
}

function buildDocument(elements, style, opts) {
  const children = [];

  // Cover page
  if (opts.cover) {
    const coverImg = loadImage(style.coverImage);
    if (coverImg) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new ImageRun({
          data: coverImg,
          transformation: { width: style.coverImageWidth || 600, height: style.coverImageHeight || 340 },
          type: "png",
        })],
      }));
      // Less vertical spacing when image is present
      children.push(
        new Paragraph({ spacing: { after: 60 }, children: [] }),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      );
    } else {
      // No image — push title down the page
      children.push(...Array(8).fill(null).map(() => new Paragraph({ spacing: { after: 60 }, children: [] })));
    }
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 300 },
        children: [new TextRun({ text: opts.cover, bold: true, color: style.colors.h1, size: 52, font: style.font })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 120 },
        children: [new TextRun({ text: style.companyName, color: style.colors.muted, size: 28, font: style.font })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 120 },
        children: [new TextRun({
          text: new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
          color: style.colors.muted, size: 24, font: style.font,
        })],
      }),
      new Paragraph({ children: [new PageBreak()] }),
    );
  }

  // Table of Contents
  if (opts.toc) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Table of Contents", bold: true, size: style.headingSizes.h1, color: style.colors.h1, font: style.font })],
      }),
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-4" }),
      new Paragraph({ children: [new PageBreak()] }),
    );
  }

  // Main content
  children.push(...elements);

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: style.font, size: style.bodySize },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: style.headingSizes.h1, bold: true, font: style.font, color: style.colors.h1 || undefined },
          paragraph: { spacing: { before: 360, after: 200 }, keepNext: true, keepLines: true, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: style.headingSizes.h2, bold: true, font: style.font, color: style.colors.h2 || undefined },
          paragraph: { spacing: { before: 280, after: 140 }, keepNext: true, keepLines: true, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: style.headingSizes.h3, bold: true, font: style.font, color: style.colors.h3 || undefined },
          paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, keepLines: true, outlineLevel: 2 },
        },
        {
          id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: style.headingSizes.h4, bold: true, font: style.font, color: style.colors.h4 || undefined },
          paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, keepLines: true, outlineLevel: 3 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.BULLET, text: "\u25CB", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ],
        },
        {
          reference: "numbers",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708, gutter: 0 },
        },
        titlePage: !!opts.cover,
      },
      headers: {
        default: buildHeader(style),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 12, color: style.colors.border, space: 4 } },
              children: [
                new TextRun({ text: `${style.footerText}  |  `, size: 16, color: style.colors.muted, font: style.font }),
                new TextRun({ text: "Page ", size: 16, color: style.colors.muted, font: style.font }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: style.colors.muted, font: style.font }),
                new TextRun({ text: " of ", size: 16, color: style.colors.muted, font: style.font }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: style.colors.muted, font: style.font }),
              ],
            }),
          ],
        }),
        first: opts.cover
          ? new Footer({ children: [new Paragraph({ children: [] })] })
          : undefined,
      },
      children,
    }],
  });
}

// ── MAIN ───────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    showHelp();
    process.exit(opts.input ? 1 : 0);
  }

  // Validate style
  const style = STYLES[opts.style];
  if (!style) {
    console.error(`Unknown style: "${opts.style}". Available: ${Object.keys(STYLES).join(", ")}`);
    process.exit(1);
  }

  // Read input
  if (!fs.existsSync(opts.input)) {
    console.error(`File not found: ${opts.input}`);
    process.exit(1);
  }

  const mdText = fs.readFileSync(opts.input, "utf-8");
  console.log(`Converting: ${opts.input}`);
  console.log(`Style: ${style.name}`);

  // Parse markdown
  const tokens = parseMarkdown(mdText);

  // Convert to docx elements
  const elements = tokensToDocxElements(tokens, style, {});

  // Build document
  const doc = buildDocument(elements, style, opts);

  // Write output
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(opts.output, buffer);

  const sizeMB = (buffer.length / 1024).toFixed(1);
  console.log(`Output: ${opts.output} (${sizeMB} KB)`);
  console.log("Done!");
}

// ── EXPORTS (for programmatic use) ────────────────────────────

/**
 * Convert markdown text to a .docx Buffer.
 * @param {string} mdText - Raw markdown content
 * @param {object} options
 * @param {string} [options.style="renewcorp"] - Style key
 * @param {boolean} [options.toc=false] - Include table of contents
 * @param {string|null} [options.cover=null] - Cover page title (null = no cover)
 * @returns {Promise<Buffer>}
 */
async function convertMarkdown(mdText, options = {}) {
  const styleName = options.style || "renewcorp";
  const style = STYLES[styleName];
  if (!style) {
    throw new Error(`Unknown style: "${styleName}". Available: ${Object.keys(STYLES).join(", ")}`);
  }

  const tokens = parseMarkdown(mdText);
  const elements = tokensToDocxElements(tokens, style, {});
  const doc = buildDocument(elements, style, {
    toc: options.toc || false,
    cover: options.cover || null,
  });
  return Packer.toBuffer(doc);
}

function getAvailableStyles() {
  return Object.entries(STYLES).map(([key, s]) => ({ key, name: s.name }));
}

module.exports = { convertMarkdown, getAvailableStyles, STYLES };

// ── CLI ENTRY POINT ───────────────────────────────────────────

if (require.main === module) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
