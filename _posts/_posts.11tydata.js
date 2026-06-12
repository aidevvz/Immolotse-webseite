// Wandelt Umlaute/Sonderzeichen in URL-sichere Zeichen um
// (ö -> oe, ä -> ae, ü -> ue, ß -> ss, etc.) und entfernt alles Übrige.
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")  // alles außer Buchstaben/Zahlen/Leerzeichen/Bindestrich entfernen
    .trim()
    .replace(/[\s_]+/g, "-")        // Leerzeichen -> Bindestrich
    .replace(/-+/g, "-")            // mehrere Bindestriche -> einen
    .replace(/^-|-$/g, "");          // führende/folgende Bindestriche entfernen
}

// Ermittelt den Slug für einen Artikel:
// 1. Wenn im Frontmatter ein "slug"-Feld gesetzt ist, wird dieses verwendet
//    (durch slugify() bereinigt, damit auch hier keine Umlaute durchrutschen).
// 2. Sonst wird der Slug aus dem Dateinamen abgeleitet (Datums-Präfix entfernt)
//    und ebenfalls durch slugify() von Umlauten/Sonderzeichen befreit.
function getSlug(data) {
  if (data.slug) {
    return slugify(data.slug);
  }
  const fileSlug = data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return slugify(fileSlug);
}

module.exports = {
  layout: "post-layout.njk",
  eleventyComputed: {
    slug: (data) => getSlug(data),
    permalink: (data) => `/ratgeber/${getSlug(data)}/index.html`,
    canonicalUrl: (data) => `https://immolotse.at/ratgeber/${getSlug(data)}/`,
    imageUrl: (data) => {
      const img = data.image || "/Hero_Bild_1.webp";
      return `https://immolotse.at${img}`;
    },
    description: (data) => data.description || data.excerpt || "",
    dateModified: (data) => data.dateModified || data.date,
    author: (data) => data.author || "ImmoLotse"
  }
};
