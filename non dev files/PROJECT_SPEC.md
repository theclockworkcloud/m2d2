# md-to-docx: Project Specification

## Overview

Build a local desktop tool with a GUI that converts Markdown (.md) files to professionally styled Word documents (.docx). The tool runs fully offline after initial setup and supports multiple brand themes.

This tool exists because we frequently write content in Markdown (proposals, reports, technical docs) but need to share polished Word documents with clients and team members. The converter applies consistent branding automatically so we don't need to manually format in Word every time.

## Core Functionality

### Markdown to DOCX Conversion
- Parse standard Markdown and convert to styled Word documents
- Supported elements:
  - Headings H1–H6 (H1–H4 get custom brand styling, H5–H6 basic)
  - Paragraphs with inline formatting: **bold**, *italic*, ***bold italic***, `inline code`
  - Bullet lists (3 levels of nesting: •, ○, ▪)
  - Numbered lists (2 levels: 1., a.)
  - Tables with styled header row and alternating row shading
  - Fenced code blocks (monospace, shaded background)
  - Blockquotes (left border accent + light background)
  - Horizontal rules (styled divider line)
  - Links (coloured underlined text)
- Page setup: A4 (11906 × 16838 DXA), 1-inch margins all round

### Optional Document Features
- **Cover page**: branded title page with document title, company name, and auto-generated date
- **Table of Contents**: auto-generated from headings (requires field update in Word after opening)
- **Footer**: styled footer with confidentiality notice, teal/blue top border, and page numbers

## Brand Styles

Two styles are required at launch. The style system should be extensible so new themes can be added easily.

### RenewCORP (default)
Extracted from: `RenewCORP_-_COTTA_OM_Proposal_for_W2NRG_20260216.docx`

| Element | Spec |
|---------|------|
| Font | Aptos |
| Body size | 12pt (24 half-points) |
| H1 | 18pt, bold, teal #1B96A0 |
| H2 | 16pt, bold, black (no colour override) |
| H3 | 14pt, bold, teal #1B96A0 |
| H4 | 12pt, bold, black (no colour override) |
| Accent colour | #1B96A0 |
| Footer border | #2198A2 |
| Muted text | #595959 |
| Table header bg | #1B96A0, white text |
| Table alt row | #E8F7F8 |
| Link colour | #467886 |
| Blockquote bg | #F0F9FA |
| Blockquote border | #1B96A0 |
| Code block bg | #F4F4F4 |
| Line spacing | 278 (approx 1.15) |
| Paragraph after | 160 DXA |
| Footer text | "Commercial in Confidence" |
| Company name | "RenewCORP Pty Ltd" |

### The Clockwork Cloud
| Element | Spec |
|---------|------|
| Font | Aptos |
| Body size | 12pt (24 half-points) |
| H1 | 18pt, bold, steel blue #2D5F8A |
| H2 | 16pt, bold, black |
| H3 | 14pt, bold, steel blue #2D5F8A |
| H4 | 12pt, bold, black |
| Accent colour | #2D5F8A |
| Footer border | #3A7CB8 |
| Muted text | #595959 |
| Table header bg | #2D5F8A, white text |
| Table alt row | #EDF3F9 |
| Link colour | #2D5F8A |
| Blockquote bg | #EDF3F9 |
| Blockquote border | #2D5F8A |
| Code block bg | #F4F4F4 |
| Line spacing | 278 |
| Paragraph after | 160 DXA |
| Footer text | "Commercial in Confidence" |
| Company name | "The Clockwork Cloud" |

## GUI Requirements

### Layout
Simple, functional interface. Not trying to be a full editor — just a conversion tool.

- **File input**: drag-and-drop zone or file picker for .md files. Show the selected filename.
- **Style selector**: dropdown or toggle between RenewCORP / Clockwork Cloud (and any future styles)
- **Options**:
  - Cover page toggle (on/off) with a text field for the document title
  - Table of Contents toggle (on/off)
