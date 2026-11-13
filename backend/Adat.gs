// Táblázatkezelés: lapok olvasása objektumként, sorok írása.
// Minden szöveg aposztróf előtaggal kerül a cellába, így a Sheets nem alakítja
// dátummá, számmá vagy képletté (a getValues() az aposztrófot nem adja vissza).

const _tablazatok = {};
function jsonOszlopok_() {
  return SEMA.json_oszlopok;
}

function tablazat_(kulcs) {
  if (!_tablazatok[kulcs]) {
    const id = PropertiesService.getScriptProperties().getProperty(kulcs === 'szabaly' ? 'SZABALY_ID' : 'JATEK_ID');
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

// A lap összes sora objektumként (a _sor mező a táblázatbeli sorszám).
function sorok_(kulcs, nev) {
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
}

function sorFrissitese_(kulcs, nev, obj) {
  if (!obj._sor) throw new Error('Hiányzó sorszám a frissítéshez.');
  const l = lap_(kulcs, nev);
  const fej = fejlec_(l);
  l.getRange(obj._sor, 1, 1, fej.length).setValues([fej.map(function (f) { return cellaErtek_(f, obj[f]); })]);
}

function sorTorlese_(kulcs, nev, sorszam) {
  lap_(kulcs, nev).deleteRow(sorszam);
}

function cellaIrasa_(kulcs, nev, sorszam, oszlop, ertek) {
  const l = lap_(kulcs, nev);
  const j = fejlec_(l).indexOf(oszlop);
  if (j < 0) throw new Error('Hiányzó oszlop: ' + oszlop);
  l.getRange(sorszam, j + 1).setValue(cellaErtek_(oszlop, ertek));
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
