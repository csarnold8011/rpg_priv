// A háttérkód helyi tesztje: a Google szolgáltatásokat memóriában utánozza,
// és végigjátssza a fő forgatókönyveket. Futtatás: node tools/teszt/futtat.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

// ---------- Google szolgáltatások utánzata ----------
let idSzamlalo = 0;
const ujId = () => 'id' + (++idSzamlalo);
const tarolt = (v) => (typeof v === 'string' && v.startsWith("'")) ? v.slice(1) : v;

class Tartomany {
  constructor(lap, r, c, nr, nc) { Object.assign(this, { lap, r, c, nr, nc }); }
  getValues() {
    const ki = [];
    for (let i = 0; i < this.nr; i++) {
      const sor = [];
      for (let j = 0; j < this.nc; j++) {
        const s = this.lap.adat[this.r - 1 + i];
        sor.push(s && s[this.c - 1 + j] !== undefined ? s[this.c - 1 + j] : '');
      }
      ki.push(sor);
    }
    return ki;
  }
  setValues(v) {
    v.forEach((sor, i) => sor.forEach((x, j) => this.lap.cella(this.r + i, this.c + j, x)));
    return this;
  }
  setValue(x) { this.lap.cella(this.r, this.c, x); return this; }
  setFontWeight() { return this; }
}

class Lap {
  constructor(nev) { this.nev = nev; this.adat = []; }
  cella(r, c, x) {
    while (this.adat.length < r) this.adat.push([]);
    this.adat[r - 1][c - 1] = tarolt(x);
  }
  getName() { return this.nev; }
  getLastRow() { return this.adat.length; }
  getLastColumn() { return this.adat.reduce((m, s) => Math.max(m, s.length), 0); }
  getDataRange() { return new Tartomany(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(r, c, nr, nc) { return new Tartomany(this, r, c, nr || 1, nc || 1); }
  appendRow(sor) { this.adat.push(sor.map(tarolt)); }
  deleteRow(r) { this.adat.splice(r - 1, 1); }
  setFrozenRows() {}
}

class Tablazat {
  constructor(cim) { this.id = ujId(); this.cim = cim; this.lapok = [new Lap('Munkalap1')]; }
  getId() { return this.id; }
  getUrl() { return 'https://docs/' + this.id; }
  getSheetByName(n) { return this.lapok.find(l => l.nev === n) || null; }
  insertSheet(n) { const l = new Lap(n); this.lapok.push(l); return l; }
  getSheets() { return this.lapok.slice(); }
  deleteSheet(l) { this.lapok = this.lapok.filter(x => x !== l); }
}

const tablazatok = {};
const fajlok = {};
class Mappa {
  constructor(nev) { this.id = ujId(); this.nev = nev; this.almappak = []; }
  getId() { return this.id; }
  getUrl() { return 'https://drive/' + this.id; }
  getFilesByType() { const t = Object.entries(fajlok).filter(([, f]) => f.szulo === this.id).map(([id, f]) => fajlObj(id)); let i = 0; return { hasNext: () => i < t.length, next: () => t[i++] }; }
  getFoldersByName(n) { const t = this.almappak.filter(m => m.nev === n); let i = 0; return { hasNext: () => i < t.length, next: () => t[i++] }; }
  createFolder(n) { const m = new Mappa(n); this.almappak.push(m); return m; }
}
const gyoker = new Mappa('root');
const fajlObj = (id) => ({ getId: () => id, getName: () => fajlok[id].cim, setName: (n) => { fajlok[id].cim = n; }, getMimeType: () => 'sheets', isTrashed: () => false, moveTo: (m) => { fajlok[id].szulo = m.id; } });
function mappaKeres(m, id) { if (m.id === id) return m; for (const a of m.almappak) { const x = mappaKeres(a, id); if (x) return x; } return null; }
const tulajdonsagok = {};
const gyorsitotar = {};

const kornyezet = {
  console,
  SpreadsheetApp: {
    openById: (id) => { if (!tablazatok[id]) throw new Error('nincs tábla'); return tablazatok[id]; },
    create: (cim) => { const t = new Tablazat(cim); tablazatok[t.id] = t; fajlok[t.id] = { cim, mime: 'sheets' }; return t; }
  },
  DriveApp: {
    getRootFolder: () => gyoker,
    getFilesByName: (n) => { const t = Object.entries(fajlok).filter(([, f]) => f.cim === n).map(([id]) => fajlObj(id)); let i = 0; return { hasNext: () => i < t.length, next: () => t[i++] }; },
    getFileById: (id) => Object.assign(fajlObj(id), { makeCopy: () => ({ getUrl: () => 'x' }) }),
    getFolderById: (id) => mappaKeres(gyoker, id)
  },
  MimeType: { GOOGLE_SHEETS: 'sheets' },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: k => (k in tulajdonsagok ? tulajdonsagok[k] : null),
    setProperty: (k, v) => { tulajdonsagok[k] = String(v); },
    deleteProperty: k => { delete tulajdonsagok[k]; }
  }) },
  CacheService: { getScriptCache: () => ({
    get: k => (k in gyorsitotar ? gyorsitotar[k] : null),
    put: (k, v) => { gyorsitotar[k] = String(v); },
    putAll: o => Object.assign(gyorsitotar, o),
    getAll: ks => Object.fromEntries(ks.filter(k => k in gyorsitotar).map(k => [k, gyorsitotar[k]])),
    remove: k => { delete gyorsitotar[k]; },
    removeAll: ks => ks.forEach(k => delete gyorsitotar[k])
  }) },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()),
    computeHmacSha256Signature: (v, k) => Array.from(crypto.createHmac('sha256', k).update(v, 'utf8').digest()),
    base64Encode: (b) => Buffer.from(typeof b === 'string' ? Buffer.from(b, 'utf8') : b).toString('base64'),
    base64EncodeWebSafe: (b) => Buffer.from(typeof b === 'string' ? Buffer.from(b, 'utf8') : b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    base64DecodeWebSafe: (s) => Array.from(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
    getUuid: () => crypto.randomUUID(),
    newBlob: (x) => ({ getBytes: () => Array.from(Buffer.from(x, 'utf8')), getDataAsString: () => Buffer.from(x).toString('utf8') }),
    formatDate: () => '2026-11-13'
  },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }) },
  Logger: { log: () => {} },
  ScriptApp: {}
};
vm.createContext(kornyezet);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'Kod.gs'), 'utf8'), kornyezet);

