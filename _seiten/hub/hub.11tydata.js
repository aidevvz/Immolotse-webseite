// Alle Dateien in _seiten/hub/ werden Hub-Seiten unter /themen/<slug>/
const { computedFuer } = require("../../tools/seo.js");
module.exports = {
  layout: "hub-layout.njk",
  tags: ["hubs", "seoSeiten"],
  eleventyComputed: computedFuer("hub")
};