- **Convert button**: runs the conversion and saves/downloads the .docx
- **Output**: either save-as dialog or default to same directory as input file with .docx extension
- **Status**: show progress/success/error feedback

### Tech Stack Preference
- Electron or Tauri for desktop app, OR
- A simple web-based local tool (HTML + Node.js backend) that runs via `npm start` and opens in the browser
- Either approach is fine — pick whichever gives the cleanest result fastest

### Nice to Haves (not required for v1)
- Live preview of the markdown content
- Recent files list
- Batch conversion (drag multiple .md files)
- Custom style editor in the GUI

## Dependencies

| Package | Purpose |
|---------|---------|
| `docx` | Word document generation (docx-js) |
| `marked` | Markdown parsing |
| Whatever the GUI framework needs | |

## Key Technical Notes

### docx-js Gotchas (from the SKILL.md)
- Set page size explicitly — defaults to A4 which is correct for us
- Never use `\n` in text — use separate Paragraph elements
- Never use unicode bullets manually — use `LevelFormat.BULLET` with numbering config
- Tables need dual widths: `columnWidths` on the table AND `width` on each cell
- Table width must equal sum of columnWidths
- Always use `WidthType.DXA` for table widths (percentages break in Google Docs)
- Use `ShadingType.CLEAR` never `SOLID` for shading
- Never use tables as dividers — use paragraph borders instead
- TOC requires `HeadingLevel` and `outlineLevel` on heading styles
- Override built-in styles using exact IDs: "Heading1", "Heading2", etc.
- `PageBreak` must be inside a `Paragraph`

### Markdown Parsing Notes
- Use `marked.lexer()` to get tokens, then walk the token tree
- Inline tokens (bold, italic, code, links) need recursive processing
- Nested lists come through as child `list` tokens inside `list_item` tokens
- Tables have `header` (array of cells) and `rows` (array of arrays of cells)
- Blockquote tokens contain nested tokens that need recursive processing

## File Structure Suggestion

```
md-to-docx/
├── package.json
├── README.md
├── claude.md              ← this file (project context for Claude sessions)
├── convert.js             ← core conversion engine (can be used standalone CLI too)
├── styles.js              ← brand style definitions (extracted for reuse)
├── gui/                   ← GUI application files
│   ├── index.html
│   ├── main.js
│   └── ...
└── sample.md              ← test file for development
```

## Existing CLI Version

There's already a working CLI version in `convert.js` that handles the core conversion. The GUI wraps this same logic. Usage:

```bash
node convert.js input.md                          # default RenewCORP style
node convert.js input.md -o output.docx           # custom output name
node convert.js input.md --style clockwork        # Clockwork Cloud style
node convert.js input.md --toc                    # include Table of Contents
node convert.js input.md --cover "Report Title"   # add cover page
```

## Sample Markdown for Testing

Use this to verify all elements render correctly:

~~~markdown
# Executive Summary

This is a **sample document** to test the converter. It supports *italic*, **bold**, ***bold italic***, and `inline code`.

## Background

Some body text explaining the context.

### Key Findings

- First bullet point
- Second bullet point
  - Sub-bullet
  - Another sub-bullet
- Third bullet point

### Data Summary

| Site | System Size | Annual Savings | Payback |
|------|------------|---------------|---------|
| Morwell | 99.9 kW | $28,400 | 4.2 yrs |
| Osborne | 150 kW | $42,100 | 3.8 yrs |

## Methodology

1. Initial assessment
2. Energy analysis
3. System design
   a. Solar yield
   b. Financial modelling

> **Note:** All projections based on current tariffs.

```
Panel: LONGi Hi-MO 6 Explorer (580W)
Inverter: Huawei SUN2000-100KTL
```

---

#### Contact

For questions, contact the project team.
~~~

## Development Notes

- Project files typically live at D:\Dev\
- GitHub Desktop → GitHub → Vercel/other deployment (though this tool is local-only)
- Australian English throughout
- Keep it simple — this is a utility tool, not a product
