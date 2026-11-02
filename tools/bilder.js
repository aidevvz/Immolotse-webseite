#!/usr/bin/env node
// Bild-Pipeline: beliebiges Eingangsformat -> WebP, maximal 1400 px breit.
//
// Aufruf:
//   node tools/bilder.js <datei-oder-ordner> [...]
//   npm run bilder -- images/roh/
//
// Bewusste Entscheidungen:
//   - Nur herunterskalieren, nie hochrechnen. Ein 900-px-Bild bleibt 900 px.
//   - Seitenverhaeltnis bleibt immer erhalten. Es wird nie zugeschnitten,
//     damit auf Teamfotos keine Gesichter abgeschnitten werden.
//   - Das Original wird nicht geloescht.

const fs = require("fs");
const path = require("path");

const MAX_BREITE = 1400;
const QUALITAET = 82;
const ENDUNGEN = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"];

let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  console.error(
    "\nsharp ist nicht installiert.\n" +
    "  npm install --save-dev sharp\n" +
    "Die Pipeline ist bewusst ein eigener Schritt und kein Teil des\n" +
    "Netlify-Builds: Bilder werden einmal konvertiert und eingecheckt,\n" +
    "statt bei jedem Deploy neu gerechnet zu werden.\n"
  );
  process.exit(1);
}

function sammle(eingabe) {
  const stat = fs.statSync(eingabe);
  if (stat.isFile()) return [eingabe];
  return fs.readdirSync(eingabe)
    .map(f => path.join(eingabe, f))
    .filter(f => fs.statSync(f).isFile())
    .filter(f => ENDUNGEN.includes(path.extname(f).toLowerCase()));
}

async function konvertiere(datei) {
  const bild = sharp(datei);
  const meta = await bild.metadata();

  const zielBreite = Math.min(meta.width || MAX_BREITE, MAX_BREITE);
  const ziel = path.join(
    path.dirname(datei),
    path.basename(datei, path.extname(datei)) + ".webp"
  );

  if (path.resolve(ziel) === path.resolve(datei) && (meta.width || 0) <= MAX_BREITE) {
    console.log(`  uebersprungen (schon WebP und <= ${MAX_BREITE} px): ${datei}`);
    return;
  }

  await bild
    // withoutEnlargement verhindert Hochrechnen, fit "inside" haelt
    // das Seitenverhaeltnis und schneidet nichts ab.
    .resize({ width: zielBreite, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITAET })
    .toFile(ziel + ".tmp");

  fs.renameSync(ziel + ".tmp", ziel);
  const neu = await sharp(ziel).metadata();
  const vorher = (fs.statSync(datei).size / 1024).toFixed(0);
  const nachher = (fs.statSync(ziel).size / 1024).toFixed(0);
  console.log(
    `  ${path.basename(datei)} ${meta.width}x${meta.height} ${vorher} KB` +
    `  ->  ${path.basename(ziel)} ${neu.width}x${neu.height} ${nachher} KB`
  );
}

async function main() {
  const eingaben = process.argv.slice(2);
  if (!eingaben.length) {
    console.log("Aufruf: node tools/bilder.js <datei-oder-ordner> [...]");
    process.exit(0);
  }
  for (const e of eingaben) {
    if (!fs.existsSync(e)) {
      console.error(`nicht gefunden: ${e}`);
      continue;
    }
    console.log(`\n${e}`);
    for (const datei of sammle(e)) {
      try {
        await konvertiere(datei);
      } catch (err) {
        console.error(`  FEHLER bei ${datei}: ${err.message}`);
      }
    }
  }
  console.log(
    `\nFertig. Alt-Text nicht vergessen: er ist im Datenmodell Pflichtfeld\n` +
    `(bild.alt), und der Build bricht ohne ihn ab.\n`
  );
}

main();
