// GENERÁLT FÁJL: a backend/*.gs fájlok összefűzése (tools/backend_osszefuz.py).
// Az Apps Script projektben ez az egyetlen kódfájl (Kod.gs), mellette az appsscript.json.

// ===== Sema.gs =====

// GENERÁLT FÁJL. Ne szerkeszd kézzel: a schema/sema.json-t módosítsd,
// majd futtasd: python3 tools/sema_general.py

const SEMA = {
  "tablazatok": {
    "szabaly": {
      "cim": "Fantasy AGE Szabályadatbázis",
      "lapok": {
        "Tulajdonságok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "sorrend"
        ],
        "Fókuszok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "tulajdonsag"
        ],
        "Fajok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv"
        ],
        "Hátterek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "csoport"
        ],
        "Osztályok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "elsodleges_tulajdonsagok",
          "masodlagos_tulajdonsagok",
          "kezdo_egeszseg"
        ],
        "Szintlépés": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "osztaly",
          "szint"
        ],
        "Talentumok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "osztalyok",
          "elofeltetel",
          "kezdo",
          "halado",
          "mester"
        ],
        "Specializációk": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "osztaly",
          "elofeltetel",
          "kezdo",
          "halado",
          "mester"
        ],
        "Arkánumok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "kezdo",
          "halado",
          "mester"
        ],
        "Varázslatok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "arkanum",
          "fokozat",
          "tipus",
          "mp_koltseg",
          "varazslasi_ido",
          "celertek",
          "proba"
        ],
        "Fegyvercsoportok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv"
        ],
        "Fegyverek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "csoport",
          "sebzes",
          "min_ero",
          "hatotav",
          "ar"
        ],
        "Páncélok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "pancelertek",
          "buntetes",
          "ar"
        ],
        "Felszerelés": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "kategoria",
          "ar"
        ],
        "Mutatványok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "tipus",
          "mutatvanypont"
        ],
        "Szörnyek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "fenyegetes",
          "tipus",
          "csoport"
        ],
        "Különleges képességek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "tipus"
        ],
        "Szótár": [
          "eredeti",
          "projektben",
          "megjegyzes"
        ],
        "Házi szabályok": [
          "id",
          "cim",
          "leiras",
          "erinti",
          "aktiv"
        ],
        "Meta": [
          "kulcs",
          "ertek"
        ]
      }
    },
    "jatek": {
      "cim": "Fantasy AGE Játékadat",
      "lapok": {
        "Felhasználók": [
          "id",
          "nev",
          "szerep",
          "jelszo_hash",
          "so",
          "aktiv",
          "letrehozva"
        ],
        "Karakterek": [
          "id",
          "nev",
          "jatekos_id",
          "faj",
          "osztaly",
          "szint",
          "adat",
          "verzio",
          "modositva",
          "modositotta",
          "aktiv",
          "njk"
        ],
        "NJK-k": [
          "id",
          "nev",
          "fajta",
          "alap_szorny",
          "fenyegetes",
          "kampanyok",
          "kotodes",
          "iranyito",
          "adat",
          "verzio",
          "modositva",
          "modositotta",
          "aktiv"
        ],
        "Kampányok": [
          "id",
          "cim",
          "mesterjatekos_id",
          "aktiv_forrasok",
          "allapot",
          "verzio",
          "dm_jegyzet",
          "letrehozva",
          "beallitasok"
        ],
        "Kampánykarakterek": [
          "kampany_id",
          "karakter_id",
          "allapot",
          "csatlakozott"
        ],
        "Dobásnapló": [
          "id",
          "idopont",
          "kampany_id",
          "karakter_id",
          "dobta",
          "mire",
          "kockak",
          "modosito",
          "celertek",
          "eredmeny",
          "mutatvanypont",
          "rejtett",
          "proba_id",
          "tipus",
          "tulajdonsag",
          "fokusz",
          "kezi",
          "felfedve",
          "reszletek",
          "njk_id",
          "csata_id"
        ],
        "Próbák": [
          "id",
          "kampany_id",
          "letrehozva",
          "letrehozta",
          "tipus",
          "cim",
          "tulajdonsag",
          "fokuszok",
          "fokusz_kotelezo",
          "celertek",
          "celertek_rejtett",
          "kuszob",
          "haladas",
          "idoegyseg",
          "cimzettek",
          "modositok",
          "mutatvany",
          "ellenfel",
          "allas",
          "allapot",
          "lezarva"
        ],
        "Összecsapások": [
          "id",
          "kampany_id",
          "cim",
          "allapot",
          "adat",
          "verzio",
          "letrehozva",
          "modositva",
          "modositotta",
          "aktiv"
        ],
        "Csaták": [
          "id",
          "kampany_id",
          "osszecsapas_id",
          "cim",
          "allapot",
          "kor",
          "adat",
          "pillanatkepek",
          "verzio",
          "letrehozva",
          "modositva",
          "modositotta",
          "lezarva"
        ],
        "Megosztások": [
          "id",
          "kampany_id",
          "cimzett",
          "tipus",
          "cim",
          "hivatkozas",
          "idopont"
        ],
        "Változásnapló": [
          "idopont",
          "ki",
          "mit",
          "elem_id",
          "regi_verzio",
          "uj_verzio"
        ]
      }
    }
  },
  "szabaly_lapok": [
    "Tulajdonságok",
    "Fókuszok",
    "Fajok",
    "Hátterek",
    "Osztályok",
    "Szintlépés",
    "Talentumok",
    "Specializációk",
    "Arkánumok",
    "Varázslatok",
    "Fegyvercsoportok",
    "Fegyverek",
    "Páncélok",
    "Felszerelés",
    "Mutatványok",
    "Szörnyek",
    "Különleges képességek",
    "Szótár",
    "Házi szabályok"
  ],
  "json_oszlopok": [
    "reszletek",
    "adat",
    "aktiv_forrasok",
    "kockak",
    "beallitasok",
    "fokuszok",
    "cimzettek",
    "modositok",
    "mutatvany",
    "ellenfel",
    "allas",
    "kampanyok",
    "pillanatkepek"
  ]
};

// ===== Main.gs =====

// Fantasy AGE családi webapp, háttérszolgáltatás (Google Apps Script).
// Belépési pont: minden kérés POST, text/plain törzzsel: { action, token, adat }.

// Függvényként, hogy a fájlok betöltési sorrendje ne számítson.
function muveletek_() {
  return {
    'login':                   { fn: belepes_, nyilvanos: true },
    'init':                    { fn: indulas_ },
    'users.admin':             { fn: felhasznaloKezeles_, szerep: 'dm' },
    'rules.version':           { fn: szabalyVerzio_ },
    'rules.get':               { fn: szabalyokLekerese_ },
    'state.poll':              { fn: allapotFigyeles_ },
    'state.get':               { fn: allapotLekerese_ },
    'characters.list':         { fn: karakterLista_ },
    'character.get':           { fn: karakterLekerese_ },
    'character.create':        { fn: karakterLetrehozasa_ },
    'character.save':          { fn: karakterMentese_ },
    'character.assign':        { fn: karakterTarsitasa_, szerep: 'dm' },
    'character.archive':       { fn: karakterArchivalasa_, szerep: 'dm' },
    'character.npc':           { fn: karakterNjkJelzo_, szerep: 'dm' },
    'character.delete':        { fn: karakterTorlese_, szerep: 'dm' },
    'character.xp':            { fn: karakterXp_, szerep: 'dm' },
    'character.image.set':     { fn: karakterKepBeallitasa_ },
    'image.get':               { fn: kepekLekerese_ },
    'campaigns.list':          { fn: kampanyLista_ },
    'campaign.create':         { fn: kampanyLetrehozasa_, szerep: 'dm' },
    'campaign.update':         { fn: kampanyModositasa_, szerep: 'dm' },
    'campaign.delete':         { fn: kampanyTorlese_, szerep: 'dm' },
    'campaign.addCharacter':   { fn: kampanyhozRendeles_, szerep: 'dm' },
    'campaign.removeCharacter':{ fn: kampanybolKivetel_, szerep: 'dm' },
    'roll.log':                { fn: dobasNaplozasa_ },
    'roll.update':             { fn: dobasModositasa_ },
    'roll.list':               { fn: dobasLista_ },
    'test.request':            { fn: probaKerese_ },
    'test.update':             { fn: probaModositasa_ },
    'test.close':              { fn: probaLezarasa_ },
    'share.send':              { fn: megosztasKuldese_, szerep: 'dm' },
    'npc.list':                { fn: njkLista_, szerep: 'dm' },
    'npc.get':                 { fn: njkLekerese_ },
    'npc.save':                { fn: njkMentese_, szerep: 'dm' },
    'npc.archive':             { fn: njkArchivalasa_, szerep: 'dm' },
    'npc.delete':              { fn: njkTorlese_, szerep: 'dm' },
    'npc.image.set':           { fn: njkKepBeallitasa_, szerep: 'dm' },
    'encounter.list':          { fn: osszecsapasLista_, szerep: 'dm' },
    'encounter.save':          { fn: osszecsapasMentese_, szerep: 'dm' },
    'encounter.archive':       { fn: osszecsapasArchivalasa_, szerep: 'dm' },
    'encounter.delete':        { fn: osszecsapasTorlese_, szerep: 'dm' },
    'combat.start':            { fn: csataInditasa_, szerep: 'dm' },
    'combat.act':              { fn: csataLepese_, szerep: 'dm' },
    'combat.close':            { fn: csataLezarasa_, szerep: 'dm' },
    'combat.delete':           { fn: csataTorlese_, szerep: 'dm' }
    // 'ai.ask': a 4. fejlesztési lépésben
  };
}

function doGet() {
  return json_({ ok: true, szolgaltatas: 'Fantasy AGE háttér', ido: most_() });
}

function doPost(e) {
  let keres;
  try {
    keres = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, hiba: 'hibas_keres', uzenet: 'A kérés nem érvényes JSON.' });
  }
  try {
    const muvelet = muveletek_()[keres.action];
    if (!muvelet) throw hiba_('ismeretlen_muvelet', 'Ismeretlen művelet: ' + keres.action);
    let felh = null;
    if (!muvelet.nyilvanos) felh = tokenEllenorzes_(keres.token);
    if (muvelet.szerep && felh.r !== muvelet.szerep) throw hiba_('nincs_jogosultsag', 'Ehhez nincs jogosultságod.');
    const eredmeny = muvelet.fn(keres.adat || {}, felh) || {};
    if (eredmeny._nyers) return nyers_(eredmeny._nyers);
    return json_(Object.assign({ ok: true }, eredmeny));
  } catch (err) {
    if (err && err.kod) return json_(Object.assign({ ok: false, hiba: err.kod, uzenet: err.uzenet || '' }, err.extra || {}));
    console.error(err && err.stack || err);
    return json_({ ok: false, hiba: 'szerverhiba', uzenet: String(err && err.message || err) });
  }
}

// ---- Segédfüggvények ----

function hiba_(kod, uzenet, extra) {
  return { kod: kod, uzenet: uzenet || '', extra: extra || null };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function nyers_(szoveg) {
  return ContentService.createTextOutput(szoveg).setMimeType(ContentService.MimeType.JSON);
}

function most_() {
  return new Date().toISOString();
}

function ujId_(elotag) {
  return elotag + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function igaz_(x) {
  if (x === '' || x === null || x === undefined) return true; // üres = aktív
  return x === true || x === 1 || ['true', 'igen', '1', 'i', 'x'].indexOf(String(x).toLowerCase()) >= 0;
}

// Zárolás alatt a lapok mindig a táblázatból olvasódnak (lásd Adat.gs, gyorsítótár).
function zarolva_(fn) {
  const zar = LockService.getScriptLock();
  zar.waitLock(15000);
  const elozo = _zarolasAlatt;
  _zarolasAlatt = true;
  try {
    return fn();
  } finally {
    _zarolasAlatt = elozo;
    zar.releaseLock();
  }
}

// ===== Adat.gs =====

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

// ===== Belepes.gs =====

// Belépés, token, felhasználók kezelése.

const TOKEN_ERVENY_NAP = 30;
const MAX_HIBAS_BELEPES = 5;
const TILTAS_MP = 600;

function hash_(jelszo, so) {
  let h = so + '|' + jelszo;
  for (let i = 0; i < 300; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  }
  return h;
}

function titok_() {
  const t = beallitas_('TOKEN_TITOK');
  if (!t) throw hiba_('nincs_beallitva', 'Futtasd az elsoBeallitas függvényt.');
  return t;
}

function b64url_(bajtokVagySzoveg) {
  return Utilities.base64EncodeWebSafe(bajtokVagySzoveg).replace(/=+$/, '');
}

function alairas_(s) {
  return b64url_(Utilities.computeHmacSha256Signature(s, titok_()));
}

function tokenKeszites_(f) {
  const tartalom = JSON.stringify({ u: f.id, r: f.szerep, n: f.nev, exp: Date.now() + TOKEN_ERVENY_NAP * 864e5 });
  const p = b64url_(Utilities.newBlob(tartalom).getBytes());
  return p + '.' + alairas_(p);
}

function tokenEllenorzes_(token) {
  if (!token || typeof token !== 'string') throw hiba_('nincs_bejelentkezve', 'Jelentkezz be.');
  const reszek = token.split('.');
  if (reszek.length !== 2 || alairas_(reszek[0]) !== reszek[1]) throw hiba_('nincs_bejelentkezve', 'Jelentkezz be újra.');
  const p = reszek[0] + '='.repeat((4 - reszek[0].length % 4) % 4);
  const adat = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(p)).getDataAsString('UTF-8'));
  if (!adat.exp || adat.exp < Date.now()) throw hiba_('lejart', 'A bejelentkezés lejárt, jelentkezz be újra.');
  if (letiltottak_().indexOf(adat.u) >= 0) throw hiba_('nincs_bejelentkezve', 'Ez a fiók le van tiltva.');
  return adat; // { u: azonosító, r: szerep, n: név, exp }
}

// A letiltott felhasználók listája gyorsítótárból, hogy a tokenellenőrzés ne olvasson táblázatot.
function letiltottak_() {
  const c = CacheService.getScriptCache();
  const m = c.get('letiltottak');
  if (m !== null) return JSON.parse(m);
  const lista = sorok_('jatek', 'Felhasználók').filter(function (f) { return !igaz_(f.aktiv); }).map(function (f) { return f.id; });
  c.put('letiltottak', JSON.stringify(lista), 21600);
  return lista;
}

function publikus_(f) {
  return { id: f.id, nev: f.nev, szerep: f.szerep, aktiv: igaz_(f.aktiv) };
}

