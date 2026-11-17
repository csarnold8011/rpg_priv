// Helyi fejlesztői szerver: kiszolgálja a felületet, és a háttérkódot (dist/Kod.gs) a Google
// szolgáltatások memóriabeli utánzatával futtatja, így a felület Google fiók nélkül kipróbálható.
//
//   node tools/helyi_szerver.js            bemutató adatokkal (DM: Arnold / sarkany1, játékosok: Anna / anna1, Bence / bence1)
//   node tools/helyi_szerver.js --ures     üres adatbázissal (a legelső belépő lesz a DM)
//   node tools/helyi_szerver.js --port 8090
//   node tools/helyi_szerver.js --szabalyok /utvonal/lapok.json   valódi szabályadat egy JSON fájlból
//       ({ "Fajok": [ { id, nev_hu, ... } ], ... }, például a Szabályadatbázis exportja). A fájl soha
//       ne kerüljön a repóba: a szabálykönyvek szövegét tartalmazza.
//
// Megnyitás: http://localhost:8080/#kapcsolat=http%3A%2F%2Flocalhost%3A8080%2Fapi
// Minden adat csak a memóriában van, leállításkor elvész. A szabályadat alapból a karakterszámoló
// tesztjének minta sorai (tools/teszt/karakter_minta.mjs, leírások nélkül), --szabalyok kapcsolóval valódi adat.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const argumentumok = process.argv.slice(2);
const PORT = Number(argumentumok[argumentumok.indexOf('--port') + 1]) || 8080;
const URES = argumentumok.includes('--ures');
const KESLELTETES = Number(argumentumok[argumentumok.indexOf('--keses') + 1]) || 300; // ms, az Apps Script lassúságának utánzása
const SZABALY_FAJL = argumentumok.includes('--szabalyok') ? argumentumok[argumentumok.indexOf('--szabalyok') + 1] : null;
const GYOKER = path.resolve(__dirname, '..');

const U = require('./teszt/utanzat').letrehoz();
const k = U.kornyezet;
k.elsoBeallitas();

function hivas(action, adat, token) {
  return JSON.parse(k.doPost({ postData: { contents: JSON.stringify({ action, token, adat }) } }).getContent());
}

// A szabályadat betöltése a memóriabeli Szabályadatbázisba (a valódi lapok oszlopai szerint).
function szabalyokBetoltese(lapok) {
  const szabaly = U.tablazatok[U.tulajdonsagok.SZABALY_ID];
  Object.keys(lapok).forEach((lap) => {
    const lapObj = szabaly.getSheetByName(lap);
    if (!lapObj || !Array.isArray(lapok[lap])) return;
    const fej = lapObj.getRange(1, 1, 1, lapObj.getLastColumn()).getValues()[0];
    lapok[lap].forEach((o) => lapObj.appendRow(fej.map((f) => {
      const v = o[f] === undefined || o[f] === null ? (f === 'aktiv' ? true : '') : o[f];
      return typeof v === 'object' ? JSON.stringify(v) : v;
    })));
  });
  k.szabalyVerzioNovelese();
}

async function indulas() {
  let lapok;
  if (SZABALY_FAJL) lapok = JSON.parse(fs.readFileSync(SZABALY_FAJL, 'utf8'));
  else {
    lapok = (await import('./teszt/karakter_minta.mjs')).LAPOK;
    // a bemutató karakterek fajai (a régi szerkezetű karakterekhez)
    lapok = { ...lapok, 'Fajok': lapok['Fajok'].concat([
      { id: 'faj_dwarf', nev_hu: 'Törp', nev_en: 'Dwarf', forras: 'Alapkönyv', reszletek: { tulajdonsag_bonusz: { tul_constitution: 1 }, sebesseg_alap: 8, elonydobasok: 2, elonytabla: [] } },
      { id: 'faj_halfling', nev_hu: 'Félszerzet', nev_en: 'Halfling', forras: 'Alapkönyv', reszletek: { tulajdonsag_bonusz: { tul_dexterity: 1 }, sebesseg_alap: 8, elonydobasok: 2, elonytabla: [] } }]) };
  }
  // bemutató dobótáblák (kitalált tartalom, csak a szerkezetük követi a könyvekét), ha a szabályadatban még nincs
  if (!lapok['Dobótáblák'] || !lapok['Dobótáblák'].length) lapok = { ...lapok, 'Dobótáblák': BEMUTATO_TABLAK };
  szabalyokBetoltese(lapok);
  if (!URES) bemutatoAdatok();
  inditas();
}

