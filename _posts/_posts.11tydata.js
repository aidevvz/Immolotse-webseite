module.exports = {
  layout: "post-layout.njk",
  eleventyComputed: {
    // Slug ohne Datums-Präfix ableiten (z.B. "2026-05-02-mein-titel" -> "mein-titel")
    slug: (data) => {
      return data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    },
    permalink: (data) => {
      const slug = data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      return `/ratgeber/${slug}/index.html`;
    },
    canonicalUrl: (data) => {
      const slug = data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      return `https://immolotse.at/ratgeber/${slug}/`;
    },
    imageUrl: (data) => {
      const img = data.image || "/Hero_Bild_1.webp";
      return `https://immolotse.at${img}`;
    },
    description: (data) => data.description || data.excerpt || "",
    dateModified: (data) => data.dateModified || data.date,
    author: (data) => data.author || "ImmoLotse"
  }
};