function felhasznaloLetrehozasa_(nev, jelszo, szerep) {
  if (['dm', 'jatekos'].indexOf(szerep) < 0) throw hiba_('hibas_adat', 'A szerep dm vagy jatekos lehet.');
  if (String(jelszo).length < 4) throw hiba_('hibas_adat', 'A jelszó legalább 4 karakter legyen.');
  const letezo = sorok_('jatek', 'Felhasználók').some(function (f) { return String(f.nev).toLowerCase() === nev.toLowerCase(); });
  if (letezo) throw hiba_('hibas_adat', 'Már van ilyen nevű felhasználó.');
  const so = Utilities.getUuid();
  const f = { id: ujId_('f'), nev: nev, szerep: szerep, jelszo_hash: hash_(jelszo, so), so: so, aktiv: true, letrehozva: most_() };
  sorHozzaadasa_('jatek', 'Felhasználók', f);
  return f;
}

// action: login   adat: { nev, jelszo }
function belepes_(a) {
  const nev = String(a.nev || '').trim();
  const jelszo = String(a.jelszo || '');
  if (!nev || !jelszo) throw hiba_('hianyzo_adat', 'Add meg a neved és a jelszavad.');

  const c = CacheService.getScriptCache();
  const kulcs = 'hibas_' + nev.toLowerCase();
  const hibak = Number(c.get(kulcs) || 0);
  if (hibak >= MAX_HIBAS_BELEPES) throw hiba_('tiltva', 'Túl sok sikertelen próbálkozás. Próbáld újra 10 perc múlva.');

  return zarolva_(function () {
    const felhasznalok = sorok_('jatek', 'Felhasználók');

    // Legelső belépés: ha még nincs felhasználó és az elsoBeallitas engedélyezte, ő lesz a DM.
    if (felhasznalok.length === 0) {
      const p = PropertiesService.getScriptProperties();
      if (p.getProperty('ELSO_BELEPES') === 'igen') {
        const uj = felhasznaloLetrehozasa_(nev, jelszo, 'dm');
        p.deleteProperty('ELSO_BELEPES');
        return { token: tokenKeszites_(uj), felhasznalo: publikus_(uj), elso_belepes: true };
      }
    }

    const f = felhasznalok.find(function (x) { return String(x.nev).toLowerCase() === nev.toLowerCase(); });
    if (!f || !igaz_(f.aktiv) || hash_(jelszo, f.so) !== f.jelszo_hash) {
      c.put(kulcs, String(hibak + 1), TILTAS_MP);
      throw hiba_('hibas_belepes', 'Hibás név vagy jelszó.');
    }
    c.remove(kulcs);
    return { token: tokenKeszites_(f), felhasznalo: publikus_(f) };
  });
}

// action: users.admin (csak DM)
// adat: { muvelet: 'lista' }
//       { muvelet: 'letrehoz', nev, jelszo, szerep }
//       { muvelet: 'jelszo', id, jelszo }
//       { muvelet: 'letilt' | 'engedelyez', id }
//       { muvelet: 'szerep', id, szerep }
//       { muvelet: 'torol', id }   csak letiltott, karakter nélküli felhasználó; mesterjátékosi szerepei törlődnek
function felhasznaloKezeles_(a, felh) {
  if (a.muvelet === 'lista') {
    return { felhasznalok: sorok_('jatek', 'Felhasználók').map(publikus_) };
  }
  return zarolva_(function () {
    if (a.muvelet === 'letrehoz') {
      const uj = felhasznaloLetrehozasa_(String(a.nev || '').trim(), String(a.jelszo || ''), a.szerep || 'jatekos');
      valtozasNaplozasa_(felh, 'felhasznalo.letrehoz', uj.id, '', '');
      return { felhasznalo: publikus_(uj) };
    }
    const f = sorok_('jatek', 'Felhasználók').find(function (x) { return x.id === a.id; });
    if (!f) throw hiba_('nem_talalhato', 'Nincs ilyen felhasználó.');
    if (a.muvelet === 'jelszo') {
      if (String(a.jelszo || '').length < 4) throw hiba_('hibas_adat', 'A jelszó legalább 4 karakter legyen.');
      f.so = Utilities.getUuid();
      f.jelszo_hash = hash_(String(a.jelszo), f.so);
    } else if (a.muvelet === 'letilt' || a.muvelet === 'engedelyez') {
      if (f.id === felh.u) throw hiba_('hibas_adat', 'Saját magadat nem tilthatod le.');
      f.aktiv = a.muvelet === 'engedelyez';
    } else if (a.muvelet === 'torol') {
      if (f.id === felh.u) throw hiba_('hibas_adat', 'Saját magadat nem törölheted.');
      if (igaz_(f.aktiv)) throw hiba_('hibas_adat', 'Csak letiltott felhasználó törölhető. Előbb tiltsd le.');
      const k = kornyezet_();
      const karakterei = k.karakterek.filter(function (c) { return c.jatekos_id === f.id; });
      if (karakterei.length) {
        throw hiba_('hibas_adat', 'Előbb társítsd másnak vagy tedd játékos nélkülivé a karaktereit: ' +
          karakterei.map(function (c) { return c.nev; }).join(', ') + '.');
      }
      const mesterkent = k.kampanyok.filter(function (x) { return x.mesterjatekos_id === f.id; });
      mesterkent.forEach(function (x) { x.mesterjatekos_id = ''; sorFrissitese_('jatek', 'Kampányok', x); });
      kampanyVerziokNovelese_(mesterkent.map(function (x) { return x.id; }), k.kampanyok);
      sorTorlese_('jatek', 'Felhasználók', f._sor);
      CacheService.getScriptCache().remove('letiltottak');
      valtozasNaplozasa_(felh, 'felhasznalo.torol', f.id, '', '');
      return { torolve: f.id };
    } else if (a.muvelet === 'szerep') {
      if (['dm', 'jatekos'].indexOf(a.szerep) < 0) throw hiba_('hibas_adat', 'A szerep dm vagy jatekos lehet.');
      f.szerep = a.szerep;
    } else {
      throw hiba_('hibas_adat', 'Ismeretlen művelet.');
    }
    sorFrissitese_('jatek', 'Felhasználók', f);
    CacheService.getScriptCache().remove('letiltottak');
    valtozasNaplozasa_(felh, 'felhasznalo.' + a.muvelet, f.id, '', '');
    return { felhasznalo: publikus_(f) };
  });
}

// ===== Jogosultsag.gs =====

// Jogosultsági szabályok (lásd claude/alapozas-terv.md, 1. pont).
//
// DM: mindent lát és szerkeszt.
// Mesterjátékos: kampányonkénti szerep; a kampány összes karakterét látja és szerkeszti.
// Játékos: a hozzá társított karaktereket látja és szerkeszti.
// Játékos nélküli karakter: a DM és a kampány mesterjátékosa kezeli.

// Egyszerre olvassa be a jogosultsághoz kellő lapokat, hogy egy kérés ne olvassa többször ugyanazt.
function kornyezet_() {
  return {
    karakterek: sorok_('jatek', 'Karakterek'),
    kampanyok: sorok_('jatek', 'Kampányok'),
    kapcsolatok: sorok_('jatek', 'Kampánykarakterek')
  };
}

function mesterKampanyai_(felh, k) {
  return k.kampanyok.filter(function (x) { return x.mesterjatekos_id && x.mesterjatekos_id === felh.u; })
    .map(function (x) { return x.id; });
}

function karakterKampanyai_(karakterId, k) {
  return k.kapcsolatok.filter(function (x) { return x.karakter_id === karakterId; })
    .map(function (x) { return x.kampany_id; });
}

function karakterIrhato_(felh, kar, k) {
  if (felh.r === 'dm') return true;
  if (kar.jatekos_id && kar.jatekos_id === felh.u) return true;
  const mester = mesterKampanyai_(felh, k);
  return karakterKampanyai_(kar.id, k).some(function (id) { return mester.indexOf(id) >= 0; });
}

// Láthatja-e (például a képét): szerkesztheti, vagy egy olyan kampány tagja, amelyben a felhasználónak szerepe van.
function karakterLathato_(felh, kar, k) {
  if (karakterIrhato_(felh, kar, k)) return true;
  return karakterKampanyai_(kar.id, k).some(function (id) {
    const kampany = k.kampanyok.find(function (x) { return x.id === id; });
    return kampany && !!kampanySzerep_(felh, kampany, k);
  });
}

// A felhasználó szerepe egy kampányban: 'dm', 'mester', 'jatekos' vagy null (nincs köze hozzá).
function kampanySzerep_(felh, kampany, k) {
  if (felh.r === 'dm') return 'dm';
  if (kampany.mesterjatekos_id && kampany.mesterjatekos_id === felh.u) return 'mester';
  const sajat = k.karakterek.filter(function (c) { return c.jatekos_id === felh.u; }).map(function (c) { return c.id; });
  const benne = k.kapcsolatok.some(function (x) { return x.kampany_id === kampany.id && sajat.indexOf(x.karakter_id) >= 0; });
  return benne ? 'jatekos' : null;
}

function kampanyKeresese_(id, k) {
  const kampany = k.kampanyok.find(function (x) { return x.id === id; });
  if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
  return kampany;
}

function karakterKeresese_(id, k) {
  const kar = k.karakterek.find(function (x) { return x.id === id; });
  if (!kar) throw hiba_('nem_talalhato', 'Nincs ilyen karakter.');
  return kar;
}

// ===== Verzio.gs =====

// Kampányverziók: minden változás növeli az érintett kampány verziószámát.
// A felületek csak ezt kérdezik pár másodpercenként (state.poll), gyorsítótárból.

function kampanyVerzio_(id) {
  const c = CacheService.getScriptCache();
  const v = c.get('kv_' + id);
  if (v !== null) return Number(v);
  const kampany = sorok_('jatek', 'Kampányok').find(function (x) { return x.id === id; });
  if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
  const szam = Number(kampany.verzio) || 0;
  c.put('kv_' + id, String(szam), 21600);
  return szam;
}

// Zárolás alatt hívandó. kampanyok: a már beolvasott Kampányok sorok (ha van), ids: érintett kampányok.
function kampanyVerziokNovelese_(ids, kampanyok) {
  if (!ids || !ids.length) return {};
  const lista = kampanyok || sorok_('jatek', 'Kampányok');
  const c = CacheService.getScriptCache();
  const uj = {};
  ids.forEach(function (id) {
    const kampany = lista.find(function (x) { return x.id === id; });
    if (!kampany) return;
    const v = (Number(kampany.verzio) || 0) + 1;
    kampany.verzio = v;
    cellaIrasa_('jatek', 'Kampányok', kampany._sor, 'verzio', v);
    c.put('kv_' + id, String(v), 21600);
    uj[id] = v;
  });
  return uj;
}

// action: state.poll   adat: { kampany_id }
function allapotFigyeles_(a) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  return { verzio: kampanyVerzio_(a.kampany_id) };
}

// ===== Karakterek.gs =====

// Karakterek: önálló elemek, kampánytól függetlenül léteznek.
// A teljes karakter az `adat` oszlopban van JSON-ban; a kulcsoszlopok (nev, faj, osztaly, szint) listázáshoz kellenek.

const MAX_KARAKTER_MERET = 48000; // egy Sheets cella legfeljebb 50 000 karaktert tárol

function karakterOsszefoglalo_(kar, k, felh) {
  return {
    id: kar.id, nev: kar.nev, jatekos_id: kar.jatekos_id || '', faj: kar.faj, osztaly: kar.osztaly,
    szint: kar.szint, verzio: Number(kar.verzio) || 0, modositva: kar.modositva, aktiv: igaz_(kar.aktiv),
    kampanyok: karakterKampanyai_(kar.id, k),
    aktiv_kampanyok: k.kapcsolatok.filter(function (x) { return x.karakter_id === kar.id && (x.allapot || 'aktív') === 'aktív'; })
      .map(function (x) { return x.kampany_id; }),
    irhato: felh ? karakterIrhato_(felh, kar, k) : false,
    // a karakterkészítés állapota a listák „Piszkozat” címkéjéhez (piszkozat | kesz | atvett)
    keszites: kar.adat && typeof kar.adat === 'object' && kar.adat.keszites ? (kar.adat.keszites.allapot || '') : '',
    kep: karakterBelyeg_(kar),
    xp: kar.adat && typeof kar.adat === 'object' && kar.adat.allapot ? (Number(kar.adat.allapot.xp) || 0) : 0,
    njk: igaz_rejtett_(kar.njk) // karakter-szintű NJK (a DM jelöli)
  };
}

// A karakterkép bélyegének Drive-azonosítója (a listákhoz), vagy üres.
function karakterBelyeg_(kar) {
  const kep = kar.adat && typeof kar.adat === 'object' && kar.adat.alap && kar.adat.alap.kep;
  return kep && typeof kep === 'object' ? (kep.belyeg || kep.kep || '') : '';
}

function karakterTeljes_(kar, k, felh) {
  const o = karakterOsszefoglalo_(kar, k, felh);
  o.adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
  return o;
}

function kulcsmezok_(kar, adat) {
  if (adat.nev) kar.nev = adat.nev;
  if (adat.faj !== undefined) kar.faj = adat.faj;
  if (adat.osztaly !== undefined) kar.osztaly = adat.osztaly;
  if (adat.szint !== undefined) kar.szint = adat.szint;
}

function meretEllenorzes_(adat) {
  if (JSON.stringify(adat).length > MAX_KARAKTER_MERET) throw hiba_('tul_nagy', 'A karakter adatai túl nagyok egy cellához.');
}

// action: characters.list
// Az archivált (aktiv = hamis) karaktereket csak a DM látja.
function karakterLista_(a, felh, kornyezet) {
  const k = kornyezet || kornyezet_();
  const lista = k.karakterek
    .filter(function (kar) { return karakterIrhato_(felh, kar, k) && (felh.r === 'dm' || igaz_(kar.aktiv)); })
    .map(function (kar) { return karakterOsszefoglalo_(kar, k, felh); });
  return { karakterek: lista };
}

// action: character.get   adat: { id }
function karakterLekerese_(a, felh) {
  const k = kornyezet_();
  const kar = karakterKeresese_(a.id, k);
  if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ehhez a karakterhez nincs hozzáférésed.');
  return { karakter: karakterTeljes_(kar, k, felh) };
}