const BEMUTATO_TABLAK = [
  { id: 'bem_bolt', nev_hu: 'Bemutató: bolttípus', nev_en: 'Demo: Shop Type', forras: 'Házi', csoport: 'Bemutató', reszletek: { kocka: '3d6', sorok: [
    { t: [3, 7], e: 'Szatócsbolt', hivas: [{ tabla: 'bem_minoseg' }] },
    { t: [8, 12], e: 'Fogadó', hivas: [{ tabla: 'bem_fogado' }] },
    { t: [13, 16], e: 'Fegyverkovács', hivas: [{ tabla: 'bem_fegyver', darab: '1d6', egyedi: true }, { tabla: 'bem_minoseg' }] },
    { t: [17, 18], e: 'Kettős profilú bolt', hivas: [{ tabla: '', darab: 2, egyedi: true }] }
  ], kovetkezo: [{ tabla: 'bem_reszlet', darab: 'sarkany' }] } },
  { id: 'bem_reszlet', nev_hu: 'Bemutató: boltrészlet', nev_en: 'Demo: Shop Detail', forras: 'Házi', csoport: 'Bemutató', reszletek: { kocka: 'd6d6', sorok: [
    { t: [[1, 2], [1, 3]], e: 'A tulajdonos mindenkit megkérdez az időjárásról.' }, { t: [[1, 2], [4, 6]], e: 'Félárú kiárusítás.' },
    { t: [[3, 4], [1, 3]], e: 'Egy macska alszik a pulton.' }, { t: [[3, 4], [4, 6]], e: 'Csak cserekereskedelem.' },
    { t: [[5, 6], [1, 3]], e: 'Frissen festett, kicsit büdös.' }, { t: [[5, 6], [4, 6]], e: 'A raktárban valami mocorog.' }
  ] } },
  { id: 'bem_minoseg', nev_hu: 'Bemutató: minőség', nev_en: 'Demo: Quality', forras: 'Házi', csoport: 'Bemutató', reszletek: { kocka: '3d6', sorok: [
    { t: [3, 6], e: 'Gyenge holmi' }, { t: [7, 13], e: 'Átlagos' }, { t: [14, 18], e: 'Kiváló, +{szam} bónusz', szam: { alap: 'sarkany', oszto: 3, kerekit: 'fel' } }
  ] } },
  { id: 'bem_fogado', nev_hu: 'Bemutató: fogadó', nev_en: 'Demo: Inn', forras: 'Házi', csoport: 'Bemutató', reszletek: { kocka: '1d6', sorok: [
    { t: [1, 2], e: 'Tiszta szobák, korai zárás' }, { t: [3, 4], e: 'Zenés esték, hangos vendégek' }, { t: [5, 6], e: 'Titkos kártyaterem a pincében' }
  ] } },
  { id: 'bem_fegyver', nev_hu: 'Bemutató: fegyvercsoport', nev_en: 'Demo: Weapon Group', forras: 'Házi', csoport: 'Bemutató', reszletek: { kocka: 'd6d6', sorok: [
    { t: [[1, 2], [1, 3]], e: 'Fejszék' }, { t: [[1, 2], [4, 6]], e: 'Buzogányok' }, { t: [[3, 4], [1, 6]], e: 'Kardok' },
    { t: [[5, 5], [1, 6]], e: 'Íjak' }, { t: [[6, 6], [1, 4]], e: 'Botok' }, { t: [[6, 6], [5, 6]], e: 'Tűzfegyverek' }
  ] } }
];

