// Alle Dateien in _seiten/leistung/ werden Leistungsseiten unter /leistungen/<slug>/
const { computedFuer } = require("../../tools/seo.js");
module.exports = {
  layout: "leistung-layout.njk",
  tags: ["leistungen", "seoSeiten"],
  eleventyComputed: computedFuer("leistung")
};
