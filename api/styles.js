const { getAvailableStyles } = require("../convert.js");

module.exports = (_req, res) => {
  res.json(getAvailableStyles());
};