function bemutatoAdatok() {
  const dm = hivas('login', { nev: 'Arnold', jelszo: 'sarkany1' }).token;
  const anna = hivas('users.admin', { muvelet: 'letrehoz', nev: 'Anna', jelszo: 'anna1', szerep: 'jatekos' }, dm).felhasznalo;
  const bence = hivas('users.admin', { muvelet: 'letrehoz', nev: 'Bence', jelszo: 'bence1', szerep: 'jatekos' }, dm).felhasznalo;
  const kampany = hivas('campaign.create', { cim: 'Az elveszett torony', mesterjatekos_id: anna.id, allapot: 'folyamatban' }, dm).kampany;
  hivas('campaign.create', { cim: 'Téli mesék', allapot: 'előkészítés' }, dm);
  const dorn = hivas('character.create', { nev: 'Dorn', jatekos_id: bence.id, kampany_id: kampany.id, adat: {
    faj: 'faj_dwarf', osztaly: 'osz_warrior', szint: 2,
    tulajdonsagok: { tul_accuracy: 1, tul_communication: 0, tul_constitution: 3, tul_dexterity: 0, tul_fighting: 3, tul_intelligence: -1, tul_perception: 1, tul_strength: 2, tul_willpower: 1 },
    fokuszok: ['fok_fighting_bludgeons', 'fok_constitution_drinking'], egeszseg: { aktualis: 27, max: 34 }, vedekezes: 10, sebesseg: 8, pancelertek: 5 } }, dm).karakter;
  hivas('character.create', { nev: 'Pöttöm', kampany_id: kampany.id, adat: {
    faj: 'faj_halfling', osztaly: 'osz_rogue', szint: 2,
    tulajdonsagok: { tul_accuracy: 2, tul_communication: 1, tul_constitution: 0, tul_dexterity: 3, tul_fighting: 0, tul_intelligence: 1, tul_perception: 2, tul_strength: -1, tul_willpower: 0 },
    fokuszok: ['fok_dexterity_stealth', 'fok_perception_searching'], egeszseg: { aktualis: 6, max: 26 }, vedekezes: 13, sebesseg: 11, pancelertek: 3 } }, dm);
  hivas('character.create', { nev: 'Lysa', jatekos_id: anna.id, adat: { faj: 'Elf', osztaly: 'osz_mage', szint: 1,
    egeszseg: { aktualis: 20, max: 20 }, magiapont: { aktualis: 12, max: 15 } } }, dm);
  const bt = hivas('login', { nev: 'Bence', jelszo: 'bence1' }).token;
  hivas('roll.log', { kampany_id: kampany.id, karakter_id: dorn.id, mire: 'Szívósság (Ivás)', kockak: [4, 4, 5], modosito: 5, celertek: 13, eredmeny: 'siker', mutatvanypont: 5 }, bt);
  hivas('roll.log', { kampany_id: kampany.id, mire: 'Csapda (rejtett)', kockak: [1, 2, 6], modosito: 0, rejtett: true }, dm);
}

const TIPUSOK = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

function inditas() {
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api')) {
    let torzs = '';
    req.on('data', (d) => { torzs += d; });
    req.on('end', () => setTimeout(() => {
      const v = k.doPost({ postData: { contents: torzs } });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(v.getContent());
    }, KESLELTETES));
    return;
  }
  const ut = decodeURIComponent(req.url.split(/[?#]/)[0]);
  const fajl = path.resolve(GYOKER, '.' + (ut.endsWith('/') ? ut + 'index.html' : ut));
  if (!fajl.startsWith(GYOKER + path.sep) || /[\\/]\.|[\\/]tools[\\/]|[\\/]backend[\\/]/.test(fajl.slice(GYOKER.length))) {
    res.writeHead(404); res.end(); return;
  }
  fs.readFile(fajl, (hiba, adat) => {
    if (hiba) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Nincs ilyen fájl.'); return; }
    res.writeHead(200, { 'Content-Type': TIPUSOK[path.extname(fajl)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(adat);
  });
}).listen(PORT, () => {
  const api = `http://localhost:${PORT}/api`;
  console.log(`Helyi szerver: http://localhost:${PORT}/#kapcsolat=${encodeURIComponent(api)}`);
  console.log(URES ? 'Üres adatbázis: a legelső belépő lesz a DM.' : 'Belépés: Arnold / sarkany1 (DM), Anna / anna1 (mesterjátékos), Bence / bence1');
  console.log(SZABALY_FAJL ? 'Szabályadat: ' + SZABALY_FAJL : 'Szabályadat: a karakterszámoló tesztjének minta sorai.');
});
}

indulas().catch((e) => { console.error(e); process.exit(1); });