// ---------- Segédek ----------
function hivas(action, adat, token) {
  const v = kornyezet.doPost({ postData: { contents: JSON.stringify({ action, token, adat }) } });
  return JSON.parse(v.getContent());
}
let hibak = 0;
function ellenoriz(feltetel, leiras, extra) {
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---------- Forgatókönyv ----------
kornyezet.elsoBeallitas();
const jatek = tablazatok[tulajdonsagok.JATEK_ID];
ellenoriz(!!jatek.getSheetByName('Karakterek') && !jatek.getSheetByName('Munkalap1'), 'elsoBeallitas: lapok létrejöttek, alapértelmezett lap törölve');
kornyezet.elsoBeallitas();
ellenoriz(jatek.getSheetByName('Karakterek').getLastRow() === 1, 'elsoBeallitas többször futtatható');

let v = hivas('login', { nev: 'Arnold', jelszo: 'sarkany1' });
ellenoriz(v.ok && v.elso_belepes && v.felhasznalo.szerep === 'dm', 'legelső belépés DM-et hoz létre', v);
const dm = v.token;
ellenoriz(!hivas('login', { nev: 'Valaki', jelszo: 'xxxx' }).ok, 'második ismeretlen belépés nem hoz létre felhasználót');

const anna = hivas('users.admin', { muvelet: 'letrehoz', nev: 'Anna', jelszo: 'anna1', szerep: 'jatekos' }, dm).felhasznalo;
const bence = hivas('users.admin', { muvelet: 'letrehoz', nev: 'Bence', jelszo: 'bence1', szerep: 'jatekos' }, dm).felhasznalo;
ellenoriz(anna && bence, 'DM létrehozza a játékosokat');

const annaT = hivas('login', { nev: 'anna', jelszo: 'anna1' }).token;
const bencT = hivas('login', { nev: 'Bence', jelszo: 'bence1' }).token;
ellenoriz(annaT && bencT, 'játékosok belépnek (név kisbetűvel is)');
ellenoriz(hivas('users.admin', { muvelet: 'lista' }, annaT).hiba === 'nincs_jogosultsag', 'játékos nem kezelhet felhasználókat');

v = hivas('campaign.create', { cim: 'Az elveszett torony', mesterjatekos_id: anna.id }, dm);
const kampany = v.kampany;
ellenoriz(v.ok && kampany.sajat_szerep === 'dm', 'DM kampányt hoz létre, Anna a mesterjátékos');

v = hivas('character.create', { nev: 'Pöttöm', adat: { faj: 'Félszerzet', osztaly: 'Tolvaj', szint: 1 } }, dm);
const pottom = v.karakter;
ellenoriz(v.ok && pottom.jatekos_id === '' && pottom.faj === 'Félszerzet', 'DM játékos nélküli karaktert hoz létre (gyerek karaktere)');
ellenoriz(hivas('characters.list', {}, annaT).karakterek.length === 0, 'Anna még nem látja (nincs a kampányban)');

ellenoriz(hivas('campaign.addCharacter', { kampany_id: kampany.id, karakter_id: pottom.id }, dm).ok, 'DM kampányhoz rendeli');
const lista = hivas('characters.list', {}, annaT).karakterek;
ellenoriz(lista.length === 1 && lista[0].irhato, 'mesterjátékos látja és írhatja a kampány karakterét');

v = hivas('character.save', { id: pottom.id, verzio: 1, adat: { nev: 'Pöttöm', faj: 'Félszerzet', osztaly: 'Tolvaj', szint: 2, egeszseg: 30 } }, annaT);
ellenoriz(v.ok && v.verzio === 2, 'mesterjátékos ment, a verzió nő', v);
v = hivas('character.save', { id: pottom.id, verzio: 1, adat: { nev: 'Pöttöm' } }, dm);
ellenoriz(v.hiba === 'utkozes' && v.aktualis && v.aktualis.verzio === 2, 'régi verzióra mentés ütközést jelez, visszaadja az aktuálisat', v);
ellenoriz(hivas('character.save', { id: pottom.id, verzio: 2, adat: { nev: 'X' } }, bencT).hiba === 'nincs_jogosultsag', 'Bence nem szerkesztheti');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).hiba === 'nincs_jogosultsag', 'Bence nem látja a kampányt, amíg nincs benne karaktere');