// action: character.create   adat: { nev, adat?, jatekos_id?, kampany_id?, njk? }  (njk: karakter-szintű NJK, csak a DM)
// DM: bárkinek létrehozhat, és kampányhoz is rendelheti.
// Mesterjátékos: kampany_id-vel a saját kampányába hoz létre játékos nélküli karaktert.
// Játékos: saját magának hoz létre karaktert (kampányhoz a DM rendeli).
function karakterLetrehozasa_(a, felh) {
  const adat = a.adat && typeof a.adat === 'object' ? a.adat : {};
  const nev = String(a.nev || adat.nev || '').trim();
  if (!nev) throw hiba_('hianyzo_adat', 'Adj nevet a karakternek.');
  adat.nev = nev;
  meretEllenorzes_(adat);

  return zarolva_(function () {
    const k = kornyezet_();
    let jatekosId = '';
    let kampanyId = '';
    if (felh.r === 'dm') {
      jatekosId = a.jatekos_id || '';
      kampanyId = a.kampany_id || '';
    } else if (a.kampany_id && mesterKampanyai_(felh, k).indexOf(a.kampany_id) >= 0) {
      jatekosId = a.jatekos_id || '';
      kampanyId = a.kampany_id;
    } else {
      jatekosId = felh.u;
    }
    if (kampanyId) kampanyKeresese_(kampanyId, k);

    const kar = { id: ujId_('k'), nev: nev, jatekos_id: jatekosId, faj: '', osztaly: '', szint: '', adat: adat,
      verzio: 1, modositva: most_(), modositotta: felh.n, aktiv: true, njk: felh.r === 'dm' && !!a.njk };
    kulcsmezok_(kar, adat);
    sorHozzaadasa_('jatek', 'Karakterek', kar);
    if (kampanyId) {
      sorHozzaadasa_('jatek', 'Kampánykarakterek', { kampany_id: kampanyId, karakter_id: kar.id, allapot: 'aktív', csatlakozott: most_() });
      k.kapcsolatok.push({ kampany_id: kampanyId, karakter_id: kar.id });
      kampanyVerziokNovelese_([kampanyId], k.kampanyok);
    }
    valtozasNaplozasa_(felh, 'karakter.letrehoz', kar.id, '', 1);
    k.karakterek.push(kar);
    return { karakter: karakterTeljes_(kar, k, felh) };
  });
}

// action: character.save   adat: { id, verzio, adat, aktiv?, njk? }
// A verzio az a verziószám, amelyből a felület a módosítást készítette. Ha közben más mentett,
// a válasz hiba: 'utkozes', és benne van az aktuális karakter az összefésüléshez.
function karakterMentese_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a karakter azonosítója.');
  const adat = a.adat && typeof a.adat === 'object' ? a.adat : null;
  if (!adat) throw hiba_('hianyzo_adat', 'Hiányoznak a karakter adatai.');
  meretEllenorzes_(adat);

  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem szerkesztheted.');
    const regi = Number(kar.verzio) || 0;
    if (Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'A karaktert közben más is módosította.', { aktualis: karakterTeljes_(kar, k, felh) });
    }
    kar.adat = adat;
    kulcsmezok_(kar, adat);
    if (a.aktiv !== undefined && (felh.r === 'dm')) kar.aktiv = !!a.aktiv;
    if (a.njk !== undefined && felh.r === 'dm') kar.njk = !!a.njk;
    kar.verzio = regi + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    const kampanyVerziok = kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, 'karakter.ment', kar.id, regi, kar.verzio);
    return { verzio: kar.verzio, modositva: kar.modositva, kampany_verziok: kampanyVerziok };
  });
}

// action: character.assign (csak DM)   adat: { karakter_id, jatekos_id }  (üres jatekos_id = társítás törlése)
function karakterTarsitasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.karakter_id, k);
    const jatekosId = a.jatekos_id || '';
    if (jatekosId) {
      const van = sorok_('jatek', 'Felhasználók').some(function (f) { return f.id === jatekosId; });
      if (!van) throw hiba_('nem_talalhato', 'Nincs ilyen felhasználó.');
    }
    const regi = Number(kar.verzio) || 0;
    kar.jatekos_id = jatekosId;
    kar.verzio = regi + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, 'karakter.tarsit:' + (jatekosId || 'nincs'), kar.id, regi, kar.verzio);
    return { karakter: karakterOsszefoglalo_(kar, k, felh) };
  });
}

// action: character.npc (csak DM)   adat: { id, njk }  A karakter-szintű NJK jelző (a csapattal együtt fejlődő NJK).
function karakterNjkJelzo_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    kar.njk = !!a.njk;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, 'karakter.njk:' + (kar.njk ? 'igen' : 'nem'), kar.id, '', '');
    return { karakter: karakterOsszefoglalo_(kar, k, felh) };
  });
}

// action: character.archive (csak DM)   adat: { id, aktiv }
// Archivált karakter: a játékosok és a kampány nézete nem mutatja, a DM visszaállíthatja.
function karakterArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    kar.aktiv = !!a.aktiv;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, kar.aktiv ? 'karakter.visszaallit' : 'karakter.archival', kar.id, '', '');
    return { karakter: karakterOsszefoglalo_(kar, k, felh) };
  });
}

// action: character.delete (csak DM)   adat: { id }
// Csak archivált karakter törölhető. A kampánykapcsolatai is törlődnek, a dobásnapló marad.
function karakterTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    if (igaz_(kar.aktiv)) throw hiba_('hibas_adat', 'Csak archivált karakter törölhető. Előbb archiváld.');
    const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.karakter_id === kar.id; });
    kampanyVerziokNovelese_(kapcsolatok.map(function (x) { return x.kampany_id; }), k.kampanyok);
    sorokTorlese_('jatek', 'Kampánykarakterek', kapcsolatok.map(function (x) { return x._sor; }));
    sorTorlese_('jatek', 'Karakterek', kar._sor);
    kepekKukaba_(kar.adat && kar.adat.alap && kar.adat.alap.kep);
    valtozasNaplozasa_(felh, 'karakter.torol', kar.id, kar.verzio, '');
    return { torolve: kar.id };
  });
}

// ---- Tapasztalati pont (XP) ----

// action: character.xp (csak DM)
//   adat: { tetelek: [{ karakter_id, xp }], ok, tipus, kampany_id? }
// Karakterenként hozzáadja az XP-t (negatív is lehet, javításhoz), és naplózza a karakter xp_naplo listájában.
// tipus: talalkozas | bonusz | szerep | szintjutalom | javitas (a felület súgójához és a naplóhoz).
const XP_NAPLO_MAX = 300;
function karakterXp_(a, felh) {
  const tetelek = Array.isArray(a.tetelek) ? a.tetelek.filter(function (t) { return t && t.karakter_id; }) : [];
  if (!tetelek.length) throw hiba_('hianyzo_adat', 'Nincs kiválasztott karakter.');
  return zarolva_(function () {
    const k = kornyezet_();
    const ki = [];
    const kampanyok = {};
    const ido = most_();
    tetelek.forEach(function (t) {
      const kar = karakterKeresese_(t.karakter_id, k);
      const xp = Math.round(Number(t.xp) || 0);
      const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
      adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
      adat.allapot.xp = (Number(adat.allapot.xp) || 0) + xp;
      const bejegyzes = { idopont: ido, xp: xp, ok: String(a.ok || '').slice(0, 200), tipus: String(a.tipus || ''), ki: felh.n, kampany_id: a.kampany_id || '' };
      adat.xp_naplo = Array.isArray(adat.xp_naplo) ? adat.xp_naplo : [];
      adat.xp_naplo.push(bejegyzes);
      if (adat.xp_naplo.length > XP_NAPLO_MAX) adat.xp_naplo.splice(0, adat.xp_naplo.length - XP_NAPLO_MAX);
      meretEllenorzes_(adat);
      const regi = Number(kar.verzio) || 0;
      kar.adat = adat;
      kar.verzio = regi + 1;
      kar.modositva = ido;
      kar.modositotta = felh.n;
      sorFrissitese_('jatek', 'Karakterek', kar);
      karakterKampanyai_(kar.id, k).forEach(function (id) { kampanyok[id] = true; });
      valtozasNaplozasa_(felh, 'karakter.xp:' + xp, kar.id, regi, kar.verzio);
      ki.push({ id: kar.id, verzio: kar.verzio, modositva: ido, xp: adat.allapot.xp, bejegyzes: bejegyzes });
    });
    kampanyVerziokNovelese_(Object.keys(kampanyok), k.kampanyok);
    return { karakterek: ki };
  });
}

// ---- Karakterkép (Drive, FantasyAge/Karakterképek, nem megosztott fájlok) ----

const MAX_KEP_MERET = 2000000; // base64 karakter, kb. 1,5 MB kép

function kepMappa_() {
  const id = beallitas_('KEPMAPPA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* törölték: újra létrehozzuk */ }
  }
  const mappa = mappa_(DriveApp.getFolderById(beallitas_('MAPPA_ID')), 'Karakterképek');
  PropertiesService.getScriptProperties().setProperty('KEPMAPPA_ID', mappa.getId());
  CacheService.getScriptCache().put('prop_KEPMAPPA_ID', mappa.getId(), BEALLITAS_CACHE_MP);
  return mappa;
}

// A kép és a bélyeg feltöltése a Karakterképek mappába (karakter és NJK közös). Visszaad: { kep, belyeg, verzio }.
function kepFajlok_(elemId, kep, belyeg, regi) {
  const mappa = kepMappa_();
  const v = (regi ? Number(regi.verzio) || 0 : 0) + 1;
  const fajl = function (b64, nev) {
    return mappa.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', elemId + '_' + nev + '_' + v + '.jpg'));
  };
  const kepFajl = fajl(kep, 'kep');
  const belyegFajl = belyeg ? fajl(belyeg, 'belyeg') : null;
  return { kep: kepFajl.getId(), belyeg: belyegFajl ? belyegFajl.getId() : kepFajl.getId(), verzio: v };
}

function kepekKukaba_(kep) {
  if (!kep || typeof kep !== 'object') return;
  [kep.kep, kep.belyeg].filter(Boolean).forEach(function (id) {
    try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* már nincs meg */ }
  });
}

// action: character.image.set   adat: { id, kep, belyeg }  (base64 JPEG; kep nélkül: a kép törlése)
// A karakter adatában csak a fájlazonosítók és egy verziószám (alap.kep) tárolódik.
function karakterKepBeallitasa_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a karakter azonosítója.');
  if (a.kep && (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET)) {
    throw hiba_('tul_nagy', 'A kép túl nagy.');
  }
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem szerkesztheted.');
    const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
    adat.alap = adat.alap && typeof adat.alap === 'object' ? adat.alap : {};
    const regi = adat.alap.kep && typeof adat.alap.kep === 'object' ? adat.alap.kep : null;
    let uj = null;
    if (a.kep) uj = kepFajlok_(kar.id, a.kep, a.belyeg, regi);
    kepekKukaba_(regi);
    adat.alap.kep = uj;
    const verzio = (Number(kar.verzio) || 0);
    kar.adat = adat;
    kar.verzio = verzio + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, uj ? 'karakter.kep' : 'karakter.kep:torol', kar.id, verzio, kar.verzio);
    return { verzio: kar.verzio, modositva: kar.modositva, kep: uj };
  });
}

// action: image.get   adat: { idk: [fájlazonosító] }  → { kepek: { id: base64 } }
// Csak olyan karakter képe kérhető le, amelyet a felhasználó láthat (a sajátja, vagy egy közös kampány tagja).
function kepekLekerese_(a, felh) {
  const idk = (Array.isArray(a.idk) ? a.idk : []).slice(0, 60);
  const k = kornyezet_();
  const engedett = {};
  k.karakterek.forEach(function (kar) {
    const kep = kar.adat && typeof kar.adat === 'object' && kar.adat.alap && kar.adat.alap.kep;
    if (kep && typeof kep === 'object' && karakterLathato_(felh, kar, k)) {
      if (kep.kep) engedett[kep.kep] = true;
      if (kep.belyeg) engedett[kep.belyeg] = true;
    }
  });
  njkKepekEngedese_(felh, k, engedett);
  const kepek = {};
  idk.forEach(function (id) {
    if (!engedett[id]) return;
    try { kepek[id] = Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()); } catch (e) { /* törölt fájl */ }
  });
  return { kepek: kepek };
}

// ===== Njk.gs =====

// NJK-tár (3. lépés, 2. ütem): önálló nem játékos karakterek, a karakterekhez hasonlóan verziózva.
// Terv: claude/csata-terv.md, „NJK-tár”. A számolás (statblokk, erősítés, sablonok) a felületen van:
// web/js/jatek/leny.js és web/js/jatek/njk.js. Itt csak tárolás, jogosultság és láthatóság.
//
// Fajták: statblokk (harcoló NJK), rovid (csak tulajdonság és fókusz), koveto (követő vagy társ).
// Láthatóság: a DM mindent lát. A követőt (fajta koveto) teljesen látja a gazda karakter írója,
// az irányítója, csapathoz kötve a kampány minden tagja. A megosztott NJK-ból (Megosztások, tipus njk)
// a címzett a nevet, a képet és a nyilvános leírást látja. A titkok és a DM-jegyzet csak a DM-é.

const NJK_FAJTAK = ['statblokk', 'rovid', 'koveto'];
const MAX_NJK_MERET = 48000;

