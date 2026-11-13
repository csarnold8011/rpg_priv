// Táblázatkezelés: lapok olvasása objektumként, sorok írása.
// Minden szöveg aposztróf előtaggal kerül a cellába, így a Sheets nem alakítja
// dátummá, számmá vagy képletté (a getValues() az aposztrófot nem adja vissza).

const _tablazatok = {};

// Script Properties olvasása gyorsítótáron keresztül. A Properties olvasására napi
// kvóta van (ingyenes fióknál 50 000 művelet), a gyakori kérések (tokenellenőrzés a
// 3 másodpercenkénti state.poll hívásnál, táblázat megnyitása) ezért nem olvashatják
// minden hívásnál. Üres értéket nem tárol, így az elsoBeallitas után azonnal működik.
const BEALLITAS_CACHE_MP = 21600; // 6 óra, a CacheService maximuma
function beallitas_(kulcs) {
  const c = CacheService.getScriptCache();
  const m = c.get('prop_' + kulcs);
  if (m !== null) return m;
  const v = PropertiesService.getScriptProperties().getProperty(kulcs);
  if (v !== null) c.put('prop_' + kulcs, v, BEALLITAS_CACHE_MP);
  return v;
}
const GYORSITOTARAZOTT_BEALLITASOK = ['TOKEN_TITOK', 'SZABALY_ID', 'JATEK_ID'];
function jsonOszlopok_() {
  return SEMA.json_oszlopok;
}

function tablazat_(kulcs) {
  if (!_tablazatok[kulcs]) {
    const id = beallitas_(kulcs === 'szabaly' ? 'SZABALY_ID' : 'JATEK_ID');
    if (!id) throw hiba_('nincs_beallitva', 'Futtasd az elsoBeallitas függvényt az Apps Script szerkesztőben.');
    _tablazatok[kulcs] = SpreadsheetApp.openById(id);
  }
  return _tablazatok[kulcs];
}

function lap_(kulcs, nev) {
  const l = tablazat_(kulcs).getSheetByName(nev);
  if (!l) throw hiba_('hianyzo_lap', 'Hiányzó lap: ' + nev + '. Futtasd az elsoBeallitas függvényt.');
  return l;
}

function fejlec_(l) {
  return l.getRange(1, 1, 1, Math.max(1, l.getLastColumn())).getValues()[0].map(String);
}

function sorbolObjektum_(fej, sor, sorszam) {
  const o = { _sor: sorszam };
  fej.forEach(function (f, j) {
    let x = sor[j];
    if (x instanceof Date) x = x.toISOString();
    if (jsonOszlopok_().indexOf(f) >= 0 && typeof x === 'string' && x !== '') {
      try { x = JSON.parse(x); } catch (e) { /* marad szövegként */ }
    }
    o[f] = x;
  });
  return o;
}

function uresSor_(sor) {
  return sor.every(function (c) { return c === '' || c === null; });
}

// ---- A játékadat lapjainak gyorsítótára ----
// A Sheets olvasása (és már a táblázat megnyitása is) lassú, ezért a játékadat lapjai rövid
// ideig a CacheService-ben vannak. Minden laphoz generációszám tartozik: minden írás után új
// generáció kezdődik, így a régi tartalom többé nem olvasható. Zárolás alatt (írás előtt)
// mindig a táblázatból olvasunk, hogy a sorszámok biztosan pontosak legyenek.
// A táblázatban kézzel végzett módosítás legkésőbb JATEK_CACHE_MP másodperc múlva látszik.
const JATEK_CACHE_MP = 900;
let _zarolasAlatt = false;

function generacioKulcs_(kulcs, nev) {
  return 'gen_' + kulcs + '_' + encodeURIComponent(nev);
}
function ujGeneracio_() {
  return String(Date.now()) + '_' + Math.floor(Math.random() * 1e6);
}
function lapGeneracio_(kulcs, nev) {
  const c = CacheService.getScriptCache();
  const k = generacioKulcs_(kulcs, nev);
  let g = c.get(k);
  if (g === null) { g = ujGeneracio_(); c.put(k, g, 21600); }
  return g;
}
function lapValtozott_(kulcs, nev) {
  if (kulcs !== 'jatek') return;
  CacheService.getScriptCache().put(generacioKulcs_(kulcs, nev), ujGeneracio_(), 21600);
}
// fn eredményét lapgenerációhoz kötve tárolja (csak a játékadatnál, zároláson kívül).
function gyorsitottOlvasas_(kulcs, nev, alkulcs, fn) {
  if (kulcs !== 'jatek' || _zarolasAlatt) return fn();
  const ck = 'lap_' + encodeURIComponent(nev) + '_' + alkulcs + '_' + lapGeneracio_(kulcs, nev);
  const m = gyorsitotarOlvasas_(ck);
  if (m !== null) {
    try { return JSON.parse(m); } catch (e) { /* olvassuk újra */ }
  }
  const ertek = fn();
  gyorsitotarIras_(ck, JSON.stringify(ertek), JATEK_CACHE_MP);
  return ertek;
}

