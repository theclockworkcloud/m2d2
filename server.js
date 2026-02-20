#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// md-to-docx GUI Server
// ══════════════════════════════════════════════════════════════
// Serves the web GUI and handles conversion requests.
// Usage: npm start → opens http://localhost:3200
// ══════════════════════════════════════════════════════════════

const express = require("express");
const path = require("path");
const { convertMarkdown, getAvailableStyles } = require("./convert.js");

const PORT = process.env.PORT || 3200;
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Return available styles
app.get("/api/styles", (_req, res) => {
  res.json(getAvailableStyles());
});

// Convert markdown to docx
app.post("/api/convert", async (req, res) => {
  const { markdown, style, toc, cover } = req.body;

  if (!markdown || typeof markdown !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'markdown' field" });
  }

  try {
    const buffer = await convertMarkdown(markdown, { style, toc, cover });

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="output.docx"`,
      "Content-Length": buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    console.error("[Convert Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`md-to-docx GUI running at http://localhost:${PORT}`);
});