// Az NJK-k lap sorai. Ha a lap még nincs meg (az elsoBeallitas előtt), üres lista.
function njkSorok_() {
  try { return sorok_('jatek', 'NJK-k'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function njkAdat_(n) {
  return n.adat && typeof n.adat === 'object' ? n.adat : {};
}

function njkKampanyai_(n) {
  return Array.isArray(n.kampanyok) ? n.kampanyok : [];
}

function njkKep_(n) {
  const sz = njkAdat_(n).szerep;
  const kep = sz && sz.kep;
  return kep && typeof kep === 'object' ? kep : null;
}

function njkOsszefoglalo_(n) {
  const sz = njkAdat_(n).szerep || {};
  const kep = njkKep_(n);
  return {
    id: n.id, nev: n.nev, fajta: n.fajta || 'statblokk', alap_szorny: n.alap_szorny || '', fenyegetes: n.fenyegetes || '',
    kampanyok: njkKampanyai_(n), kotodes: n.kotodes || '', iranyito: n.iranyito || '',
    verzio: Number(n.verzio) || 0, modositva: n.modositva, aktiv: igaz_(n.aktiv),
    kep: kep ? (kep.belyeg || kep.kep || '') : '', koncepcio: sz.koncepcio ? String(sz.koncepcio).slice(0, 160) : ''
  };
}

// lathatosag: 'teljes' (DM: minden), 'kovetonek' (statblokk, titkok nélkül), 'nyilvanos' (név, kép, leírás)
function njkNezet_(n, lathatosag) {
  const o = njkOsszefoglalo_(n);
  o.lathatosag = lathatosag;
  const adat = njkAdat_(n);
  if (lathatosag === 'teljes') { o.adat = adat; return o; }
  const sz = adat.szerep || {};
  if (lathatosag === 'kovetonek') {
    const masolat = JSON.parse(JSON.stringify(adat));
    masolat.szerep = { kep: sz.kep || null, megjelenes: sz.megjelenes || '', koncepcio: sz.koncepcio || '',
      nyilvanos: sz.nyilvanos || '', feladatok: sz.feladatok || [] };
    o.adat = masolat;
    return o;
  }
  // nyilvános: csak a név, a kép és a nyilvános leírás
  o.adat = { szerep: { kep: sz.kep || null, nyilvanos: sz.nyilvanos || '', megjelenes: sz.megjelenes || '' } };
  delete o.alap_szorny; delete o.fenyegetes; delete o.koncepcio; delete o.iranyito;
  return o;
}

// Mennyit lát a felhasználó az NJK-ból (null: semmit). k: kornyezet_(), megosztasok: a Megosztások sorai.
function njkLathatosag_(felh, n, k, megosztasok) {
  if (felh.r === 'dm') return 'teljes';
  if (!igaz_(n.aktiv)) return null;
  if (n.fajta === 'koveto' && njkKovetoLathato_(felh, n, k)) return 'kovetonek';
  const sajat = k.karakterek.filter(function (c) { return c.jatekos_id === felh.u; }).map(function (c) { return c.id; });
  const megosztva = (megosztasok || []).some(function (m) {
    if (m.tipus !== 'njk' || m.hivatkozas !== n.id) return false;
    const kampany = k.kampanyok.find(function (x) { return x.id === m.kampany_id; });
    if (!kampany || kampany.allapot === ARCHIVALT) return false;
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep) return false;
    return szerep === 'mester' || m.cimzett === 'mindenki' || sajat.indexOf(m.cimzett) >= 0;
  });
  return megosztva ? 'nyilvanos' : null;
}

// A követő statblokkját látja: az irányítója, a gazda karakter írója (játékosa, mesterjátékosa),
// csapathoz kötve a kampányai bármelyikének tagja.
function njkKovetoLathato_(felh, n, k) {
  if (n.iranyito && n.iranyito === felh.u) return true;
  if (n.kotodes && n.kotodes !== 'csapat') {
    const gazda = k.karakterek.find(function (c) { return c.id === n.kotodes; });
    return !!gazda && karakterIrhato_(felh, gazda, k);
  }
  if (n.kotodes === 'csapat') {
    return njkKampanyai_(n).some(function (id) {
      const kampany = k.kampanyok.find(function (x) { return x.id === id; });
      return kampany && kampany.allapot !== ARCHIVALT && !!kampanySzerep_(felh, kampany, k);
    });
  }
  return false;
}

// Dobhat-e az NJK nevében: a DM; követőnél az irányító, a gazda karakter írója, csapathoz kötve a mesterjátékos.
function njkDobhat_(felh, n, k) {
  if (felh.r === 'dm') return true;
  if (n.fajta !== 'koveto' || !igaz_(n.aktiv)) return false;
  if (n.iranyito) return n.iranyito === felh.u;
  if (n.kotodes && n.kotodes !== 'csapat') {
    const gazda = k.karakterek.find(function (c) { return c.id === n.kotodes; });
    return !!gazda && karakterIrhato_(felh, gazda, k);
  }
  return njkKampanyai_(n).some(function (id) {
    const kampany = k.kampanyok.find(function (x) { return x.id === id; });
    return kampany && kampanySzerep_(felh, kampany, k) === 'mester';
  });
}

function njkKeresese_(id, sorok) {
  const n = (sorok || njkSorok_()).find(function (x) { return x.id === id; });
  if (!n) throw hiba_('nem_talalhato', 'Nincs ilyen NJK.');
  return n;
}

// A kampány NJK-i a kérő szerepe szerint (state.get).
function kampanyNjkjai_(kampany, felh, k, megosztasok) {
  const ki = [];
  njkSorok_().forEach(function (n) {
    const benne = njkKampanyai_(n).indexOf(kampany.id) >= 0;
    if (felh.r === 'dm') {
      if (benne && igaz_(n.aktiv)) ki.push(njkNezet_(n, 'teljes'));
      return;
    }
    if (!benne && !(megosztasok || []).some(function (m) { return m.tipus === 'njk' && m.hivatkozas === n.id && m.kampany_id === kampany.id; })) return;
    const l = njkLathatosag_(felh, n, k, (megosztasok || []).filter(function (m) { return m.kampany_id === kampany.id; }));
    if (l) ki.push(njkNezet_(n, l));
  });
  return ki;
}

// ---- Műveletek ----

// action: npc.list (DM)   adat: { archivaltak? }
function njkLista_(a) {
  const lista = njkSorok_()
    .filter(function (n) { return a.archivaltak || igaz_(n.aktiv); })
    .map(njkOsszefoglalo_);
  return { njkk: lista };
}

// action: npc.get   adat: { id }
function njkLekerese_(a, felh) {
  const n = njkKeresese_(a.id);
  const k = kornyezet_();
  const l = njkLathatosag_(felh, n, k, sorok_('jatek', 'Megosztások'));
  if (!l) throw hiba_('nincs_jogosultsag', 'Ezt az NJK-t nem láthatod.');
  return { njk: njkNezet_(n, l) };
}

function njkMezok_(n, a, k) {
  if (a.nev !== undefined) {
    const nev = String(a.nev || '').trim().slice(0, 120);
    if (!nev) throw hiba_('hianyzo_adat', 'Adj nevet az NJK-nak.');
    n.nev = nev;
  }
  if (a.fajta !== undefined) n.fajta = NJK_FAJTAK.indexOf(a.fajta) >= 0 ? a.fajta : 'statblokk';
  if (a.alap_szorny !== undefined) n.alap_szorny = String(a.alap_szorny || '');
  if (a.fenyegetes !== undefined) n.fenyegetes = String(a.fenyegetes || '');
  if (a.kampanyok !== undefined) {
    const ids = Array.isArray(a.kampanyok) ? a.kampanyok.map(String) : [];
    ids.forEach(function (id) { kampanyKeresese_(id, k); });
    n.kampanyok = ids.filter(function (id, i) { return ids.indexOf(id) === i; });
  }
  if (a.kotodes !== undefined) {
    const kot = String(a.kotodes || '');
    if (kot && kot !== 'csapat') karakterKeresese_(kot, k);
    n.kotodes = kot;
  }
  if (a.iranyito !== undefined) {
    const ir = String(a.iranyito || '');
    if (ir && !sorok_('jatek', 'Felhasználók').some(function (f) { return f.id === ir; })) throw hiba_('nem_talalhato', 'Nincs ilyen felhasználó.');
    n.iranyito = ir;
  }
  if (a.adat !== undefined) {
    if (!a.adat || typeof a.adat !== 'object') throw hiba_('hibas_adat', 'Hibás NJK-adat.');
    if (JSON.stringify(a.adat).length > MAX_NJK_MERET) throw hiba_('tul_nagy', 'Az NJK adatai túl nagyok egy cellához.');
    // a kép csak az npc.image.set művelettel változhat
    const regiKep = njkKep_(n);
    const adat = a.adat;
    adat.szerep = adat.szerep && typeof adat.szerep === 'object' ? adat.szerep : {};
    adat.szerep.kep = regiKep;
    n.adat = adat;
  }
}

// action: npc.save (DM)
//   adat: { id?, verzio?, nev, fajta, alap_szorny, fenyegetes, kampanyok, kotodes, iranyito, adat }
// id nélkül új NJK. A verzio az a verziószám, amelyből a felület a módosítást készítette; ha közben
// más mentett, a válasz hiba: 'utkozes', benne az aktuális NJK.
function njkMentese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const sorok = njkSorok_();
    if (!a.id) {
      const n = { id: ujId_('n'), nev: '', fajta: 'statblokk', alap_szorny: '', fenyegetes: '', kampanyok: [], kotodes: '',
        iranyito: '', adat: {}, verzio: 1, modositva: most_(), modositotta: felh.n, aktiv: true };
      njkMezok_(n, Object.assign({ nev: a.nev || '' }, a), k);
      sorHozzaadasa_('jatek', 'NJK-k', n);
      const kv = kampanyVerziokNovelese_(njkKampanyai_(n), k.kampanyok);
      valtozasNaplozasa_(felh, 'njk.letrehoz', n.id, '', 1);
      return { njk: njkNezet_(n, 'teljes'), kampany_verziok: kv };
    }
    const n = njkKeresese_(a.id, sorok);
    const regi = Number(n.verzio) || 0;
    if (a.verzio !== undefined && Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'Az NJK-t közben más is módosította.', { aktualis: njkNezet_(n, 'teljes') });
    }
    const regiKampanyok = njkKampanyai_(n).slice();
    njkMezok_(n, a, k);
    n.verzio = regi + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    const erintett = regiKampanyok.concat(njkKampanyai_(n)).filter(function (x, i, t) { return t.indexOf(x) === i; });
    const kv = kampanyVerziokNovelese_(erintett, k.kampanyok);
    valtozasNaplozasa_(felh, 'njk.ment', n.id, regi, n.verzio);
    return { njk: njkNezet_(n, 'teljes'), verzio: n.verzio, modositva: n.modositva, kampany_verziok: kv };
  });
}

// action: npc.archive (DM)   adat: { id, aktiv }
function njkArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const n = njkKeresese_(a.id);
    n.aktiv = !!a.aktiv;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    kampanyVerziokNovelese_(njkKampanyai_(n), k.kampanyok);
    valtozasNaplozasa_(felh, n.aktiv ? 'njk.visszaallit' : 'njk.archival', n.id, '', '');
    return { njk: njkOsszefoglalo_(n) };
  });
}

// action: npc.delete (DM)   adat: { id }   Csak archivált NJK törölhető; a képe a kukába kerül, a napló marad.
function njkTorlese_(a, felh) {
  return zarolva_(function () {
    const n = njkKeresese_(a.id);
    if (igaz_(n.aktiv)) throw hiba_('hibas_adat', 'Csak archivált NJK törölhető. Előbb archiváld.');
    sorTorlese_('jatek', 'NJK-k', n._sor);
    kepekKukaba_(njkKep_(n));
    valtozasNaplozasa_(felh, 'njk.torol', n.id, n.verzio, '');
    return { torolve: n.id };
  });
}

// action: npc.image.set (DM)   adat: { id, kep, belyeg }  (base64 JPEG; kep nélkül: a kép törlése)
function njkKepBeallitasa_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik az NJK azonosítója.');
  if (a.kep && (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET)) {
    throw hiba_('tul_nagy', 'A kép túl nagy.');
  }
  return zarolva_(function () {
    const k = kornyezet_();
    const n = njkKeresese_(a.id);
    const adat = njkAdat_(n);
    adat.szerep = adat.szerep && typeof adat.szerep === 'object' ? adat.szerep : {};
    const regi = njkKep_(n);
    let uj = null;
    if (a.kep) uj = kepFajlok_(n.id, a.kep, a.belyeg, regi);
    kepekKukaba_(regi);
    adat.szerep.kep = uj;
    const verzio = Number(n.verzio) || 0;
    n.adat = adat;
    n.verzio = verzio + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    kampanyVerziokNovelese_(njkKampanyai_(n), k.kampanyok);
    valtozasNaplozasa_(felh, uj ? 'njk.kep' : 'njk.kep:torol', n.id, verzio, n.verzio);
    return { verzio: n.verzio, modositva: n.modositva, kep: uj };
  });
}

// Az image.get engedélylistájához: a felhasználó által látható NJK-k képei.
function njkKepekEngedese_(felh, k, engedett) {
  const megosztasok = sorok_('jatek', 'Megosztások');
  njkSorok_().forEach(function (n) {
    const kep = njkKep_(n);
    if (!kep || !njkLathatosag_(felh, n, k, megosztasok)) return;
    if (kep.kep) engedett[kep.kep] = true;
    if (kep.belyeg) engedett[kep.belyeg] = true;
  });
}

// ===== Osszecsapasok.gs =====

// Összecsapás-építő (3. lépés, 3. ütem): előkészített összecsapások egy kampányhoz, csak a DM-nek.
// Terv: claude/csata-terv.md, „Összecsapás-építő” és „Oldalak és viszonyok”. A szerkezet (oldalak, viszonyok,
// kezdeményezési csoportok, résztvevők) és a nehézségbecslés a felületen van: web/js/jatek/osszecsapas.js.
// Itt csak tárolás, verziózás és a kampány verziójának növelése. A 4. ütem csatája ebből indul.

const OSSZECSAPAS_ALLAPOTOK = ['előkészítés', 'kész', 'lefutott'];
const MAX_OSSZECSAPAS_MERET = 48000;