v = hivas('character.create', { nev: 'Bence önálló hőse' }, bencT);
const bhos = v.karakter;
ellenoriz(v.ok && bhos.jatekos_id === bence.id && bhos.kampanyok.length === 0, 'játékos kampány nélkül hoz létre saját karaktert');
v = hivas('character.create', { nev: 'Morg', kampany_id: kampany.id }, annaT);
ellenoriz(v.ok && v.karakter.jatekos_id === '' && v.karakter.kampanyok[0] === kampany.id, 'mesterjátékos a kampányába hoz létre karaktert');
const morg = v.karakter;

ellenoriz(hivas('character.assign', { karakter_id: morg.id, jatekos_id: bence.id }, dm).ok, 'DM Bencéhez társítja Morgot');
ellenoriz(hivas('character.assign', { karakter_id: morg.id, jatekos_id: anna.id }, bencT).hiba === 'nincs_jogosultsag', 'társítani csak a DM tud');

const verzioElotte = hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio;
v = hivas('roll.log', { kampany_id: kampany.id, mire: 'Lopakodás', kockak: [3, 3, 5], modosito: 2, celertek: 11, eredmeny: 'siker', mutatvanypont: 5, id: 'dobas-1' }, bencT);
ellenoriz(v.ok && !v.dobas.rejtett, 'Bence dobást naplóz');
hivas('roll.log', { kampany_id: kampany.id, mire: 'Lopakodás', kockak: [3, 3, 5], modosito: 2, id: 'dobas-1' }, bencT);
hivas('roll.log', { kampany_id: kampany.id, mire: 'Csapda (rejtett)', kockak: [1, 2, 6], modosito: 0, rejtett: true }, dm);
hivas('roll.log', { kampany_id: kampany.id, mire: 'Próbálkozás rejtve', kockak: [1, 1, 1], rejtett: true }, bencT);
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio > verzioElotte, 'a dobás növeli a kampányverziót');

const bAll = hivas('state.get', { kampany_id: kampany.id }, bencT);
ellenoriz(bAll.ok && bAll.kampany.sajat_szerep === 'jatekos' && bAll.kampany.dm_jegyzet === undefined, 'Bence látja a kampányt játékosként, DM jegyzet nélkül', bAll);
const bMorg = bAll.karakterek.find(c => c.id === morg.id), bPottom = bAll.karakterek.find(c => c.id === pottom.id);
ellenoriz(bMorg.adat && !bPottom.adat, 'saját karakterét teljesen, a többit csak névsorként látja');
ellenoriz(bAll.dobasok.length === 2 && bAll.dobasok.every(d => !d.rejtett), 'dupla küldés kiszűrve, rejtett DM-dobás nem látszik, játékos nem dobhat rejtve', bAll.dobasok);
const dAll = hivas('state.get', { kampany_id: kampany.id }, dm);
ellenoriz(dAll.dobasok.length === 3 && dAll.kampany.dm_jegyzet !== undefined, 'a DM a rejtett dobást is látja');
const aAll = hivas('state.get', { kampany_id: kampany.id }, annaT);
ellenoriz(aAll.kampany.sajat_szerep === 'mester' && aAll.karakterek.every(c => c.adat), 'mesterjátékos minden karaktert teljesen lát');

