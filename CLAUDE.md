# M2D2 — Markdown to DOCX Converter

## Key Context
- Markdown to styled Word document converter with web GUI and CLI
- Uses `docx-js` (npm `docx` package) and `marked` for markdown parsing
- Two brand styles: RenewCORP (teal #1B96A0) and Clockwork Cloud (steel blue #2D5F8A)
- Hosted on Vercel (serverless functions) + works locally via Express

## Architecture
- `convert.js` — core conversion engine, exports `convertMarkdown()` + works as CLI
- `server.js` — Express server for local dev (`npm start` → localhost:3200)
- `public/index.html` — web GUI (drag-and-drop, style picker, cover/TOC options)
- `api/convert.js` — Vercel serverless function (POST, returns .docx buffer)
- `api/styles.js` — Vercel serverless function (GET, returns style list)
- `vercel.json` — Vercel routing config
- Styles defined in STYLES object at top of convert.js
- Markdown parsed via `marked.lexer()` → tokens converted to docx-js Paragraph/Table/etc

## Style Source Documents
- RenewCORP: extracted from `RenewCORP_-_COTTA_OM_Proposal_for_W2NRG_20260216.docx`
  - Aptos font, 12pt body, teal (#1B96A0) H1/H3, black H2/H4
  - A4, 1" margins, footer with teal border (#2198A2)
  - Paragraph spacing: 160 DXA after, 278 line spacing
- Clockwork Cloud: steel blue variant (#2D5F8A), same structure

## Known Limitations
- No image embedding from markdown (images referenced as links)
- TOC requires manual field update in Word
- Cover page background image must be added manually
- Blockquote rendering uses left border + indent (not full shading block)
