const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {

  // ── Verhindert dass Eleventy Frontmatter-Daten als JS Date parsed ──
  // Ohne das werden ISO-Daten (2026-07-12) als UTC Mitternacht interpretiert,
  // was auf Netlify (UTC) dazu führt dass Artikel als "zukünftig" gelten
  // und vom Build ausgeschlossen werden.
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: false,
  });

  // Eleventy filtert Artikel mit Datum > heute automatisch aus.
  // Wir deaktivieren das explizit:
  eleventyConfig.setDataDeepMerge(true);

  // ── Markdown-Renderer anpassen: Tabellen bekommen die bestehende CSS-Klasse ──
  const markdownIt = require("markdown-it");
  const md = markdownIt({ html: true, breaks: false, linkify: true });
  md.renderer.rules.table_open = () => '<table class="post-table">';
  eleventyConfig.setLibrary("md", md);


  // ── Datums-Filter ──────────────────────────────────────────────
  // Wandelt Frontmatter-Daten wie "03. May 2026" oder "2026-05-03"
  // in ein ISO-Datum (2026-05-03) für Schema.org um.
  eleventyConfig.addFilter("isoDate", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      return DateTime.fromJSDate(value).toISODate();
    }
    const str = String(value).trim();

    // Schon ISO? (2026-05-03)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }

    // Format "DD. Month YYYY" (Deutsch oder Englisch gemischt)
    const months = {
      januar: "01", jänner: "01", january: "01", jan: "01",
      februar: "02", february: "02", feb: "02",
      märz: "03", march: "03", mar: "03",
      april: "04", apr: "04",
      mai: "05", may: "05",
      juni: "06", june: "06", jun: "06",
      juli: "07", july: "07", jul: "07",
      august: "08", aug: "08",
      september: "09", sep: "09", sept: "09",
      oktober: "10", october: "10", okt: "10", oct: "10",
      november: "11", nov: "11",
      dezember: "12", december: "12", dez: "12", dec: "12"
    };
    const m = str.match(/(\d{1,2})\.?\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
    if (m) {
      const day = m[1].padStart(2, "0");
      const monthKey = m[2].toLowerCase();
      const month = months[monthKey] || "01";
      const year = m[3];
      return `${year}-${month}-${day}`;
    }
    return str;
  });

  // ── Anzeige-Datum (Deutsch, lesbar) ───────────────────────────
  eleventyConfig.addFilter("displayDate", (value) => {
    const iso = eleventyConfig.getFilter("isoDate")(value);
    const dt = DateTime.fromISO(iso);
    if (!dt.isValid) return value;
    return dt.setLocale("de-AT").toFormat("d. MMMM yyyy");
  });

  // ── Vollständiges ISO 8601 mit Zeitzonen-Offset (für Schema.org) ──
  // Wandelt ein einfaches Datum (YYYY-MM-DD) in z.B. 2026-05-03T09:00:00+02:00 um.
  // Zeitzone Europe/Vienna -> Offset (+01:00 / +02:00) wird automatisch
  // anhand von Sommer-/Winterzeit berechnet, nicht fest verdrahtet.
  eleventyConfig.addFilter("isoDateTime", (value) => {
    const iso = eleventyConfig.getFilter("isoDate")(value);
    const dt = DateTime.fromISO(iso, { zone: "Europe/Vienna" }).set({
      hour: 9, minute: 0, second: 0, millisecond: 0
    });
    if (!dt.isValid) return iso;
    return dt.toISO({ suppressMilliseconds: true });
  });

  // ── Lesbare Kategorie-Labels (siehe admin/config.yml) ─────────
  const categoryLabels = {
    verkauf: "Verkauf & Strategie",
    expose: "Exposé & Präsentation",
    fotografie: "Fotografie",
    rechtliches: "Rechtliches",
    preisfindung: "Preisfindung",
    willhaben: "Willhaben Tipps",
    steuer: "Steuer",
    kosten: "Kosten"
  };
  eleventyConfig.addFilter("categoryLabel", (value) => {
    return categoryLabels[value] || "Ratgeber";
  });

  // ── JSON-Filter für Schema-Strings (Anführungszeichen escapen) ─
  eleventyConfig.addFilter("jsonEscape", (value) => {
    return JSON.stringify(String(value || "")).slice(1, -1);
  });

  // ── Blog-Posts Collection aus /_posts ─────────────────────────
  // Eleventy leitet den Slug automatisch aus dem Dateinamen ab
  // (Datum-Präfix wird entfernt, z.B. 2026-05-02-mein-titel.md -> mein-titel)
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("_posts/*.md")
      .filter(post => {
        // Nur published:false ausschließen, NIEMALS nach Datum filtern
        return post.data.published !== false;
      })
      .sort((a, b) => {
        const isoDate = eleventyConfig.getFilter("isoDate");
        const da = new Date(isoDate(a.data.date) + "T12:00:00+02:00");
        const db = new Date(isoDate(b.data.date) + "T12:00:00+02:00");
        return db - da; // neueste zuerst
      });
  });

  // ── Statische Dateien NICHT anfassen ──────────────────────────
  // Alles außer _posts/*.md und _includes bleibt 1:1 wie es ist,
  // weil templateFormats unten nur "md" und "njk" enthält.

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "."
    },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/"
  };
};