hivas('share.send', { kampany_id: kampany.id, cimzett: pottom.id, tipus: 'level', cim: 'Titkos levél' }, dm);
hivas('share.send', { kampany_id: kampany.id, cimzett: 'mindenki', tipus: 'kep', cim: 'Térkép' }, dm);
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).megosztasok.length === 1, 'Bence csak a mindenkinek szóló megosztást látja');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).megosztasok.length === 2, 'a mesterjátékos mindkettőt látja');

v = hivas('rules.get', {}, bencT);
ellenoriz(v.ok && v.verzio === 1 && Array.isArray(v.lapok.Fajok), 'szabályadat letölthető');
const szabaly = tablazatok[tulajdonsagok.SZABALY_ID];
szabaly.getSheetByName('Fajok').appendRow(['faj_torpe', "'Törp", 'Dwarf', 'Alapkönyv', 9, "'+1 Szívósság", "'{\"x\":1}", '']);
kornyezet.szabalyVerzioNovelese();
v = hivas('rules.get', {}, bencT);
ellenoriz(v.verzio === 2 && v.lapok.Fajok[0].reszletek.x === 1 && v.lapok.Fajok[0].leiras_hu === '+1 Szívósság', 'verzióváltás után az új adat jön, a JSON mező feldolgozva', v.lapok && v.lapok.Fajok);

// import táblázatból betöltés
const imp = kornyezet.SpreadsheetApp.create('Import 01 teszt');
const fajLap = imp.getSheets()[0]; fajLap.nev = 'Fajok';
fajLap.appendRow(['id', 'nev_hu', 'nev_en', 'forras', 'oldal', 'leiras_hu', 'reszletek', 'aktiv']);
fajLap.appendRow(['faj_torpe', 'Törp (javított)', 'Dwarf', 'Alapkönyv', 12, '+1 Szívósság', '{"x":2}', true]);
fajLap.appendRow(['faj_elf', 'Elf', 'Elf', 'Alapkönyv', 13, '3-4 dobás', '{}', true]);
const szot = imp.insertSheet('Szótár'); szot.appendRow(['eredeti', 'projektben', 'megjegyzes']); szot.appendRow(['Dwarf', 'Törp', 'faj']);
const importMappa = mappaKeres(gyoker, tulajdonsagok.MAPPA_ID).almappak.find(m => m.nev === 'Import');
fajlok[imp.id].szulo = importMappa.id;
kornyezet.importalas();
v = hivas('rules.get', {}, bencT);
ellenoriz(v.verzio === 3 && v.lapok.Fajok.length === 2 && v.lapok.Fajok[0].nev_hu === 'Törp (javított)' && v.lapok.Fajok[1].leiras_hu === '3-4 dobás' && v.lapok.Szótár.length === 1,
  'import: azonosító szerint frissít, újat hozzáfűz, verziót növel, a „3-4” szöveg marad', v.lapok && v.lapok.Fajok);
ellenoriz(fajlok[imp.id].cim.startsWith('Betöltve: '), 'import után a fájl Betöltve előtagot kap');
kornyezet.importalas();
ellenoriz(hivas('rules.version', {}, bencT).verzio === 3, 'betöltött fájlt nem tölt be újra');

hivas('users.admin', { muvelet: 'letilt', id: bence.id }, dm);
ellenoriz(hivas('characters.list', {}, bencT).hiba === 'nincs_bejelentkezve', 'letiltott felhasználó tokenje azonnal érvénytelen');
for (let i = 0; i < 5; i++) hivas('login', { nev: 'Anna', jelszo: 'rossz' });
ellenoriz(hivas('login', { nev: 'Anna', jelszo: 'anna1' }).hiba === 'tiltva', '5 rossz jelszó után tiltás');
ellenoriz(hivas('characters.list', {}, 'hamis.token').hiba === 'nincs_bejelentkezve', 'hamis token elutasítva');

const kar = jatek.getSheetByName('Karakterek').getDataRange().getValues();
ellenoriz(typeof kar[1][kar[0].indexOf('modositva')] === 'string', 'időbélyeg szövegként tárolódik');

console.log(hibak ? `\n${hibak} HIBA` : '\nMinden teszt sikeres.');
process.exit(hibak ? 1 : 0);
