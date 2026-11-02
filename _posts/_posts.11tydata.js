// Blog-Artikel. Teilt sich Slug-Logik, Canonical, Breadcrumb und OG-Bild
// mit den uebrigen Seitentypen (tools/seo.js), damit der Blog im selben
// System laeuft und nicht daneben.
//
// Der Permalink bleibt bewusst /ratgeber/<slug>/, wie bisher. Bestehende
// URLs aendern sich dadurch nicht.

const { getSlug, breadcrumbs, DOMAIN } = require("../tools/seo.js");

module.exports = {
  layout: "post-layout.njk",
  tags: ["posts", "seoSeiten"],

  eleventyComputed: {
    typ: () => "ratgeber",
    typLabel: () => "Ratgeber",

    slug: data => getSlug(data),
    permalink: data => `/ratgeber/${getSlug(data)}/index.html`,
    canonicalUrl: data => `${DOMAIN}/ratgeber/${getSlug(data)}/`,

    // Der Blog pflegt description und title ohne meta-Praefix.
    // Hier auf die gemeinsamen Feldnamen gebruecke, damit die Partials
    // fuer jeden Seitentyp dieselben Variablen lesen.
    // Der Marken-Zusatz wird nur angehaengt, wenn er in die 60 Zeichen passt.
    // Sonst steht der Titel allein da, statt abgeschnitten in der Suche zu landen.
    metaTitle: data => {
      if (data.metaTitle) return data.metaTitle;
      const basis = String(data.title || "");
      const mitMarke = `${basis} | ImmoLotse`;
      return mitMarke.length <= 60 ? mitMarke : basis;
    },
    metaDescription: data => data.metaDescription || data.description || data.excerpt || "",

    description: data => data.description || data.excerpt || "",

    ogImageUrl: data => {
      const img = data.image || "/Hero_Bild_1.webp";
      return img.startsWith("http") ? img : `${DOMAIN}${img}`;
    },
    // Altes Feld, das post-layout.njk noch verwendet
    imageUrl: data => {
      const img = data.image || "/Hero_Bild_1.webp";
      return img.startsWith("http") ? img : `${DOMAIN}${img}`;
    },

    breadcrumbs: data => breadcrumbs(data, "ratgeber", getSlug(data)),

    dateModified: data => data.dateModified || data.date,
    author: data => data.author || "ImmoLotse",

    // Ankertext fuer die automatische interne Verlinkung
    ankertext: data => data.ankertext || data.title
  }
};
