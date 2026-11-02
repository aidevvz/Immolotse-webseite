#!/usr/bin/env node
// Meldet geaenderte URLs an IndexNow (Bing, Yandex, Seznam, Naver).
// Laeuft nach dem Eleventy-Build, siehe netlify.toml.
//
// Gemeldet wird nur, was sich wirklich geaendert hat: alle URLs, deren
// lastmod in der frisch erzeugten sitemap.xml dem heutigen Datum entspricht.
// Ein Ping mit der kompletten Seitenliste bei jedem Deploy waere Spam und
// wird von den Suchmaschinen entsprechend gewertet.
//
// Der Ping wird uebersprungen, wenn:
//   - nichts geaendert wurde
//   - der Build kein Netlify-Produktionsdeploy ist (Preview, lokal)
//   - INDEXNOW_DRYRUN=1 gesetzt ist
//
// Ein Fehler beim Ping bricht den Build NICHT ab. Eine nicht gemeldete
// URL wird ohnehin beim naechsten Crawl gefunden; ein geblockter Deploy
// waere der groessere Schaden.

const fs = require("fs");
const path = require("path");

const WURZEL = path.resolve(__dirname, "..");
const site = JSON.parse(fs.readFileSync(path.join(WURZEL, "_data/site.json"), "utf-8"));

const KEY = process.env.INDEXNOW_KEY || site.indexnow.key;
const ENDPOINT = site.indexnow.endpoint;
const HOST = new URL(site.domain).host;

function log(...a) { console.log("[IndexNow]", ...a); }

function geaenderteUrls() {
  const pfad = path.join(WURZEL, "sitemap.xml");
  if (!fs.existsSync(pfad)) {
    log("sitemap.xml nicht gefunden, nichts zu melden.");
    return [];
  }
  const xml = fs.readFileSync(pfad, "utf-8");
  const heute = new Date().toISOString().slice(0, 10);

  const urls = [];
  const bloecke = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const b of bloecke) {
    const loc = (b.match(/<loc>(.*?)<\/loc>/) || [])[1];
    const mod = (b.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
    if (loc && mod && mod.slice(0, 10) === heute) urls.push(loc);
  }
  return urls;
}

async function main() {
  // Key-Datei muss erreichbar sein, sonst weist IndexNow die Meldung ab
  const keyDatei = path.join(WURZEL, `${KEY}.txt`);
  if (!fs.existsSync(keyDatei)) {
    log(`FEHLT: ${KEY}.txt im Root. Ohne die Datei lehnt IndexNow jede Meldung ab.`);
    return;
  }

  const urls = geaenderteUrls();
  if (urls.length === 0) {
    log("Keine URL mit heutigem lastmod. Nichts zu melden.");
    return;
  }

  log(`${urls.length} geaenderte URL(s):`);
  urls.forEach(u => log("  ", u));

  const istProduktion = process.env.CONTEXT === "production";
  if (process.env.INDEXNOW_DRYRUN === "1") {
    log("DRYRUN gesetzt, es wird nicht gesendet.");
    return;
  }
  if (!istProduktion) {
    log(`Kein Produktionsdeploy (CONTEXT=${process.env.CONTEXT || "lokal"}), es wird nicht gesendet.`);
    return;
  }

  const nutzlast = { host: HOST, key: KEY, keyLocation: `${site.domain}/${KEY}.txt`, urlList: urls };

  try {
    const antwort = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(nutzlast)
    });
    // 200 = angenommen, 202 = angenommen aber Key wird noch geprueft
    log(`Antwort: HTTP ${antwort.status} ${antwort.statusText}`);
    if (antwort.status >= 400) {
      log("Meldung abgelehnt. Body:", (await antwort.text()).slice(0, 300));
    }
  } catch (e) {
    log("Ping fehlgeschlagen:", e.message);
  }
}

main().catch(e => {
  log("Unerwarteter Fehler, Build laeuft trotzdem weiter:", e.message);
});
