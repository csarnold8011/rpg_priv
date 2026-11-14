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
          "letrehozva"
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
          "rejtett"
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
    "Szótár",
    "Házi szabályok"
  ],
  "json_oszlopok": [
    "reszletek",
    "adat",
    "aktiv_forrasok",
    "kockak"
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
    'character.delete':        { fn: karakterTorlese_, szerep: 'dm' },
    'campaigns.list':          { fn: kampanyLista_ },
    'campaign.create':         { fn: kampanyLetrehozasa_, szerep: 'dm' },
    'campaign.update':         { fn: kampanyModositasa_, szerep: 'dm' },
    'campaign.delete':         { fn: kampanyTorlese_, szerep: 'dm' },
    'campaign.addCharacter':   { fn: kampanyhozRendeles_, szerep: 'dm' },
    'campaign.removeCharacter':{ fn: kampanybolKivetel_, szerep: 'dm' },
    'roll.log':                { fn: dobasNaplozasa_ },
    'share.send':              { fn: megosztasKuldese_, szerep: 'dm' }
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
    irhato: felh ? karakterIrhato_(felh, kar, k) : false,
    // a karakterkészítés állapota a listák „Piszkozat” címkéjéhez (piszkozat | kesz | atvett)
    keszites: kar.adat && typeof kar.adat === 'object' && kar.adat.keszites ? (kar.adat.keszites.allapot || '') : ''
  };
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

// action: character.create   adat: { nev, adat?, jatekos_id?, kampany_id? }
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
      verzio: 1, modositva: most_(), modositotta: felh.n, aktiv: true };
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

// action: character.save   adat: { id, verzio, adat, aktiv? }
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
    valtozasNaplozasa_(felh, 'karakter.torol', kar.id, kar.verzio, '');
    return { torolve: kar.id };
  });
}

// ===== Kampanyok.gs =====

// Kampányok, karakterek kampányhoz rendelése, és a kampány élő állapota (state.get).

const DOBASNAPLO_HOSSZ = 100;

function kampanyNezet_(kampany, szerep) {
  const o = {
    id: kampany.id, cim: kampany.cim, mesterjatekos_id: kampany.mesterjatekos_id || '',
    aktiv_forrasok: Array.isArray(kampany.aktiv_forrasok) ? kampany.aktiv_forrasok : [],
    allapot: kampany.allapot, verzio: Number(kampany.verzio) || 0, sajat_szerep: szerep
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
// a dobásnapló és a megosztások sorai is maradnak.
function kampanyTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.id, k);
    if (kampany.allapot !== ARCHIVALT) throw hiba_('hibas_adat', 'Csak archivált kampány törölhető. Előbb archiváld.');
    const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; });
    sorokTorlese_('jatek', 'Kampánykarakterek', kapcsolatok.map(function (x) { return x._sor; }));
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

// action: campaign.update (DM)   adat: { id, cim?, aktiv_forrasok?, mesterjatekos_id?, allapot?, dm_jegyzet? }
function kampanyModositasa_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    const kampany = kampanyok.find(function (x) { return x.id === a.id; });
    if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    ['cim', 'aktiv_forrasok', 'mesterjatekos_id', 'allapot', 'dm_jegyzet'].forEach(function (m) {
      if (a[m] !== undefined) kampany[m] = a[m];
    });
    sorFrissitese_('jatek', 'Kampányok', kampany);
    kampanyVerziokNovelese_([kampany.id], kampanyok);
    valtozasNaplozasa_(felh, 'kampany.modosit', kampany.id, '', kampany.verzio);
    return { kampany: kampanyNezet_(kampany, 'dm') };
  });
}

// action: campaign.addCharacter (DM)   adat: { kampany_id, karakter_id, allapot? }
// allapot: aktív, távol, kilépett, elhunyt. Ha a karakter már a kampányban van, csak az állapota változik.
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
    kampanyVerziokNovelese_([a.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'kampany.karakter:' + allapot, a.karakter_id, '', a.kampany_id);
    return {};
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
      id: kar.id, nev: kar.nev, faj: kar.faj, osztaly: kar.osztaly, szint: kar.szint, irhato: false
    };
    o.kampany_allapot = x.allapot;
    return o;
  }).filter(Boolean);

  const sajatKarakterek = karakterek.filter(function (c) { return c.irhato; }).map(function (c) { return c.id; });

  const dobasok = utolsoSorok_('jatek', 'Dobásnapló', DOBASNAPLO_HOSSZ * 3)
    .filter(function (d) { return d.kampany_id === kampany.id; })
    .filter(function (d) { return szerep === 'dm' || !igaz_rejtett_(d.rejtett); })
    .slice(-DOBASNAPLO_HOSSZ)
    .map(function (d) { delete d._sor; d.rejtett = igaz_rejtett_(d.rejtett); return d; });

  const megosztasok = sorok_('jatek', 'Megosztások')
    .filter(function (m) { return m.kampany_id === kampany.id; })
    .filter(function (m) { return mindentLat || m.cimzett === 'mindenki' || sajatKarakterek.indexOf(m.cimzett) >= 0; })
    .map(function (m) { delete m._sor; return m; });

  return {
    verzio: Number(kampany.verzio) || 0,
    kampany: kampanyNezet_(kampany, szerep),
    karakterek: karakterek,
    dobasok: dobasok,
    megosztasok: megosztasok
  };
}

// A rejtett mező üresen hamis (szemben az aktiv mezővel, ami üresen igaz).
function igaz_rejtett_(x) {
  return x === true || ['true', 'igen', '1'].indexOf(String(x).toLowerCase()) >= 0;
}

// ===== Dobasok.gs =====

// Dobásnapló és megosztások. A kocka a böngészőben gurul, ide csak az eredmény érkezik.

// action: roll.log
// adat: { kampany_id, karakter_id?, mire, kockak: [k1, k2, sarkanykocka], modosito, celertek?, eredmeny?, mutatvanypont?, rejtett? }
function dobasNaplozasa_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  if (!Array.isArray(a.kockak) || a.kockak.length < 1) throw hiba_('hianyzo_adat', 'Hiányoznak a kockák.');
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    // kiesés utáni újraküldésnél ne kerüljön be kétszer ugyanaz a dobás
    if (a.id) {
      const megvan = utolsoSorok_('jatek', 'Dobásnapló', 200).find(function (d) { return d.id === a.id; });
      if (megvan) { delete megvan._sor; return { dobas: megvan, kampany_verziok: {} }; }
    }
    const dobas = {
      id: a.id || ujId_('d'), idopont: most_(), kampany_id: kampany.id, karakter_id: a.karakter_id || '',
      dobta: felh.n, mire: a.mire || '', kockak: a.kockak, modosito: Number(a.modosito) || 0,
      celertek: a.celertek === undefined ? '' : a.celertek, eredmeny: a.eredmeny || '',
      mutatvanypont: Number(a.mutatvanypont) || 0,
      rejtett: szerep === 'dm' && !!a.rejtett // rejtett dobás csak a DM-é lehet
    };
    sorHozzaadasa_('jatek', 'Dobásnapló', dobas);
    // a rejtett dobás nem jelez változást a játékosoknak
    const verziok = dobas.rejtett ? {} : kampanyVerziokNovelese_([kampany.id], k.kampanyok);
    return { dobas: dobas, kampany_verziok: verziok };
  });
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
      lapok[nev] = sorok_('szabaly', nev)
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
const ALMAPPAK = ['md', 'Import', 'Kiosztható', 'Mentések']; // md: a szabálykönyvek szövege, Import: szabályadat-adagok

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