// Az Összecsapások lap sorai. Ha a lap még nincs meg (az elsoBeallitas előtt), üres lista.
function osszecsapasSorok_() {
  try { return sorok_('jatek', 'Összecsapások'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function osszecsapasNezet_(e) {
  return {
    id: e.id, kampany_id: e.kampany_id, cim: e.cim, allapot: e.allapot || 'előkészítés',
    adat: e.adat && typeof e.adat === 'object' ? e.adat : {},
    verzio: Number(e.verzio) || 0, letrehozva: e.letrehozva, modositva: e.modositva, modositotta: e.modositotta || '',
    aktiv: igaz_(e.aktiv)
  };
}

function osszecsapasKeresese_(id, sorok) {
  const e = (sorok || osszecsapasSorok_()).find(function (x) { return x.id === id; });
  if (!e) throw hiba_('nem_talalhato', 'Nincs ilyen összecsapás.');
  return e;
}

// A kampány aktív összecsapásai (state.get, csak a DM-nek).
function kampanyOsszecsapasai_(kampany) {
  return osszecsapasSorok_()
    .filter(function (e) { return e.kampany_id === kampany.id && igaz_(e.aktiv); })
    .map(osszecsapasNezet_);
}

// action: encounter.list (DM)   adat: { kampany_id?, archivaltak? }
function osszecsapasLista_(a) {
  const lista = osszecsapasSorok_()
    .filter(function (e) { return (!a.kampany_id || e.kampany_id === a.kampany_id) && (a.archivaltak || igaz_(e.aktiv)); })
    .map(osszecsapasNezet_);
  return { osszecsapasok: lista };
}

function osszecsapasMezok_(e, a, k) {
  if (a.cim !== undefined) {
    const cim = String(a.cim || '').trim().slice(0, 120);
    if (!cim) throw hiba_('hianyzo_adat', 'Adj címet az összecsapásnak.');
    e.cim = cim;
  }
  if (a.kampany_id !== undefined) {
    kampanyKeresese_(a.kampany_id, k);
    e.kampany_id = a.kampany_id;
  }
  if (a.allapot !== undefined) e.allapot = OSSZECSAPAS_ALLAPOTOK.indexOf(a.allapot) >= 0 ? a.allapot : 'előkészítés';
  if (a.adat !== undefined) {
    if (!a.adat || typeof a.adat !== 'object' || Array.isArray(a.adat)) throw hiba_('hibas_adat', 'Hibás összecsapás-adat.');
    if (JSON.stringify(a.adat).length > MAX_OSSZECSAPAS_MERET) throw hiba_('tul_nagy', 'Az összecsapás adatai túl nagyok egy cellához.');
    e.adat = a.adat;
  }
}

// action: encounter.save (DM)   adat: { id?, verzio?, kampany_id, cim, allapot?, adat }
// id nélkül új összecsapás (a kampány kötelező). Ha a verzio közben elavult, a válasz hiba: 'utkozes',
// benne az aktuális összecsapás.
function osszecsapasMentese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    if (!a.id) {
      if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Válassz kampányt az összecsapásnak.');
      const e = { id: ujId_('e'), kampany_id: '', cim: '', allapot: 'előkészítés', adat: {}, verzio: 1,
        letrehozva: most_(), modositva: most_(), modositotta: felh.n, aktiv: true };
      osszecsapasMezok_(e, Object.assign({ cim: a.cim || '' }, a), k);
      sorHozzaadasa_('jatek', 'Összecsapások', e);
      const kv = kampanyVerziokNovelese_([e.kampany_id], k.kampanyok);
      valtozasNaplozasa_(felh, 'osszecsapas.letrehoz', e.id, '', 1);
      return { osszecsapas: osszecsapasNezet_(e), kampany_verziok: kv };
    }
    const e = osszecsapasKeresese_(a.id);
    const regi = Number(e.verzio) || 0;
    if (a.verzio !== undefined && Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'Az összecsapást közben más is módosította.', { aktualis: osszecsapasNezet_(e) });
    }
    const regiKampany = e.kampany_id;
    osszecsapasMezok_(e, a, k);
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Összecsapások', e);
    const kv = kampanyVerziokNovelese_([regiKampany, e.kampany_id].filter(function (x, i, t) { return x && t.indexOf(x) === i; }), k.kampanyok);
    valtozasNaplozasa_(felh, 'osszecsapas.ment', e.id, regi, e.verzio);
    return { osszecsapas: osszecsapasNezet_(e), verzio: e.verzio, modositva: e.modositva, kampany_verziok: kv };
  });
}

// action: encounter.archive (DM)   adat: { id, aktiv }
function osszecsapasArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const e = osszecsapasKeresese_(a.id);
    e.aktiv = !!a.aktiv;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Összecsapások', e);
    kampanyVerziokNovelese_([e.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, e.aktiv ? 'osszecsapas.visszaallit' : 'osszecsapas.archival', e.id, '', '');
    return { osszecsapas: osszecsapasNezet_(e) };
  });
}

// action: encounter.delete (DM)   adat: { id }   Csak archivált összecsapás törölhető.
function osszecsapasTorlese_(a, felh) {
  return zarolva_(function () {
    const e = osszecsapasKeresese_(a.id);
    if (igaz_(e.aktiv)) throw hiba_('hibas_adat', 'Csak archivált összecsapás törölhető. Előbb archiváld.');
    sorTorlese_('jatek', 'Összecsapások', e._sor);
    valtozasNaplozasa_(felh, 'osszecsapas.torol', e.id, e.verzio, '');
    return { torolve: e.id };
  });
}

// A kampány törlésekor az összecsapásai is törlődnek (zárolás alatt hívandó).
function kampanyOsszecsapasainakTorlese_(kampanyId) {
  const sorok = osszecsapasSorok_().filter(function (e) { return e.kampany_id === kampanyId; });
  if (sorok.length) sorokTorlese_('jatek', 'Összecsapások', sorok.map(function (e) { return e._sor; }));
  return sorok.length;
}

// ===== Csatak.gs =====

// Csatamotor (3. lépés, 4. ütem): a csaták tárolása. A szabályok és minden lépés a felületen van
// (web/js/jatek/csata.js); a felület a lépés utáni teljes állapotot küldi, itt csak verzió, dupla küldés
// szűrése, a játékos karakterek Egészségének visszaírása és a kampány verziójának növelése történik.
// Terv: claude/csata-terv.md, „Csataállapot” és „Háttér és teljesítmény”. A 4. ütemben csak a DM vezeti a csatát;
// a játékosok oldala (5. ütem) a kiadott állapot szűrésével és a saját lépések ellenőrzésével bővül.

const CSATA_ALLAPOTOK = ['kezdemenyezes', 'fut', 'lezart'];
const MAX_CSATA_MERET = 48000;
const LEZART_CSATAK_SZAMA = 10;

function csataSorok_() {
  try { return sorok_('jatek', 'Csaták'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function csataNezet_(c) {
  return {
    id: c.id, kampany_id: c.kampany_id, osszecsapas_id: c.osszecsapas_id || '', cim: c.cim, allapot: c.allapot,
    kor: Number(c.kor) || 0, adat: c.adat && typeof c.adat === 'object' ? c.adat : {},
    pillanatkepek: c.pillanatkepek && typeof c.pillanatkepek === 'object' ? c.pillanatkepek : {},
    verzio: Number(c.verzio) || 0, letrehozva: c.letrehozva, modositva: c.modositva, modositotta: c.modositotta || '', lezarva: c.lezarva || ''
  };
}

function csataKeresese_(id, sorok) {
  const c = (sorok || csataSorok_()).find(function (x) { return x.id === id; });
  if (!c) throw hiba_('nem_talalhato', 'Nincs ilyen csata.');
  return c;
}

// A kampány csatái a DM-nek (state.get): a folyamatban lévők teljes adattal, a lezártak röviden (a napló szűrőjéhez).
function kampanyCsatai_(kampany) {
  const mind = csataSorok_().filter(function (c) { return c.kampany_id === kampany.id; });
  const futo = mind.filter(function (c) { return c.allapot !== 'lezart'; }).map(csataNezet_);
  const lezart = mind.filter(function (c) { return c.allapot === 'lezart'; }).slice(-LEZART_CSATAK_SZAMA)
    .map(function (c) { return { id: c.id, cim: c.cim, allapot: 'lezart', lezarva: c.lezarva || '', osszecsapas_id: c.osszecsapas_id || '' }; });
  return futo.concat(lezart);
}

function csataAdatEllenorzes_(adat, pillanatkepek) {
  if (!adat || typeof adat !== 'object' || Array.isArray(adat) || !Array.isArray(adat.resztvevok)) throw hiba_('hibas_adat', 'Hibás csataállapot.');
  if (JSON.stringify(adat).length > MAX_CSATA_MERET) throw hiba_('tul_nagy', 'A csata állapota túl nagy egy cellához.');
  if (pillanatkepek !== undefined && JSON.stringify(pillanatkepek || {}).length > MAX_CSATA_MERET) throw hiba_('tul_nagy', 'A lények pillanatképei túl nagyok egy cellához.');
}

// A játékos karakterek Egészségének visszaírása a karakter saját állapotába (zárolás alatt hívandó).
// ertekek: { karakter id: egeszseg }. Csak a csata résztvevőiként szereplő karakterek írhatók.
function csataKarakterek_(csata, ertekek, k, felh) {
  if (!ertekek || typeof ertekek !== 'object') return [];
  const resztvevoKarakterek = (csata.adat.resztvevok || []).filter(function (r) { return r.forras && r.forras.tipus === 'karakter'; })
    .map(function (r) { return r.forras.id; });
  const irt = [];
  Object.keys(ertekek).forEach(function (kid) {
    if (resztvevoKarakterek.indexOf(kid) < 0) return;
    const kar = k.karakterek.find(function (x) { return x.id === kid; });
    if (!kar) return;
    const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
    adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
    const uj = Math.max(0, Math.round(Number(ertekek[kid]) || 0));
    // a régi szerkezetű (átvett) karakternél a felület az egeszseg.aktualis mezőből olvas
    const regiSzerk = !(Number(adat.sema) >= 1) && adat.egeszseg && typeof adat.egeszseg === 'object';
    if (adat.allapot.egeszseg === uj && (!regiSzerk || Number(adat.egeszseg.aktualis) === uj)) return;
    adat.allapot.egeszseg = uj;
    if (regiSzerk) adat.egeszseg.aktualis = uj;
    kar.adat = adat;
    kar.verzio = (Number(kar.verzio) || 0) + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    irt.push(kid);
  });
  return irt;
}

// action: combat.start (DM)   adat: { kampany_id, osszecsapas_id?, cim, adat, pillanatkepek? }
// A felület az összecsapásból (vagy gyors csataként) állítja össze az állapotot (csata.js csataOsszecsapasbol).
function csataInditasa_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány.');
  csataAdatEllenorzes_(a.adat, a.pillanatkepek);
  return zarolva_(function () {
    const k = kornyezet_();
    kampanyKeresese_(a.kampany_id, k);
    if (a.osszecsapas_id) {
      const e = osszecsapasKeresese_(a.osszecsapas_id);
      if (e.kampany_id !== a.kampany_id) throw hiba_('hibas_adat', 'Az összecsapás másik kampányé.');
    }
    const c = {
      id: ujId_('b'), kampany_id: a.kampany_id, osszecsapas_id: a.osszecsapas_id || '',
      cim: String(a.cim || 'Csata').trim().slice(0, 120) || 'Csata',
      allapot: CSATA_ALLAPOTOK.indexOf(a.adat.allapot) >= 0 ? a.adat.allapot : 'kezdemenyezes', kor: Number(a.adat.kor) || 0,
      adat: a.adat, pillanatkepek: a.pillanatkepek && typeof a.pillanatkepek === 'object' ? a.pillanatkepek : {},
      verzio: 1, letrehozva: most_(), modositva: most_(), modositotta: felh.n, lezarva: ''
    };
    sorHozzaadasa_('jatek', 'Csaták', c);
    const kv = kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.indit', c.id, '', 1);
    return { csata: csataNezet_(c), kampany_verziok: kv };
  });
}

// action: combat.act (DM)   adat: { id, verzio, kulcs, adat, karakterek?: { karakter id: egeszseg }, pillanatkepek? }
// A pillanatkepek a csata közben felvett lények statblokkjai (a meglévőkhöz fűződnek).
// Egy lépés (vagy visszavonás) utáni állapot. A kulcs a dupla küldést szűri: ha már feldolgozott lépés jön
// újra, a válasz az aktuális állapot, változás nélkül. Elavult verziónál 'utkozes', benne az aktuális csata.
function csataLepese_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a csata azonosítója.');
  csataAdatEllenorzes_(a.adat);
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    const regi = Number(c.verzio) || 0;
    const kulcsok = c.adat && Array.isArray(c.adat.kulcsok) ? c.adat.kulcsok : [];
    if (a.kulcs && kulcsok.indexOf(a.kulcs) >= 0) return { csata: csataNezet_(c), ismetelt: true, kampany_verziok: {} };
    if (c.allapot === 'lezart') throw hiba_('hibas_adat', 'Ez a csata már lezárult.');
    if (Number(a.verzio) !== regi) throw hiba_('utkozes', 'A csatát közben más is léptette.', { aktualis: csataNezet_(c) });
    if (a.pillanatkepek && typeof a.pillanatkepek === 'object') {
      const pk = Object.assign({}, c.pillanatkepek && typeof c.pillanatkepek === 'object' ? c.pillanatkepek : {}, a.pillanatkepek);
      if (JSON.stringify(pk).length <= MAX_CSATA_MERET) c.pillanatkepek = pk; // ha nem fér el, a lény a szabályadatból számol
    }
    c.adat = a.adat;
    c.allapot = CSATA_ALLAPOTOK.indexOf(a.adat.allapot) >= 0 && a.adat.allapot !== 'lezart' ? a.adat.allapot : c.allapot;
    c.kor = Number(a.adat.kor) || 0;
    c.verzio = regi + 1;
    c.modositva = most_();
    c.modositotta = felh.n;
    sorFrissitese_('jatek', 'Csaták', c);
    const irt = csataKarakterek_(c, a.karakterek, k, felh);
    const kv = kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    return { csata: csataNezet_(c), verzio: c.verzio, karakterek: irt, kampany_verziok: kv };
  });
}

// action: combat.close (DM)   adat: { id, adat? }   A csata lezárása; az összecsapása „lefutott” lesz.
// (Az összesítő, az XP és az NJK-k állapotának visszaírása az 5. ütemben jön.)
function csataLezarasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    if (a.adat) { csataAdatEllenorzes_(a.adat); c.adat = a.adat; }
    c.allapot = 'lezart';
    if (c.adat && typeof c.adat === 'object') c.adat.allapot = 'lezart';
    c.lezarva = most_();
    c.verzio = (Number(c.verzio) || 0) + 1;
    c.modositva = most_();
    c.modositotta = felh.n;
    sorFrissitese_('jatek', 'Csaták', c);
    if (c.osszecsapas_id) {
      const e = osszecsapasSorok_().find(function (x) { return x.id === c.osszecsapas_id; });
      if (e) {
        e.allapot = 'lefutott';
        e.verzio = (Number(e.verzio) || 0) + 1;
        e.modositva = most_();
        e.modositotta = felh.n;
        sorFrissitese_('jatek', 'Összecsapások', e);
      }
    }
    kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.lezar', c.id, '', c.verzio);
    return { csata: csataNezet_(c) };
  });
}

// action: combat.delete (DM)   adat: { id }   Elrontott vagy kipróbált csata törlése. A dobásnapló sorai maradnak.
function csataTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    sorTorlese_('jatek', 'Csaták', c._sor);
    kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.torol', c.id, c.verzio, '');
    return { torolve: c.id };
  });
}

// A kampány törlésekor a csatái is törlődnek (zárolás alatt hívandó).
function kampanyCsatainakTorlese_(kampanyId) {
  const sorok = csataSorok_().filter(function (c) { return c.kampany_id === kampanyId; });
  if (sorok.length) sorokTorlese_('jatek', 'Csaták', sorok.map(function (c) { return c._sor; }));
  return sorok.length;
}

// ===== Kampanyok.gs =====

// Kampányok, karakterek kampányhoz rendelése, és a kampány élő állapota (state.get).

const DOBASNAPLO_HOSSZ = 100;

