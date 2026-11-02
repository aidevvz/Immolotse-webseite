// Die handgebauten Seiten, die nicht aus der Datenstruktur entstehen.
// Sie gehoeren trotzdem in Sitemap und llms.txt, darum stehen sie hier
// und nicht fest verdrahtet in sitemap.njk.
//
// lastmod kommt aus dem Git-Log der jeweiligen Datei, nicht aus einem
// handgepflegten Datum. Dadurch ist es immer der Zeitpunkt der letzten
// echten Aenderung, und IndexNow meldet nur, was sich wirklich bewegt hat.

const { execSync } = require("child_process");
const fs = require("fs");

function letzteAenderung(datei) {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${datei}"`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (iso) return iso.slice(0, 10);
  } catch (e) {
    // Kein Git-Kontext (z.B. frischer Checkout ohne Historie)
  }
  try {
    return fs.statSync(datei).mtime.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

const seiten = [
  { url: "/",             datei: "index.html",      prioritaet: "1.0", changefreq: "weekly",  ankertext: "Startseite" },
  { url: "/shop",         datei: "shop.html",       prioritaet: "0.9", changefreq: "weekly",  ankertext: "Leistungen und Pakete" },
  { url: "/blog",         datei: "blog-source.njk", prioritaet: "0.8", changefreq: "weekly",  ankertext: "Ratgeber" },
  { url: "/ueber-uns",    datei: "ueber-uns.html",  prioritaet: "0.7", changefreq: "monthly", ankertext: "Ueber uns" },
  { url: "/impressum",    datei: "impressum.html",  prioritaet: "0.3", changefreq: "yearly",  ankertext: "Impressum, Datenschutz und AGB" }
];

module.exports = seiten.map(s => ({ ...s, lastmod: letzteAenderung(s.datei) }));
