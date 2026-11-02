// Alle Dateien in _seiten/kosten/ werden Kostenseiten unter /kosten/<slug>/
const { computedFuer } = require("../../tools/seo.js");
module.exports = {
  layout: "kosten-layout.njk",
  tags: ["kosten", "seoSeiten"],
  eleventyComputed: computedFuer("kosten")
};
