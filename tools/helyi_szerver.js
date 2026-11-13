// Helyi fejlesztői szerver: kiszolgálja a felületet, és a háttérkódot (dist/Kod.gs) a Google
// szolgáltatások memóriabeli utánzatával futtatja, így a felület Google fiók nélkül kipróbálható.
//
//   node tools/helyi_szerver.js            bemutató adatokkal (DM: Arnold / sarkany1, játékosok: Anna / anna1, Bence / bence1)
//   node tools/helyi_szerver.js --ures     üres adatbázissal (a legelső belépő lesz a DM)
//   node tools/helyi_szerver.js --port 8090
//
// Megnyitás: http://localhost:8080/#kapcsolat=http%3A%2F%2Flocalhost%3A8080%2Fapi
// Minden adat csak a memóriában van, leállításkor elvész. A szabályadat itt csak néhány minta sor.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const argumentumok = process.argv.slice(2);
const PORT = Number(argumentumok[argumentumok.indexOf('--port') + 1]) || 8080;
const URES = argumentumok.includes('--ures');
const KESLELTETES = Number(argumentumok[argumentumok.indexOf('--keses') + 1]) || 300; // ms, az Apps Script lassúságának utánzása
const GYOKER = path.resolve(__dirname, '..');

const U = require('./teszt/utanzat').letrehoz();
const k = U.kornyezet;
k.elsoBeallitas();

function hivas(action, adat, token) {
  return JSON.parse(k.doPost({ postData: { contents: JSON.stringify({ action, token, adat }) } }).getContent());
}

if (!URES) bemutatoAdatok();

function bemutatoAdatok() {
  const szabaly = U.tablazatok[U.tulajdonsagok.SZABALY_ID];
  const sor = (lap, o) => {
    const lapObj = szabaly.getSheetByName(lap);
    const fej = lapObj.getRange(1, 1, 1, lapObj.getLastColumn()).getValues()[0];
    lapObj.appendRow(fej.map((f) => {
      const v = o[f] === undefined ? (f === 'aktiv' ? true : '') : o[f];
      return typeof v === 'object' ? JSON.stringify(v) : v;
    }));
  };
  [['accuracy', 'Pontosság', 'Accuracy'], ['communication', 'Kommunikáció', 'Communication'], ['constitution', 'Szívósság', 'Constitution'],
    ['dexterity', 'Ügyesség', 'Dexterity'], ['fighting', 'Harc', 'Fighting'], ['intelligence', 'Intelligencia', 'Intelligence'],
    ['perception', 'Észlelés', 'Perception'], ['strength', 'Erő', 'Strength'], ['willpower', 'Akaraterő', 'Willpower']]
    .forEach(([id, hu, en], i) => sor('Tulajdonságok', { id: 'tul_' + id, nev_hu: hu, nev_en: en, forras: 'Alapkönyv', sorrend: i + 1, leiras_hu: 'Minta sor a helyi szerverhez.' }));
  [['perception_searching', 'Keresés', 'Searching', 'perception'], ['dexterity_stealth', 'Lopakodás', 'Stealth', 'dexterity'],
    ['fighting_bludgeons', 'Zúzófegyverek', 'Bludgeons', 'fighting'], ['constitution_drinking', 'Ivás', 'Drinking', 'constitution']]
    .forEach(([id, hu, en, t]) => sor('Fókuszok', { id: 'fok_' + id, nev_hu: hu, nev_en: en, forras: 'Alapkönyv', tulajdonsag: 'tul_' + t }));
  sor('Fajok', { id: 'faj_dwarf', nev_hu: 'Törp', nev_en: 'Dwarf', forras: 'Alapkönyv' });
  sor('Fajok', { id: 'faj_halfling', nev_hu: 'Félszerzet', nev_en: 'Halfling', forras: 'Alapkönyv' });
  sor('Osztályok', { id: 'osz_warrior', nev_hu: 'Harcos', nev_en: 'Warrior', forras: 'Alapkönyv' });
  sor('Osztályok', { id: 'osz_rogue', nev_hu: 'Tolvaj', nev_en: 'Rogue', forras: 'Alapkönyv' });
  sor('Osztályok', { id: 'osz_mage', nev_hu: 'Mágus', nev_en: 'Mage', forras: 'Alapkönyv' });
  k.szabalyVerzioNovelese();

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
});