function kampanyNezet_(kampany, szerep) {
  const o = {
    id: kampany.id, cim: kampany.cim, mesterjatekos_id: kampany.mesterjatekos_id || '',
    aktiv_forrasok: Array.isArray(kampany.aktiv_forrasok) ? kampany.aktiv_forrasok : [],
    allapot: kampany.allapot, verzio: Number(kampany.verzio) || 0, sajat_szerep: szerep,
    beallitasok: kampanyBeallitasai_(kampany)
  };
  if (szerep === 'dm') o.dm_jegyzet = kampany.dm_jegyzet || '';
  return o;
}

const ARCHIVALT = 'archivált';

// action: campaigns.list
// Az archivált kampányokat csak a DM látja.
function kampanyLista_(a, felh, kornyezet) {
  const k = kornyezet || kornyezet_();
  const lista = [];
  k.kampanyok.forEach(function (kampany) {
    const szerep = kampanySzerep_(felh, kampany, k);
    if (szerep && (szerep === 'dm' || kampany.allapot !== ARCHIVALT)) lista.push(kampanyNezet_(kampany, szerep));
  });
  return { kampanyok: lista };
}

// action: init
// Minden, ami a nyitóképernyőhöz kell, egyetlen hívásban: kampányok, karakterek, és a DM-nek a felhasználók.
function indulas_(a, felh) {
  const k = kornyezet_();
  const o = {
    kampanyok: kampanyLista_(a, felh, k).kampanyok,
    karakterek: karakterLista_(a, felh, k).karakterek
  };
  if (felh.r === 'dm') o.felhasznalok = sorok_('jatek', 'Felhasználók').map(publikus_);
  return o;
}

// action: campaign.delete (csak DM)   adat: { id }
// Csak archivált kampány törölhető. A kampánykapcsolatok törlődnek, a karakterek megmaradnak,
// a dobásnapló és a megosztások sorai is maradnak. A kampány összecsapásai és csatái törlődnek.
function kampanyTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.id, k);
    if (kampany.allapot !== ARCHIVALT) throw hiba_('hibas_adat', 'Csak archivált kampány törölhető. Előbb archiváld.');
    const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; });
    sorokTorlese_('jatek', 'Kampánykarakterek', kapcsolatok.map(function (x) { return x._sor; }));
    kampanyOsszecsapasainakTorlese_(kampany.id);
    kampanyCsatainakTorlese_(kampany.id);
    sorTorlese_('jatek', 'Kampányok', kampany._sor);
    CacheService.getScriptCache().remove('kv_' + kampany.id);
    valtozasNaplozasa_(felh, 'kampany.torol', kampany.id, kampany.verzio, '');
    return { torolve: kampany.id };
  });
}

// action: campaign.create (DM)   adat: { cim, aktiv_forrasok?, mesterjatekos_id?, allapot? }
function kampanyLetrehozasa_(a, felh) {
  const cim = String(a.cim || '').trim();
  if (!cim) throw hiba_('hianyzo_adat', 'Adj címet a kampánynak.');
  return zarolva_(function () {
    const kampany = {
      id: ujId_('c'), cim: cim, mesterjatekos_id: a.mesterjatekos_id || '',
      aktiv_forrasok: a.aktiv_forrasok || ['Alapkönyv', 'Companion'],
      allapot: a.allapot || 'előkészítés', verzio: 1, dm_jegyzet: a.dm_jegyzet || '', letrehozva: most_()
    };
    sorHozzaadasa_('jatek', 'Kampányok', kampany);
    valtozasNaplozasa_(felh, 'kampany.letrehoz', kampany.id, '', 1);
    return { kampany: kampanyNezet_(kampany, 'dm') };
  });
}

// action: campaign.update (DM)   adat: { id, cim?, aktiv_forrasok?, mesterjatekos_id?, allapot?, dm_jegyzet?, beallitasok? }
function kampanyModositasa_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    const kampany = kampanyok.find(function (x) { return x.id === a.id; });
    if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    ['cim', 'aktiv_forrasok', 'mesterjatekos_id', 'allapot', 'dm_jegyzet'].forEach(function (m) {
      if (a[m] !== undefined) kampany[m] = a[m];
    });
    if (a.beallitasok && typeof a.beallitasok === 'object') {
      const regi = kampany.beallitasok && typeof kampany.beallitasok === 'object' ? kampany.beallitasok : {};
      kampany.beallitasok = Object.assign({}, regi, a.beallitasok);
    }
    sorFrissitese_('jatek', 'Kampányok', kampany);
    kampanyVerziokNovelese_([kampany.id], kampanyok);
    valtozasNaplozasa_(felh, 'kampany.modosit', kampany.id, '', kampany.verzio);
    return { kampany: kampanyNezet_(kampany, 'dm') };
  });
}

// action: campaign.addCharacter (DM)   adat: { kampany_id, karakter_id, allapot? }
// allapot: aktív, távol, kilépett, elhunyt. Ha a karakter már a kampányban van, csak az állapota változik.
// Egy karakter egyszerre csak egy kampányban aktív: ha itt aktív lesz, a többi kampányában, ahol aktív
// volt, „kilépett” állapotba kerül (a válasz kileptetve listája mutatja, hol).
function kampanyhozRendeles_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    kampanyKeresese_(a.kampany_id, k);
    karakterKeresese_(a.karakter_id, k);
    const allapot = a.allapot || 'aktív';
    const letezo = k.kapcsolatok.find(function (x) { return x.kampany_id === a.kampany_id && x.karakter_id === a.karakter_id; });
    if (letezo) {
      letezo.allapot = allapot;
      sorFrissitese_('jatek', 'Kampánykarakterek', letezo);
    } else {
      sorHozzaadasa_('jatek', 'Kampánykarakterek', { kampany_id: a.kampany_id, karakter_id: a.karakter_id, allapot: allapot, csatlakozott: most_() });
    }
    const kileptetve = [];
    if (allapot === 'aktív') {
      k.kapcsolatok.forEach(function (x) {
        if (x.karakter_id !== a.karakter_id || x.kampany_id === a.kampany_id) return;
        if ((x.allapot || 'aktív') !== 'aktív') return;
        x.allapot = 'kilépett';
        sorFrissitese_('jatek', 'Kampánykarakterek', x);
        kileptetve.push(x.kampany_id);
        valtozasNaplozasa_(felh, 'kampany.karakter:kilépett (másik kampányban aktív)', a.karakter_id, '', x.kampany_id);
      });
    }
    kampanyVerziokNovelese_([a.kampany_id].concat(kileptetve), k.kampanyok);
    valtozasNaplozasa_(felh, 'kampany.karakter:' + allapot, a.karakter_id, '', a.kampany_id);
    return { kileptetve: kileptetve };
  });
}

// action: campaign.removeCharacter (DM)   adat: { kampany_id, karakter_id }
function kampanybolKivetel_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const letezo = k.kapcsolatok.find(function (x) { return x.kampany_id === a.kampany_id && x.karakter_id === a.karakter_id; });
    if (!letezo) throw hiba_('nem_talalhato', 'A karakter nincs ebben a kampányban.');
    sorTorlese_('jatek', 'Kampánykarakterek', letezo._sor);
    kampanyVerziokNovelese_([a.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'kampany.karakter:kivesz', a.karakter_id, '', a.kampany_id);
    return {};
  });
}

// action: state.get   adat: { kampany_id }
// A kampány élő állapota, a kérő szerepe szerint szűrve.
function allapotLekerese_(a, felh) {
  const k = kornyezet_();
  const kampany = kampanyKeresese_(a.kampany_id, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
  if (szerep !== 'dm' && kampany.allapot === ARCHIVALT) throw hiba_('nincs_jogosultsag', 'Ez a kampány archiválva van.');
  const mindentLat = szerep === 'dm' || szerep === 'mester';

  const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; });
  const karakterek = kapcsolatok.map(function (x) {
    const kar = k.karakterek.find(function (c) { return c.id === x.karakter_id; });
    if (!kar || !igaz_(kar.aktiv)) return null; // archivált karakter nem látszik a kampányban
    const irhato = karakterIrhato_(felh, kar, k);
    const o = irhato ? karakterTeljes_(kar, k, felh) : {
      // a csapattársakról csak a névsor látszik
      id: kar.id, nev: kar.nev, faj: kar.faj, osztaly: kar.osztaly, szint: kar.szint, irhato: false, kep: karakterBelyeg_(kar)
    };
    o.kampany_allapot = x.allapot;
    return o;
  }).filter(Boolean);

  const sajatKarakterek = karakterek.filter(function (c) { return c.irhato; }).map(function (c) { return c.id; });

  const probak = kampanyProbai_(kampany, szerep, sajatKarakterek);
  // rejtett Célértékű próbakérés dobásainál a játékos nem látja a Célértéket (csak a sikert)
  const rejtettCel = {};
  if (!mindentLat) probaSorok_().forEach(function (p) {
    if (p.kampany_id === kampany.id && igaz_rejtett_(p.celertek_rejtett)) rejtettCel[p.id] = true;
  });
  const dobasok = utolsoSorok_('jatek', 'Dobásnapló', DOBASNAPLO_HOSSZ * 3)
    .filter(function (d) { return d.kampany_id === kampany.id; })
    .filter(function (d) { return szerep === 'dm' || !igaz_rejtett_(d.rejtett); })
    .slice(-DOBASNAPLO_HOSSZ)
    .map(function (d) {
      delete d._sor;
      d.rejtett = igaz_rejtett_(d.rejtett);
      d.kezi = igaz_rejtett_(d.kezi);
      d.felfedve = igaz_rejtett_(d.felfedve);
      if (d.proba_id && rejtettCel[d.proba_id]) d.celertek = '';
      return d;
    });

  const osszesMegosztas = sorok_('jatek', 'Megosztások');
  const njkk = kampanyNjkjai_(kampany, felh, k, osszesMegosztas);
  const megosztasok = osszesMegosztas
    .filter(function (m) { return m.kampany_id === kampany.id; })
    .filter(function (m) { return mindentLat || m.cimzett === 'mindenki' || sajatKarakterek.indexOf(m.cimzett) >= 0; })
    .map(function (m) { delete m._sor; return m; });

  const o = {
    verzio: Number(kampany.verzio) || 0,
    kampany: kampanyNezet_(kampany, szerep),
    karakterek: karakterek,
    dobasok: dobasok,
    probak: probak,
    megosztasok: megosztasok,
    njkk: njkk
  };
  // az előkészített összecsapások csak a DM-é
  if (szerep === 'dm') {
    o.osszecsapasok = kampanyOsszecsapasai_(kampany);
    o.csatak = kampanyCsatai_(kampany); // a játékosok a csatát az 5. ütemtől látják
  }
  return o;
}

// A rejtett mező üresen hamis (szemben az aktiv mezővel, ami üresen igaz).
function igaz_rejtett_(x) {
  return x === true || ['true', 'igen', '1'].indexOf(String(x).toLowerCase()) >= 0;
}

// ===== Dobasok.gs =====

// Dobásnapló, próbakérések és megosztások. A kocka a böngészőben gurul, ide csak az eredmény érkezik.
// A próbák szabályai (a felületen): web/js/jatek/proba.js. Itt csak annyi számolás van, amennyi a rejtett
// Célértékhez és a próbakérés állásához kell (a játékos böngészője a rejtett Célértéket nem ismeri).

const DOBAS_TIPUSOK = ['alap', 'ellen', 'osszetett', 'tamadas', 'varazslas', 'szabad', 'titkos', 'kezdemenyezes', 'sebzes'];
const PROBA_TIPUSOK = ['alap', 'ellen', 'osszetett', 'titkos'];
const KERESES_HOSSZ = 1000; // ennyi utolsó dobássorban keres a roll.update és a dupla küldés szűrése

function szamOsszeg_(kockak) {
  return (kockak || []).reduce(function (a, b) { return a + (Number(b) || 0); }, 0);
}

function duplaE_(k) {
  return k.length === 3 && (k[0] === k[1] || k[0] === k[2] || k[1] === k[2]);
}

// A próba kiértékelése a szerveren (csak a rejtett Célértékű és a próbakéréshez tartozó dobásoknál).
function dobasKiertekelese_(kockak, modosito, celertek, opciok) {
  const o = opciok || {};
  const osszeg = szamOsszeg_(kockak) + (Number(modosito) || 0);
  let eredmeny = '';
  if (o.fokusz_hianyzik) eredmeny = 'kudarc';
  else if (celertek !== '' && celertek !== undefined && celertek !== null && !isNaN(Number(celertek))) {
    eredmeny = osszeg >= Number(celertek) ? 'siker' : 'kudarc';
  }
  const mp = !o.mutatvany_tiltva && duplaE_(kockak) && eredmeny !== 'kudarc' ? Number(kockak[2]) || 0 : 0;
  return { osszeg: osszeg, eredmeny: eredmeny, mutatvanypont: mp };
}