// A lap összes sora objektumként (a _sor mező a táblázatbeli sorszám).
function sorok_(kulcs, nev) {
  return gyorsitottOlvasas_(kulcs, nev, 'mind', function () { return sorokTablazatbol_(kulcs, nev); });
}

function sorokTablazatbol_(kulcs, nev) {
  const l = lap_(kulcs, nev);
  const ertekek = l.getDataRange().getValues();
  if (ertekek.length < 2) return [];
  const fej = ertekek[0].map(String);
  const ki = [];
  for (let i = 1; i < ertekek.length; i++) {
    if (uresSor_(ertekek[i])) continue;
    ki.push(sorbolObjektum_(fej, ertekek[i], i + 1));
  }
  return ki;
}

// Csak az utolsó n sor (a dobásnaplóhoz, ami folyamatosan nő).
function utolsoSorok_(kulcs, nev, n) {
  return gyorsitottOlvasas_(kulcs, nev, 'utolso' + n, function () { return utolsoSorokTablazatbol_(kulcs, nev, n); });
}

function utolsoSorokTablazatbol_(kulcs, nev, n) {
  const l = lap_(kulcs, nev);
  const utolso = l.getLastRow();
  if (utolso < 2) return [];
  const fej = fejlec_(l);
  const elso = Math.max(2, utolso - n + 1);
  const ertekek = l.getRange(elso, 1, utolso - elso + 1, fej.length).getValues();
  const ki = [];
  ertekek.forEach(function (sor, i) {
    if (!uresSor_(sor)) ki.push(sorbolObjektum_(fej, sor, elso + i));
  });
  return ki;
}

function cellaErtek_(f, x) {
  if (x === undefined || x === null) return '';
  if (typeof x === 'object') x = JSON.stringify(x);
  if (typeof x === 'string' && x !== '') return "'" + x;
  return x;
}

function sorHozzaadasa_(kulcs, nev, obj) {
  const l = lap_(kulcs, nev);
  const fej = fejlec_(l);
  l.appendRow(fej.map(function (f) { return cellaErtek_(f, obj[f]); }));
  lapValtozott_(kulcs, nev);
}

function sorFrissitese_(kulcs, nev, obj) {
  if (!obj._sor) throw new Error('Hiányzó sorszám a frissítéshez.');
  const l = lap_(kulcs, nev);
  const fej = fejlec_(l);
  l.getRange(obj._sor, 1, 1, fej.length).setValues([fej.map(function (f) { return cellaErtek_(f, obj[f]); })]);
  lapValtozott_(kulcs, nev);
}

function sorTorlese_(kulcs, nev, sorszam) {
  lap_(kulcs, nev).deleteRow(sorszam);
  lapValtozott_(kulcs, nev);
}

// Több sor törlése egy lapról: alulról felfelé, hogy a sorszámok érvényesek maradjanak.
function sorokTorlese_(kulcs, nev, sorszamok) {
  const l = lap_(kulcs, nev);
  sorszamok.slice().sort(function (a, b) { return b - a; }).forEach(function (s) { l.deleteRow(s); });
  if (sorszamok.length) lapValtozott_(kulcs, nev);
}

function cellaIrasa_(kulcs, nev, sorszam, oszlop, ertek) {
  const l = lap_(kulcs, nev);
  const j = fejlec_(l).indexOf(oszlop);
  if (j < 0) throw new Error('Hiányzó oszlop: ' + oszlop);
  l.getRange(sorszam, j + 1).setValue(cellaErtek_(oszlop, ertek));
  lapValtozott_(kulcs, nev);
}

function valtozasNaplozasa_(felh, mit, elemId, regi, uj) {
  sorHozzaadasa_('jatek', 'Változásnapló', {
    idopont: most_(), ki: felh ? felh.n : '', mit: mit, elem_id: elemId, regi_verzio: regi, uj_verzio: uj
  });
}

// ---- Darabolt gyorsítótár (egy elem legfeljebb 100 KB) ----

function gyorsitotarIras_(kulcs, szoveg, mp) {
  const c = CacheService.getScriptCache();
  const darab = 40000;
  const n = Math.ceil(szoveg.length / darab);
  const obj = {};
  for (let i = 0; i < n; i++) obj[kulcs + '_' + i] = szoveg.substr(i * darab, darab);
  obj[kulcs + '_n'] = String(n);
  try { c.putAll(obj, mp || 21600); } catch (e) { console.warn('Gyorsítótár írása sikertelen: ' + e); }
}

function gyorsitotarOlvasas_(kulcs) {
  const c = CacheService.getScriptCache();
  const n = c.get(kulcs + '_n');
  if (n === null) return null;
  const kulcsok = [];
  for (let i = 0; i < Number(n); i++) kulcsok.push(kulcs + '_' + i);
  const m = c.getAll(kulcsok);
  for (let i = 0; i < kulcsok.length; i++) if (m[kulcsok[i]] == null) return null;
  return kulcsok.map(function (k) { return m[k]; }).join('');
}
