// Gemeinsame Berechnungen fuer alle Seitentypen.
// Jede _11tydata.js-Datei zieht ihre Felder hierher, damit Permalink,
// Canonical, Breadcrumb und OG-Bild nur an einer Stelle definiert sind.

const { execSync } = require("child_process");
const fs = require("fs");

const DOMAIN = "https://immolotse.at";

// Letzte echte Aenderung einer Quelldatei, aus dem Git-Log.
// Dient als lastmod-Rueckfall, damit niemand ein Datum pflegen muss und
// IndexNow trotzdem nur meldet, was sich wirklich bewegt hat.
const datumCache = new Map();
function letzteAenderung(datei) {
  if (!datei) return null;
  if (datumCache.has(datei)) return datumCache.get(datei);
  let ergebnis = null;
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${datei}"`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (iso) ergebnis = iso.slice(0, 10);
  } catch (e) {
    /* kein Git-Kontext */
  }
  if (!ergebnis) {
    try {
      ergebnis = fs.statSync(datei).mtime.toISOString().slice(0, 10);
    } catch (e) {
      ergebnis = new Date().toISOString().slice(0, 10);
    }
  }
  datumCache.set(datei, ergebnis);
  return ergebnis;
}

const BASIS = {
  hub: "/themen",
  leistung: "/leistungen",
  kosten: "/kosten",
  ratgeber: "/ratgeber"
};

const TYP_LABEL = {
  hub: "Thema",
  leistung: "Leistung",
  kosten: "Kosten",
  ratgeber: "Ratgeber"
};

// Umlaute und Sonderzeichen in URL-sichere Zeichen wandeln.
// Gleiche Regeln wie im bestehenden Blog, damit Slugs site-weit konsistent sind.
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Slug aus dem Frontmatter-Feld, sonst aus dem Dateinamen.
// Ein fuehrendes Datum (2026-05-02-) wird entfernt.
function getSlug(data) {
  if (data.slug) return slugify(data.slug);
  const fileSlug = String(data.page.fileSlug || "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return slugify(fileSlug);
}

function pfad(typ, slug) {
  return `${BASIS[typ]}/${slug}/`;
}

// Breadcrumb: Start > (Hub, falls vorhanden) > diese Seite.
// Speist gleichzeitig die sichtbare Navigation und die BreadcrumbList.
function breadcrumbs(data, typ, slug) {
  const kette = [{ name: "Start", url: "/" }];

  if (data.hub && data.collections && data.collections.hubs) {
    const eltern = data.collections.hubs.find(h => h.data.hubId === data.hub);
    if (eltern) {
      kette.push({
        name: eltern.data.breadcrumbName || eltern.data.ankertext || eltern.data.title,
        url: eltern.url
      });
    }
  } else if (typ !== "hub") {
    kette.push({ name: TYP_LABEL[typ], url: BASIS[typ] + "/" });
  }

  kette.push({ name: data.breadcrumbName || data.ankertext || data.title, url: null });
  return kette;
}

// Baut den Satz berechneter Felder fuer einen Seitentyp.
// Wird in den _11tydata.js-Dateien als eleventyComputed eingehaengt.
function computedFuer(typ) {
  return {
    typ: () => typ,
    typLabel: () => TYP_LABEL[typ],
    slug: data => getSlug(data),
    permalink: data => `${pfad(typ, getSlug(data))}index.html`,
    canonicalUrl: data => `${DOMAIN}${pfad(typ, getSlug(data))}`,

    // Faellt auf den sichtbaren Titel zurueck, damit nie ein leerer
    // Title entsteht. Die Laengengrenze erzwingt tools/validate.js.
    metaTitle: data => data.metaTitle || data.title || "",
    metaDescription: data => data.metaDescription || data.teaser || data.excerpt || "",

    ogImageUrl: data => {
      const img = (data.bild && data.bild.src) || data.image || "/Hero_Bild_1.webp";
      return img.startsWith("http") ? img : `${DOMAIN}${img}`;
    },

    breadcrumbs: data => breadcrumbs(data, typ, getSlug(data)),

    // Reihenfolge: gepflegtes Feld, sonst Veroeffentlichungsdatum,
    // sonst die letzte Git-Aenderung der Datendatei.
    dateModified: data =>
      data.dateModified || data.date || letzteAenderung(data.page && data.page.inputPath)
  };
}

module.exports = {
  DOMAIN, BASIS, TYP_LABEL, slugify, getSlug, pfad, breadcrumbs, computedFuer, letzteAenderung
};