// action: roll.log
// adat: { id?, kampany_id?, karakter_id?, mire, kockak: [k1, k2, sarkanykocka], modosito, celertek?, eredmeny?,
//         mutatvanypont?, rejtett?, proba_id?, tipus?, tulajdonsag?, fokusz?, kezi?, reszletek?, ellenfel?, njk_id?, csata_id? }
// A csata dobásai (kezdeményezés, támadás, sebzés) csata_id-vel kerülnek a naplóba (4. ütem).
// Kampány nélkül is naplózható, ha van karakter, és a hívó szerkesztheti (a karakter saját dobásai).
// njk_id: az NJK-tár elemének dobása (a DM, követőnél az irányító vagy a gazda karakter írója dobhat érte).
function dobasNaplozasa_(a, felh) {
  if (!a.kampany_id && !a.karakter_id && !a.njk_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány, a karakter vagy az NJK azonosítója.');
  if (!Array.isArray(a.kockak) || a.kockak.length < 1) throw hiba_('hianyzo_adat', 'Hiányoznak a kockák.');
  return zarolva_(function () {
    const k = kornyezet_();
    let kampany = null, szerep = null;
    if (a.kampany_id) {
      kampany = kampanyKeresese_(a.kampany_id, k);
      szerep = kampanySzerep_(felh, kampany, k);
      if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    }
    if (a.karakter_id) {
      const kar = karakterKeresese_(a.karakter_id, k);
      if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ennek a karakternek a nevében nem dobhatsz.');
    }
    if (a.njk_id) {
      const n = njkKeresese_(a.njk_id);
      if (!njkDobhat_(felh, n, k)) throw hiba_('nincs_jogosultsag', 'Ennek az NJK-nak a nevében nem dobhatsz.');
    }
    // kiesés utáni újraküldésnél ne kerüljön be kétszer ugyanaz a dobás
    if (a.id) {
      const megvan = utolsoSorok_('jatek', 'Dobásnapló', KERESES_HOSSZ).find(function (d) { return d.id === a.id; });
      if (megvan) { delete megvan._sor; return { dobas: megvan, kampany_verziok: {} }; }
    }
    const dobas = {
      id: a.id || ujId_('d'), idopont: most_(), kampany_id: kampany ? kampany.id : '', karakter_id: a.karakter_id || '',
      dobta: felh.n, mire: a.mire || '', kockak: a.kockak, modosito: Number(a.modosito) || 0,
      celertek: a.celertek === undefined || a.celertek === null ? '' : a.celertek, eredmeny: a.eredmeny || '',
      mutatvanypont: Number(a.mutatvanypont) || 0,
      rejtett: szerep === 'dm' && !!a.rejtett, // rejtett dobás csak a DM-é lehet
      proba_id: '', tipus: DOBAS_TIPUSOK.indexOf(a.tipus) >= 0 ? a.tipus : '',
      tulajdonsag: a.tulajdonsag || '', fokusz: a.fokusz || '', kezi: !!a.kezi, felfedve: false,
      reszletek: a.reszletek && typeof a.reszletek === 'object' ? a.reszletek : '',
      njk_id: a.njk_id || '', csata_id: a.csata_id || ''
    };
    let proba = null;
    if (a.proba_id && kampany) {
      proba = probaSorok_().find(function (p) { return p.id === a.proba_id && p.kampany_id === kampany.id; });
      if (proba) probahozDobas_(proba, dobas, a, szerep);
    }
    sorHozzaadasa_('jatek', 'Dobásnapló', dobas);
    if (proba) sorFrissitese_('jatek', 'Próbák', proba);
    // a rejtett dobás nem jelez változást a játékosoknak (a DM kliense a küldés után maga frissít)
    const verziok = kampany && !dobas.rejtett ? kampanyVerziokNovelese_([kampany.id], k.kampanyok) : {};
    return { dobas: dobas, kampany_verziok: verziok };
  });
}

// Próbakéréshez tartozó dobás: a szerver értékel (rejtett Célérték, kötelező fókusz, tiltott Mutatványpont),
// és frissíti a kérés állását. Az állás kulcsa a karakter, az ellenfélé '_ellenfel', a DM szabad dobásáé '_dm'.
function probahozDobas_(proba, dobas, a, szerep) {
  if (proba.allapot === 'lezart') throw hiba_('hibas_adat', 'Ez a próba már le van zárva.');
  dobas.proba_id = proba.id;
  if (!dobas.tipus) dobas.tipus = proba.tipus;
  const ellenfel = !!a.ellenfel && (szerep === 'dm' || szerep === 'mester');
  const kulcs = ellenfel ? '_ellenfel' : (dobas.karakter_id || '_dm');
  if (proba.tipus === 'titkos') dobas.rejtett = true;
  if (!ellenfel) {
    const fokuszok = Array.isArray(proba.fokuszok) ? proba.fokuszok : [];
    const mut = proba.mutatvany && typeof proba.mutatvany === 'object' ? proba.mutatvany : {};
    const celertek = proba.tipus === 'ellen' ? '' : proba.celertek;
    const ert = dobasKiertekelese_(dobas.kockak, dobas.modosito, celertek, {
      fokusz_hianyzik: igaz_rejtett_(proba.fokusz_kotelezo) && fokuszok.length > 0 && fokuszok.indexOf(dobas.fokusz) < 0,
      mutatvany_tiltva: mut.engedett === false
    });
    if (celertek !== '' && celertek !== undefined) {
      dobas.celertek = Number(celertek);
      dobas.eredmeny = ert.eredmeny;
      dobas.mutatvanypont = ert.mutatvanypont;
    } else if (mut.engedett === false) dobas.mutatvanypont = 0;
  }
  const allas = proba.allas && typeof proba.allas === 'object' ? proba.allas : {};
  const e = allas[kulcs] || { dobasok: [], osszeg: 0, kesz: false };
  e.dobasok.push(dobas.id);
  e.utolso = { osszeg: szamOsszeg_(dobas.kockak) + dobas.modosito, sarkany: Number(dobas.kockak[2]) || 0,
    eredmeny: dobas.eredmeny, mutatvanypont: dobas.mutatvanypont, idopont: dobas.idopont };
  if (proba.tipus === 'osszetett' && dobas.eredmeny === 'siker') {
    e.osszeg += Number(dobas.kockak[2]) || 0;
    if (!e.kesz && e.osszeg >= (Number(proba.kuszob) || 0)) {
      e.kesz = true;
      // a saját bejegyzés (amely már szerepelhet az állásban) nem számít bele
      e.kesz_sorszam = Object.keys(allas).filter(function (x) { return x !== kulcs && allas[x].kesz; }).length + 1;
      e.probak_szama = e.dobasok.length;
    }
  }
  allas[kulcs] = e;
  proba.allas = allas;
}

// action: roll.update   adat: { id, mutatvanyok?: [{ id, mp, db, nev }], plusz?: [{ ertek, eredet }], felfedve?: true }
// A plusz a képességekből járó további Mutatványpont (Gengszter, Legendás, egy társ Lelkesítése).
// A mutatványokat a dobó (vagy a DM, mesterjátékos) rögzítheti, felfedni csak a DM tud.
function dobasModositasa_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a dobás azonosítója.');
  return zarolva_(function () {
    const k = kornyezet_();
    const dobas = utolsoSorok_('jatek', 'Dobásnapló', KERESES_HOSSZ).find(function (d) { return d.id === a.id; });
    if (!dobas) throw hiba_('nem_talalhato', 'Nincs ilyen dobás (vagy túl régi).');
    const kampany = dobas.kampany_id ? k.kampanyok.find(function (x) { return x.id === dobas.kampany_id; }) : null;
    const szerep = kampany ? kampanySzerep_(felh, kampany, k) : (felh.r === 'dm' ? 'dm' : null);
    const kar = dobas.karakter_id ? k.karakterek.find(function (x) { return x.id === dobas.karakter_id; }) : null;
    const sajat = dobas.dobta === felh.n || (kar && karakterIrhato_(felh, kar, k));
    if (a.felfedve !== undefined && szerep !== 'dm') throw hiba_('nincs_jogosultsag', 'Rejtett dobást csak a DM fedhet fel.');
    if (a.mutatvanyok !== undefined && !sajat && szerep !== 'dm' && szerep !== 'mester') throw hiba_('nincs_jogosultsag', 'Ehhez a dobáshoz nincs jogosultságod.');
    const reszletek = dobas.reszletek && typeof dobas.reszletek === 'object' ? dobas.reszletek : {};
    if (a.mutatvanyok !== undefined) {
      if (!Array.isArray(a.mutatvanyok)) throw hiba_('hibas_adat', 'A mutatványok listája hibás.');
      reszletek.mutatvanyok = a.mutatvanyok.slice(0, 20).map(function (m) {
        return { id: String(m.id || ''), mp: Number(m.mp) || 0, db: Number(m.db) || 1, nev: m.nev ? String(m.nev).slice(0, 80) : undefined };
      });
      if (Array.isArray(a.plusz)) reszletek.mp_plusz = a.plusz.slice(0, 10).map(function (x) {
        return { ertek: Number(x.ertek) || 0, eredet: String(x.eredet || '').slice(0, 80) };
      });
    }
    dobas.reszletek = reszletek;
    if (a.felfedve) { dobas.felfedve = true; dobas.rejtett = false; }
    sorFrissitese_('jatek', 'Dobásnapló', dobas);
    const verziok = kampany && (!igaz_rejtett_(dobas.rejtett) || a.felfedve) ? kampanyVerziokNovelese_([kampany.id], k.kampanyok) : {};
    delete dobas._sor;
    return { dobas: dobas, kampany_verziok: verziok };
  });
}

