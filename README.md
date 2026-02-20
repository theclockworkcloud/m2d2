# M2D2

Markdown to styled Word document converter. Supports RenewCORP and Clockwork Cloud branding with cover pages, table of contents, and full formatting.

## Setup

```bash
npm install
```

## GUI

```bash
npm start
```

Opens at [http://localhost:3200](http://localhost:3200). Drag and drop a `.md` file, pick a style, and convert.

Also deployed on Vercel.

## CLI

```bash
# Basic conversion (uses RenewCORP style by default)
node convert.js proposal.md

# Custom output name
node convert.js report.md -o "Q3 Asset Report.docx"

# Use Clockwork Cloud branding
node convert.js report.md --style clockwork

# Add cover page and table of contents
node convert.js proposal.md --cover "Solar Feasibility Study" --toc

# Full example
node convert.js proposal.md -o "Client_Proposal.docx" --style renewcorp --toc --cover "COTTA & O&M Proposal"
```

## CLI Options

| Flag | Description |
|------|-------------|
| `-o, --output <file>` | Output filename (default: same name as input with .docx) |
| `-s, --style <name>` | Style theme: `renewcorp` (default) or `clockwork` |
| `--toc` | Include Table of Contents (update fields in Word after opening) |
| `--cover "Title"` | Add a branded cover page with the given title |
| `-h, --help` | Show help |

## Supported Markdown

- Headings (H1-H4 styled, H5-H6 supported)
- **Bold**, *italic*, ***bold italic***
- `Inline code` and fenced code blocks
- Bullet lists (3 levels of nesting)
- Numbered lists (2 levels)
- Tables with header row
- Blockquotes
- Horizontal rules
- Links (rendered as coloured underlined text)

## Styles

### RenewCORP (default)
- Teal accent (#1B96A0)
- Aptos font, 12pt body
- Teal H1/H3, black H2/H4

### Clockwork Cloud
- Steel blue accent (#2D5F8A)
- Aptos font, 12pt body
- Blue H1/H3, black H2/H4

## Adding Custom Styles

Edit the `STYLES` object in `convert.js` to add new brand themes. Each style defines colours, fonts, sizes, and footer text.

## Notes

- TOC fields need to be updated in Word: right-click the TOC -> Update Field -> Update Entire Table
- Cover page background images need to be added manually in Word
- Runs fully offline after `npm install` (or online via Vercel)
