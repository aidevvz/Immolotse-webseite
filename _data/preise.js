// Abgeleitete Preiswerte, damit Templates nicht rechnen muessen und
// nirgends eine Zahl haendisch gepflegt wird.
//
// Wichtig: "ab"-Preise beruecksichtigen nur Pauschalpreise. Der
// Reinigungsservice kostet 3 EUR pro Quadratmeter. Als "Einzelleistungen
// ab 3 Euro" waere das irrefuehrend, darum fliesst er hier nicht ein.

const firma = require("./firma.json");

const pakete = firma.pakete.filter(p => typeof p.preis === "number");
const pauschalLeistungen = firma.leistungen.filter(
  l => typeof l.preis === "number" && l.einheit === "pauschal"
);

module.exports = {
  preisAb: Math.min(...pakete.map(p => p.preis)),
  preisMax: Math.max(...pakete.map(p => p.preis)),
  preisMitte: pakete
    .map(p => p.preis)
    .sort((a, b) => a - b)[Math.floor(pakete.length / 2)],
  preisLeistungAb: Math.min(...pauschalLeistungen.map(l => l.preis)),
  serviceStart: firma.serviceStart
};
