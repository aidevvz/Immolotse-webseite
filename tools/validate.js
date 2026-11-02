// Build-Validierung der Pflichttechnik.
//
// Diese Datei macht aus den Vorgaben harte Regeln: wird eine verletzt,
// bricht der Build ab und Netlify deployt die fehlerhafte Seite nicht.
// Eine Regel, die nur in der Dokumentation steht, ist keine Regel.
//
// Geprueft wird ausschliesslich, was maschinell entscheidbar ist.
// Inhalt und Keyword-Wahl sind ausdruecklich nicht Gegenstand.

const LIMIT_TITLE = 60;
const LIMIT_DESCRIPTION = 160;

function pruefeSeite(seite) {
  const fehler = [];
  const d = seite.data;
  const quelle = seite.inputPath;

  const metaTitle = d.metaTitle || "";
  const metaDescription = d.metaDescription || "";

  // ── Title ──────────────────────────────────────────────────────
  if (!metaTitle.trim()) {
    fehler.push("metaTitle fehlt (oder title, aus dem er abgeleitet wird)");
  } else if (metaTitle.length > LIMIT_TITLE) {
    fehler.push(
      `metaTitle ist ${metaTitle.length} Zeichen, erlaubt sind ${LIMIT_TITLE}. ` +
      `Gekuerzt werden muss: "${metaTitle}"`
    );
  }

  // ── Description ────────────────────────────────────────────────
  if (!metaDescription.trim()) {
    fehler.push("metaDescription fehlt (oder teaser/excerpt als Rueckfall)");
  } else if (metaDescription.length > LIMIT_DESCRIPTION) {
    fehler.push(
      `metaDescription ist ${metaDescription.length} Zeichen, erlaubt sind ${LIMIT_DESCRIPTION}`
    );
  }

  // ── H1 ─────────────────────────────────────────────────────────
  // Das Layout setzt genau eine H1 aus title. Fehlt title, gaebe es keine.
  if (!String(d.title || "").trim()) {
    fehler.push("title fehlt. Daraus entsteht die einzige H1 der Seite");
  }

  // ── Canonical ──────────────────────────────────────────────────
  if (!String(d.canonicalUrl || "").startsWith("https://")) {
    fehler.push("canonicalUrl fehlt oder ist nicht absolut");
  }

  // ── Ankertext fuer die automatische interne Verlinkung ─────────
  if (!String(d.ankertext || d.title || "").trim()) {
    fehler.push("ankertext fehlt. Er wird fuer Footer-, Hub- und llms.txt-Links gebraucht");
  }

  // ── Alt-Text ist Pflichtfeld, sobald ein Bild gesetzt ist ──────
  if (d.bild && d.bild.src && !String(d.bild.alt || "").trim()) {
    fehler.push(`bild.alt fehlt fuer "${d.bild.src}". Alt-Text ist Pflichtfeld`);
  }

  // ── FAQ-Eintraege brauchen beide Haelften ──────────────────────
  if (Array.isArray(d.faq)) {
    d.faq.forEach((f, i) => {
      if (!String(f.question || "").trim()) fehler.push(`faq[${i}].question ist leer`);
      if (!String(f.answer || "").trim()) fehler.push(`faq[${i}].answer ist leer`);
    });
  }

  // ── Hub-Verweis muss auf einen existierenden Hub zeigen ────────
  // Wird in pruefeAlle geprueft, weil dort alle Hubs bekannt sind.

  // ── Hub-Seiten brauchen eine hubId, sonst findet sie kein Kind ─
  if (d.typ === "hub" && !String(d.hubId || "").trim()) {
    fehler.push("hubId fehlt. Ohne sie kann keine Detailseite auf diesen Hub verweisen");
  }

  return fehler.length ? { quelle, fehler } : null;
}

function pruefeAlle(seiten) {
  const hubIds = new Set(
    seiten.filter(s => s.data.typ === "hub" && s.data.hubId).map(s => s.data.hubId)
  );

  const probleme = [];

  for (const seite of seiten) {
    const ergebnis = pruefeSeite(seite);
    const extra = [];

    if (seite.data.hub && !hubIds.has(seite.data.hub)) {
      extra.push(
        `hub: "${seite.data.hub}" zeigt auf keinen existierenden Hub. ` +
        `Vorhanden: ${[...hubIds].join(", ") || "(noch keiner)"}`
      );
    }

    if (ergebnis || extra.length) {
      probleme.push({
        quelle: seite.inputPath,
        fehler: [...(ergebnis ? ergebnis.fehler : []), ...extra]
      });
    }
  }

  // Doppelte Canonical-URLs wuerden sich gegenseitig kannibalisieren
  const gesehen = new Map();
  for (const seite of seiten) {
    const url = seite.data.canonicalUrl;
    if (!url) continue;
    if (gesehen.has(url)) {
      probleme.push({
        quelle: seite.inputPath,
        fehler: [`canonicalUrl "${url}" wird bereits von ${gesehen.get(url)} verwendet`]
      });
    } else {
      gesehen.set(url, seite.inputPath);
    }
  }

  // Zwei Schweregrade, bewusst getrennt:
  //
  // Neue datengetriebene Seiten (_seiten/) brechen den Build ab. Fuer sie
  // gilt die Pflichttechnik ab der ersten Zeile, es gibt keinen Altbestand.
  //
  // Bestehende Blog-Artikel (_posts/) werden nur gemeldet. Ihre Titel und
  // Beschreibungen sind Inhalt, und Inhalt zu aendern ist ausdruecklich
  // nicht Teil dieses Auftrags. Ein harter Abbruch wuerde jeden Deploy
  // blockieren, bis jemand Texte umschreibt.
  const blockierend = probleme.filter(p => !p.quelle.includes("/_posts/"));
  const zuMelden = probleme.filter(p => p.quelle.includes("/_posts/"));

  const alsText = liste =>
    liste.map(p => `\n  ${p.quelle}\n` + p.fehler.map(f => `    - ${f}`).join("\n")).join("");

  if (zuMelden.length) {
    console.warn(
      `\n[SEO] ${zuMelden.length} bestehende Artikel verletzen die Laengengrenzen.` +
      `\n[SEO] Der Build laeuft weiter, weil Titel und Beschreibung Inhalt sind.` +
      `\n[SEO] Zum Nacharbeiten:${alsText(zuMelden)}\n`
    );
  }

  if (blockierend.length) {
    throw new Error(
      `\n\nSEO-Pflichtfelder verletzt in ${blockierend.length} Datei(en):${alsText(blockierend)}\n\n` +
      `Der Build wurde abgebrochen, damit keine neue Seite ohne Pflichttechnik online geht.\n`
    );
  }

  return seiten;
}

module.exports = { pruefeAlle, pruefeSeite, LIMIT_TITLE, LIMIT_DESCRIPTION };
