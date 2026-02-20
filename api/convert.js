const { convertMarkdown } = require("../convert.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { markdown, style, toc, cover } = req.body || {};

  if (!markdown || typeof markdown !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'markdown' field" });
  }

  try {
    const buffer = await convertMarkdown(markdown, { style, toc, cover });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="output.docx"');
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("[Convert Error]", err.message);
    res.status(500).json({ error: err.message });
  }
};