// action: roll.list   adat: { karakter_id, elotte?: idopont, db?: 50 }
// Egy karakter dobásai (a karakter oldalához), az újabbak elöl. A rejtetteket csak a DM látja.
function dobasLista_(a, felh) {
  const k = kornyezet_();
  const kar = karakterKeresese_(a.karakter_id, k);
  if (!karakterLathato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ennek a karakternek a dobásait nem láthatod.');
  const db = Math.min(Number(a.db) || 50, 200);
  // ritka hívás: közvetlenül a táblázatból, hogy a nagy eredmény ne terhelje a gyorsítótárat
  const lista = utolsoSorokTablazatbol_('jatek', 'Dobásnapló', 3000)
    .filter(function (d) { return d.karakter_id === kar.id; })
    .filter(function (d) { return felh.r === 'dm' || !igaz_rejtett_(d.rejtett); })
    .filter(function (d) { return !a.elotte || String(d.idopont) < String(a.elotte); })
    .reverse().slice(0, db)
    .map(function (d) { delete d._sor; d.rejtett = igaz_rejtett_(d.rejtett); return d; });
  return { dobasok: lista, tobb: lista.length === db };
}

// ---- Próbakérések (DM és mesterjátékos) ----

// A Próbák lap sorai. Ha a lap még nincs meg (új verzió, de az elsoBeallitas még nem futott), üres lista,
// hogy a kampány állapota addig is betöltődjön.
function probaSorok_() {
  try { return sorok_('jatek', 'Próbák'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function probaJog_(felh, kampanyId, tipus) {
  const k = kornyezet_();
  const kampany = kampanyKeresese_(kampanyId, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (szerep !== 'dm' && szerep !== 'mester') throw hiba_('nincs_jogosultsag', 'Próbát a DM és a mesterjátékos kérhet.');
  if (tipus === 'titkos' && szerep !== 'dm') throw hiba_('nincs_jogosultsag', 'Titkos próbát csak a DM kérhet.');
  return { k: k, kampany: kampany, szerep: szerep };
}

function probaMezok_(p, a) {
  if (a.cim !== undefined) p.cim = String(a.cim || '').slice(0, 120);
  if (a.tulajdonsag !== undefined) p.tulajdonsag = a.tulajdonsag || '';
  if (a.fokuszok !== undefined) p.fokuszok = Array.isArray(a.fokuszok) ? a.fokuszok.slice(0, 10) : [];
  if (a.fokusz_kotelezo !== undefined) p.fokusz_kotelezo = !!a.fokusz_kotelezo;
  if (a.celertek !== undefined) p.celertek = a.celertek === '' || a.celertek === null ? '' : Number(a.celertek);
  if (a.celertek_rejtett !== undefined) p.celertek_rejtett = !!a.celertek_rejtett;
  if (a.kuszob !== undefined) p.kuszob = a.kuszob === '' || a.kuszob === null ? '' : Number(a.kuszob);
  if (a.haladas !== undefined) p.haladas = a.haladas === 'kozos' ? 'kozos' : 'egyeni';
  if (a.idoegyseg !== undefined) p.idoegyseg = String(a.idoegyseg || '').slice(0, 60);
  if (a.cimzettek !== undefined) p.cimzettek = Array.isArray(a.cimzettek) ? a.cimzettek : 'mindenki';
  if (a.modositok !== undefined) p.modositok = a.modositok && typeof a.modositok === 'object' ? a.modositok : {};
  if (a.mutatvany !== undefined) p.mutatvany = a.mutatvany && typeof a.mutatvany === 'object' ? a.mutatvany : { engedett: true };
  if (a.ellenfel !== undefined) p.ellenfel = a.ellenfel && typeof a.ellenfel === 'object' ? a.ellenfel : '';
}

// action: test.request   adat: { kampany_id, tipus, cim, tulajdonsag, fokuszok, fokusz_kotelezo, celertek,
//   celertek_rejtett, kuszob, haladas, idoegyseg, cimzettek, modositok, mutatvany, ellenfel }
function probaKerese_(a, felh) {
  const tipus = PROBA_TIPUSOK.indexOf(a.tipus) >= 0 ? a.tipus : 'alap';
  if (tipus === 'osszetett' && !(Number(a.kuszob) > 0)) throw hiba_('hianyzo_adat', 'Az összetett próbához Sikerküszöb kell.');
  return zarolva_(function () {
    const j = probaJog_(felh, a.kampany_id, tipus);
    const beall = kampanyBeallitasai_(j.kampany);
    const p = {
      id: ujId_('p'), kampany_id: j.kampany.id, letrehozva: most_(), letrehozta: felh.n, tipus: tipus,
      cim: '', tulajdonsag: '', fokuszok: [], fokusz_kotelezo: false, celertek: '',
      celertek_rejtett: beall.celertek_rejtett, kuszob: '', haladas: 'egyeni', idoegyseg: '', cimzettek: 'mindenki',
      modositok: {}, mutatvany: { engedett: true }, ellenfel: '', allas: {}, allapot: 'nyitott', lezarva: ''
    };
    probaMezok_(p, a);
    sorHozzaadasa_('jatek', 'Próbák', p);
    // a titkos próba nem jelez a játékosoknak
    const verziok = tipus === 'titkos' ? {} : kampanyVerziokNovelese_([j.kampany.id], j.k.kampanyok);
    delete p._sor;
    return { proba: p, kampany_verziok: verziok };
  });
}

// action: test.update   adat: { id, ...mezők }   action: test.close   adat: { id, ujranyit? }
function probaModositasa_(a, felh) { return probaIrasa_(a, felh, false); }
function probaLezarasa_(a, felh) { return probaIrasa_(a, felh, true); }

function probaIrasa_(a, felh, lezaras) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a próba azonosítója.');
  return zarolva_(function () {
    const p = probaSorok_().find(function (x) { return x.id === a.id; });
    if (!p) throw hiba_('nem_talalhato', 'Nincs ilyen próba.');
    const j = probaJog_(felh, p.kampany_id, p.tipus);
    if (lezaras) {
      p.allapot = a.ujranyit ? 'nyitott' : 'lezart';
      p.lezarva = a.ujranyit ? '' : most_();
    } else probaMezok_(p, a);
    sorFrissitese_('jatek', 'Próbák', p);
    const verziok = p.tipus === 'titkos' ? {} : kampanyVerziokNovelese_([j.kampany.id], j.k.kampanyok);
    delete p._sor;
    return { proba: p, kampany_verziok: verziok };
  });
}

// A kampány próbái a kérő szerepe szerint: a nyitottak és az utolsó 10 lezárt.
// A játékos nem látja a titkos próbát, a rejtett Célértéket és a nem neki szóló kérést.
function kampanyProbai_(kampany, szerep, sajatKarakterek) {
  const mind = probaSorok_().filter(function (p) { return p.kampany_id === kampany.id; });
  const nyitott = mind.filter(function (p) { return p.allapot !== 'lezart'; });
  const lezart = mind.filter(function (p) { return p.allapot === 'lezart'; }).slice(-10);
  const mindentLat = szerep === 'dm';
  return nyitott.concat(lezart).filter(function (p) {
    if (mindentLat) return true;
    if (p.tipus === 'titkos') return false;
    if (szerep === 'mester') return true;
    return p.cimzettek === 'mindenki' || !Array.isArray(p.cimzettek) ||
      p.cimzettek.some(function (id) { return sajatKarakterek.indexOf(id) >= 0; });
  }).map(function (p) {
    const o = Object.assign({}, p);
    delete o._sor;
    o.fokusz_kotelezo = igaz_rejtett_(p.fokusz_kotelezo);
    o.celertek_rejtett = igaz_rejtett_(p.celertek_rejtett);
    if (!mindentLat && o.celertek_rejtett && szerep !== 'mester') o.celertek = '';
    if (!mindentLat && o.ellenfel && typeof o.ellenfel === 'object' && szerep !== 'mester') o.ellenfel = { nev: o.ellenfel.nev || '' };
    return o;
  });
}

// ---- Kampány beállításai ----

function kampanyBeallitasai_(kampany) {
  const b = kampany.beallitasok && typeof kampany.beallitasok === 'object' ? kampany.beallitasok : {};
  const m = b.mutatvanyok && typeof b.mutatvanyok === 'object' ? b.mutatvanyok : {};
  return {
    mutatvanyok: {
      felfedezes: m.felfedezes !== false, szerepjatek: m.szerepjatek !== false,
      isteni: m.isteni === true, nyomozas: m.nyomozas === true
    },
    celertek_rejtett: b.celertek_rejtett !== false,
    dobas_reszletek_lathatok: b.dobas_reszletek_lathatok !== false
  };
}

// action: share.send (DM)
// adat: { kampany_id, cimzett: 'mindenki' | karakter_id, tipus: 'kep' | 'level' | 'szoveg', cim, hivatkozas }
function megosztasKuldese_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    if (!kampanyok.some(function (x) { return x.id === a.kampany_id; })) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const m = {
      id: ujId_('m'), kampany_id: a.kampany_id, cimzett: a.cimzett || 'mindenki', tipus: a.tipus || 'szoveg',
      cim: a.cim || '', hivatkozas: a.hivatkozas || '', idopont: most_()
    };
    sorHozzaadasa_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([a.kampany_id], kampanyok);
    return { megosztas: m };
  });
}

// ===== Szabalyok.gs =====

// Szabályadatbázis kiadása. A böngésző verziószámmal tárolja, és csak verzióváltáskor tölti le újra.

function aktualisSzabalyVerzio_() {
  const c = CacheService.getScriptCache();
  const v = c.get('szabaly_verzio');
  if (v !== null) return Number(v);
  const sor = sorok_('szabaly', 'Meta').find(function (x) { return x.kulcs === 'szabaly_verzio'; });
  const szam = sor ? Number(sor.ertek) || 1 : 1;
  c.put('szabaly_verzio', String(szam), 21600);
  return szam;
}

// action: rules.version
function szabalyVerzio_() {
  return { verzio: aktualisSzabalyVerzio_() };
}

// action: rules.get
// Válasz: { ok, verzio, lapok: { 'Fajok': [...], 'Talentumok': [...], ... } }
// Az inaktív (aktiv = hamis) elemek nem kerülnek bele.
function szabalyokLekerese_() {
  const verzio = aktualisSzabalyVerzio_();
  const kulcs = 'szabalyok_v' + verzio;
  let lapokJson = gyorsitotarOlvasas_(kulcs);
  if (lapokJson === null) {
    const lapok = {};
    SEMA.szabaly_lapok.forEach(function (nev) {
      let sorok = [];
      // az új lap az elsoBeallitas futtatásáig hiányozhat: addig üres
      try { sorok = sorok_('szabaly', nev); } catch (e) { if (!e || e.kod !== 'hianyzo_lap') throw e; }
      lapok[nev] = sorok
        .filter(function (s) { return igaz_(s.aktiv); })
        .map(function (s) { delete s._sor; return s; });
    });
    lapokJson = JSON.stringify(lapok);
    gyorsitotarIras_(kulcs, lapokJson);
  }
  return { _nyers: '{"ok":true,"verzio":' + verzio + ',"lapok":' + lapokJson + '}' };
}

// Az Apps Script szerkesztőből futtatható: a szabályadat módosítása után növeli a verziót,
// így a böngészők legközelebb újratöltik.
function szabalyVerzioNovelese() {
  const lap = lap_('szabaly', 'Meta');
  const sorok = sorok_('szabaly', 'Meta');
  const sor = sorok.find(function (x) { return x.kulcs === 'szabaly_verzio'; });
  const uj = (sor ? Number(sor.ertek) || 1 : 0) + 1;
  if (sor) cellaIrasa_('szabaly', 'Meta', sor._sor, 'ertek', uj);
  else lap.appendRow(['szabaly_verzio', uj]);
  CacheService.getScriptCache().put('szabaly_verzio', String(uj), 21600);
  Logger.log('Új szabályverzió: ' + uj);
  return uj;
}

// ===== Import.gs =====

// Szabályadat betöltése import táblázatokból.
//
// Claude az egyes adagokat „Import ...” nevű táblázatként tölti fel a FantasyAge/Import mappába.
// Az importalas() függvény minden még be nem töltött import táblázat lapjait átvezeti a
// Szabályadatbázis azonos nevű lapjaira: azonosító szerint frissít, az újakat hozzáfűzi.
// Utána a fájl nevét „Betöltve: ...” előtagra cseréli, és növeli a szabályverziót.
// Futtatható kézzel a szerkesztőből, vagy óránkénti időzítővel (importIdozitoBekapcsolasa).

const IMPORT_MAPPA = 'Import';
const BETOLTVE = 'Betöltve: ';

function importalas() {
  const p = PropertiesService.getScriptProperties();
  const mappa = mappa_(DriveApp.getFolderById(p.getProperty('MAPPA_ID')), IMPORT_MAPPA);
  const it = mappa.getFilesByType(MimeType.GOOGLE_SHEETS);
  const fajlok = [];
  while (it.hasNext()) fajlok.push(it.next());
  // név szerinti sorrendben, így egy későbbi számú adag felülírhatja a korábbit
  fajlok.sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
  const naplo = [];
  let volt = false;
  fajlok.forEach(function (f) {
    if (f.getName().indexOf(BETOLTVE) === 0 || f.getName().indexOf('Import') !== 0) return;
    const forras = SpreadsheetApp.openById(f.getId());
    forras.getSheets().forEach(function (lap) {
      const nev = lap.getName();
      if (SEMA.szabaly_lapok.indexOf(nev) < 0) { naplo.push('Kihagyva (nem szabálylap): ' + nev); return; }
      const db = lapBetoltese_(lap, nev);
      naplo.push(f.getName() + ' / ' + nev + ': ' + db.uj + ' új, ' + db.frissitett + ' frissített sor');
    });
    f.setName(BETOLTVE + f.getName());
    volt = true;
  });
  if (volt) naplo.push('Új szabályverzió: ' + szabalyVerzioNovelese());
  else naplo.push('Nincs betöltendő import táblázat.');
  Logger.log(naplo.join('\n'));
  return naplo;
}

function lapBetoltese_(forrasLap, nev) {
  const ertekek = forrasLap.getDataRange().getValues();
  if (ertekek.length < 2) return { uj: 0, frissitett: 0 };
  const forrasFej = ertekek[0].map(String);
  const cel = lap_('szabaly', nev);
  const celFej = fejlec_(cel);
  // kulcs: id, a Szótárban eredeti + megjegyzes
  const kulcs = celFej.indexOf('id') >= 0 ? function (o) { return String(o.id); }
    : function (o) { return String(o.eredeti) + '|' + String(o.megjegyzes || ''); };

  const meglevo = {};
  sorok_('szabaly', nev).forEach(function (o) { meglevo[kulcs(o)] = o._sor; });

  const ujSorok = [];
  let frissitett = 0;
  for (let i = 1; i < ertekek.length; i++) {
    if (uresSor_(ertekek[i])) continue;
    const o = {};
    forrasFej.forEach(function (f, j) { o[f] = ertekek[i][j]; });
    const sor = celFej.map(function (f) { return cellaErtek_(f, o[f] === undefined ? '' : o[f]); });
    const k = kulcs(o);
    if (meglevo[k]) {
      cel.getRange(meglevo[k], 1, 1, celFej.length).setValues([sor]);
      frissitett++;
    } else {
      ujSorok.push(sor);
    }
  }
  if (ujSorok.length) cel.getRange(cel.getLastRow() + 1, 1, ujSorok.length, celFej.length).setValues(ujSorok);
  return { uj: ujSorok.length, frissitett: frissitett };
}

// Óránkénti automatikus import bekapcsolása. Egyszer kell futtatni.
function importIdozitoBekapcsolasa() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importalas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importalas').timeBased().everyHours(1).create();
  Logger.log('Óránkénti import bekapcsolva.');
}

// ===== Beallitas.gs =====

// Első beállítás és karbantartás. Ezeket az Apps Script szerkesztőből kell futtatni.
//
// elsoBeallitas(): többször is futtatható, semmit nem ír felül.
//   - megkeresi (vagy létrehozza) a „FantasyAge” mappát és almappáit
//     (a szabálykönyvek szövege a meglévő „md” almappában van),
//   - létrehozza (vagy név szerint megkeresi) a két táblázatot, és mappába teszi őket,
//   - minden lapot és fejlécet pótol a schema szerint (új oszlopot a sor végére tesz),
//   - beállítja a token titkos kulcsát,
//   - ha még nincs felhasználó, engedélyezi a legelső belépést (aki először belép, az lesz a DM).

const MAPPA_NEV = 'FantasyAge';
const ALMAPPAK = ['md', 'Import', 'Kiosztható', 'Mentések', 'Karakterképek']; // md: a szabálykönyvek szövege, Import: szabályadat-adagok

function elsoBeallitas() {
  const p = PropertiesService.getScriptProperties();
  const naplo = [];

  if (!p.getProperty('TOKEN_TITOK')) {
    p.setProperty('TOKEN_TITOK', Utilities.getUuid() + Utilities.getUuid());
    naplo.push('Token titkos kulcs létrehozva.');
  }

  const mappa = mappa_(DriveApp.getRootFolder(), MAPPA_NEV);
  p.setProperty('MAPPA_ID', mappa.getId());
  ALMAPPAK.forEach(function (n) { mappa_(mappa, n); });
  naplo.push('Mappa: ' + mappa.getUrl());

  Object.keys(SEMA.tablazatok).forEach(function (kulcs) {
    const t = SEMA.tablazatok[kulcs];
    const kulcsNev = kulcs === 'szabaly' ? 'SZABALY_ID' : 'JATEK_ID';
    let ss = null;
    const id = p.getProperty(kulcsNev);
    if (id) {
      try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
    }
    if (!ss) {
      const talalt = DriveApp.getFilesByName(t.cim);
      while (talalt.hasNext()) {
        const f = talalt.next();
        if (f.getMimeType() === MimeType.GOOGLE_SHEETS && !f.isTrashed()) { ss = SpreadsheetApp.openById(f.getId()); break; }
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.create(t.cim);
      naplo.push('Új táblázat: ' + t.cim);
    }
    p.setProperty(kulcsNev, ss.getId());
    try { DriveApp.getFileById(ss.getId()).moveTo(mappa); } catch (e) { /* már a mappában van */ }
    lapokPotlasa_(ss, t.lapok);
    naplo.push(t.cim + ': ' + ss.getUrl());
  });

  // szabályverzió
  const meta = SpreadsheetApp.openById(p.getProperty('SZABALY_ID')).getSheetByName('Meta');
  const metaErtekek = meta.getDataRange().getValues();
  if (!metaErtekek.some(function (r) { return r[0] === 'szabaly_verzio'; })) meta.appendRow(['szabaly_verzio', 1]);

  // legelső belépés engedélyezése
  const felh = SpreadsheetApp.openById(p.getProperty('JATEK_ID')).getSheetByName('Felhasználók');
  if (felh.getLastRow() < 2) {
    p.setProperty('ELSO_BELEPES', 'igen');
    naplo.push('Még nincs felhasználó: aki először belép, az lesz a DM.');
  }

  CacheService.getScriptCache().removeAll(['szabaly_verzio', 'letiltottak'].concat(GYORSITOTARAZOTT_BEALLITASOK.map(function (k) { return 'prop_' + k; })));
  naplo.push('Kész.');
  Logger.log(naplo.join('\n'));
  return naplo;
}

function mappa_(szulo, nev) {
  const it = szulo.getFoldersByName(nev);
  return it.hasNext() ? it.next() : szulo.createFolder(nev);
}

function lapokPotlasa_(ss, lapok) {
  Object.keys(lapok).forEach(function (nev) {
    const oszlopok = lapok[nev];
    let l = ss.getSheetByName(nev);
    if (!l) l = ss.insertSheet(nev);
    const meglevo = l.getLastColumn() > 0 ? l.getRange(1, 1, 1, l.getLastColumn()).getValues()[0].map(String) : [];
    if (meglevo.filter(Boolean).length === 0) {
      l.getRange(1, 1, 1, oszlopok.length).setValues([oszlopok]);
    } else {
      const hianyzo = oszlopok.filter(function (o) { return meglevo.indexOf(o) < 0; });
      if (hianyzo.length) l.getRange(1, meglevo.length + 1, 1, hianyzo.length).setValues([hianyzo]);
    }
    l.getRange(1, 1, 1, l.getLastColumn()).setFontWeight('bold');
    l.setFrozenRows(1);
  });
  // az új táblázat alapértelmezett, üres lapjának törlése
  ss.getSheets().forEach(function (l) {
    if (!lapok[l.getName()] && l.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(l);
  });
}

// Másolat a Játékadat táblázatról a Mentések mappába. Kézzel vagy időzítve futtatható.
function mentesKeszitese() {
  const p = PropertiesService.getScriptProperties();
  const mentesek = mappa_(DriveApp.getFolderById(p.getProperty('MAPPA_ID')), 'Mentések');
  const datum = Utilities.formatDate(new Date(), 'Europe/Budapest', 'yyyy-MM-dd HH.mm');
  const masolat = DriveApp.getFileById(p.getProperty('JATEK_ID')).makeCopy('Játékadat mentés ' + datum, mentesek);
  Logger.log('Mentés kész: ' + masolat.getUrl());
}

// Napi automatikus mentés bekapcsolása (hajnali 4 órakor). Egyszer kell futtatni.
function napiMentesBekapcsolasa() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'mentesKeszitese') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('mentesKeszitese').timeBased().everyDays(1).atHour(4).create();
  Logger.log('Napi mentés bekapcsolva.');
}
