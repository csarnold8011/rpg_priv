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
        "Dobótáblák": [
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
          "aktiv",
          "vilag_id",
          "alap_id"
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
          "beallitasok",
          "keret",
          "latta"
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
          "idopont",
          "cimzettek",
          "adat",
          "alany_id",
          "allapot",
          "latta",
          "megmutat",
          "letrehozta",
          "verzio"
        ],
        "Világok": [
          "id",
          "nev",
          "adat",
          "verzio",
          "modositva",
          "modositotta",
          "aktiv"
        ],
        "Elemek": [
          "id",
          "tipus",
          "nev",
          "vilag_id",
          "kampany_id",
          "alap_id",
          "szulo_id",
          "sorrend",
          "adat",
          "verzio",
          "modositva",
          "modositotta",
          "aktiv"
        ],
        "Kapcsolatok": [
          "id",
          "honnan",
          "hova",
          "tipus",
          "megjegyzes",
          "vilag_id",
          "kampany_id",
          "aktiv"
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
    "Dobótáblák",
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
    "pillanatkepek",
    "keret",
    "latta"
  ]
};

// ===== Csatamotor.gs =====

// GENERÁLT FÁJL. Ne szerkeszd kézzel: a web/js/jatek/osszecsapas.js, csata.js és csatamuvelet.js
// a forrás, ebből a python3 tools/csatamotor_general.py készíti. A háttér a CsataMotor_ objektumot használja.

// ----- web/js/jatek/osszecsapas.js -----
const _m_osszecsapas = (function () {
// Összecsapás-építő és oldalak (3. lépés, 3. ütem). Tiszta függvények, böngészőben és Node-ban is futnak.
// Teszt: node tools/teszt/osszecsapas.mjs. Terv: claude/csata-terv.md („Összecsapás-építő”, „Oldalak és viszonyok”).
//
// Egy előkészített összecsapás (az Összecsapások lap `adat` mezője):
//   { leiras, helyszin, terep, megjegyzes,
//     oldalak: [{ id, nev }],
//     viszonyok: { 'o_a|o_b': 'ellenseges' | 'semleges' | 'szovetseges' }   (a kulcs a két azonosító ábécérendben)
//     csoportok: [{ id, nev }]                                            (kezdeményezési csoportok, AK 100.)
//     resztvevok: [{ id, forras: { tipus: szorny | njk | karakter, id }, nev, db, oldal, csoport, fontos, rejtett, megjegyzes }] }
// A szörny darabszámmal szerepel (db), a csata indításakor bomlik példányokra (resztvevokKibontasa).
// Csatában nincs „jók és rosszak”: oldalak vannak, a viszonyuk csak a felület segítsége (sorrend, figyelmeztetés).
const FENYEGETESEK = [];
const fenyegetesSorszam = function () { return -1; };
const VISZONYOK = {
  ellenseges: { nev: 'ellenséges', sorrend: 0 },
  semleges: { nev: 'semleges', sorrend: 1 },
  szovetseges: { nev: 'szövetséges', sorrend: 2 },
  sajat: { nev: 'saját oldal', sorrend: 3 }
};
const CSAPAT = 'o_csapat';
const ELLENFELEK = 'o_ellen';
const TIPUS_NEV = { szorny: 'Bestiárium', njk: 'NJK', karakter: 'Karakter' };
// Az erősítés nagyjából egy fenyegetési fokkal emeli a lényt (C 104.: az elit egy fokkal erősebb).
const EROSITES_FOK = { nincs: 0, elit: 1, hosi: 2, epikus: 3 };
// XP az összecsapás nehézsége szerint (AK 117–118.), a csata lezárásakor javaslatként.
const NEHEZSEGEK = {
  'Könnyű': { xp: 100, tonus: undefined },
  'Átlagos': { xp: 250, tonus: 'accent' },
  'Nehéz': { xp: 400, tonus: 'warning' },
  'Nagyon nehéz': { xp: 400, tonus: 'danger' }
};
const MAX_DB = 30;
// Más oldal Egészsége a játékosoknak (kampánybeállítás: csata_egeszseg).
const EGESZSEG_LATHATOSAG = {
  pontos: 'Pontos érték',
  leiro: 'Leíró (ép, sérült, súlyosan sérült, földön)',
  rejtett: 'Rejtett'
};

let szamlalo = 0;
function ujAzon(elotag) {
  szamlalo = (szamlalo + 1) % 1000;
  return `${elotag}_${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 6)}${szamlalo}`;
}
const egesz = (x, alap) => (Number.isFinite(Number(x)) && x !== '' && x !== null ? Math.round(Number(x)) : alap);
const masol = (x) => JSON.parse(JSON.stringify(x));
const viszonyKulcs = (a, b) => [a, b].sort().join('|');

// ---------------- Létrehozás, betöltés ----------------

function uresOsszecsapas() {
  return {
    leiras: '', helyszin: '', terep: '', megjegyzes: '',
    oldalak: [{ id: CSAPAT, nev: 'Csapat' }, { id: ELLENFELEK, nev: 'Ellenfelek' }],
    viszonyok: { [viszonyKulcs(CSAPAT, ELLENFELEK)]: 'ellenseges' },
    csoportok: [],
    resztvevok: []
  };
}

// A tárolt (esetleg hiányos vagy régi) adatból teljes szerkezet. Semmit nem dob el, ami értelmes.
function normalizal(adat) {
  const a = adat && typeof adat === 'object' ? masol(adat) : {};
  const o = uresOsszecsapas();
  ['leiras', 'helyszin', 'terep', 'megjegyzes'].forEach((k) => { o[k] = typeof a[k] === 'string' ? a[k] : ''; });
  if (Array.isArray(a.oldalak) && a.oldalak.length) {
    o.oldalak = a.oldalak.filter((x) => x && x.id).map((x) => ({ id: String(x.id), nev: String(x.nev || 'Oldal') }));
  }
  if (!o.oldalak.length) o.oldalak = uresOsszecsapas().oldalak;
  o.viszonyok = a.viszonyok && typeof a.viszonyok === 'object' ? { ...a.viszonyok } : o.viszonyok;
  o.csoportok = Array.isArray(a.csoportok) ? a.csoportok.filter((x) => x && x.id).map((x) => ({ id: String(x.id), nev: String(x.nev || 'Csoport') })) : [];
  const oldalIdk = new Set(o.oldalak.map((x) => x.id));
  const csoportIdk = new Set(o.csoportok.map((x) => x.id));
  o.resztvevok = (Array.isArray(a.resztvevok) ? a.resztvevok : []).filter((r) => r && r.forras && r.forras.tipus).map((r) => ({
    id: String(r.id || ujAzon('r')),
    forras: { tipus: r.forras.tipus, id: String(r.forras.id || '') },
    nev: String(r.nev || ''),
    db: r.forras.tipus === 'szorny' ? Math.min(MAX_DB, Math.max(1, egesz(r.db, 1))) : 1,
    oldal: oldalIdk.has(r.oldal) ? r.oldal : o.oldalak[0].id,
    csoport: csoportIdk.has(r.csoport) ? r.csoport : '',
    fontos: !!r.fontos,
    rejtett: !!r.rejtett,
    megjegyzes: typeof r.megjegyzes === 'string' ? r.megjegyzes : ''
  }));
  return o;
}

// ---------------- Oldalak és viszonyok ----------------

function viszony(o, a, b) {
  if (!a || !b) return 'semleges';
  if (a === b) return 'sajat';
  const v = o && o.viszonyok && o.viszonyok[viszonyKulcs(a, b)];
  return VISZONYOK[v] && v !== 'sajat' ? v : 'semleges';
}

function oldalHozzaadas(o, nev, alapViszony = 'semleges') {
  const uj = masol(o);
  const id = ujAzon('o');
  uj.oldalak.push({ id, nev: String(nev || '').trim() || `${uj.oldalak.length + 1}. oldal` });
  uj.oldalak.forEach((x) => { if (x.id !== id) uj.viszonyok[viszonyKulcs(x.id, id)] = alapViszony; });
  return uj;
}

function oldalAtnevezes(o, id, nev) {
  const uj = masol(o);
  const x = uj.oldalak.find((y) => y.id === id);
  if (x) x.nev = String(nev || '').slice(0, 60);
  return uj;
}

function viszonyBeallitas(o, a, b, v) {
  if (a === b || !VISZONYOK[v] || v === 'sajat') return o;
  const uj = masol(o);
  uj.viszonyok[viszonyKulcs(a, b)] = v;
  return uj;
}

// Oldal törlése: a résztvevői az „ide” oldalra kerülnek (alapból az első megmaradó oldalra). Az utolsó oldal nem törölhető.
function oldalTorles(o, id, ide) {
  if (o.oldalak.length <= 1 || !o.oldalak.some((x) => x.id === id)) return o;
  const uj = masol(o);
  uj.oldalak = uj.oldalak.filter((x) => x.id !== id);
  const cel = uj.oldalak.some((x) => x.id === ide) ? ide : uj.oldalak[0].id;
  uj.resztvevok.forEach((r) => { if (r.oldal === id) r.oldal = cel; });
  Object.keys(uj.viszonyok).forEach((k) => { if (k.split('|').includes(id)) delete uj.viszonyok[k]; });
  return uj;
}

// ---------------- Kezdeményezési csoportok ----------------

function csoportHozzaadas(o, nev) {
  const uj = masol(o);
  const id = ujAzon('g');
  uj.csoportok.push({ id, nev: String(nev || '').trim() || `${uj.csoportok.length + 1}. csoport` });
  return { o: uj, id };
}

function csoportAtnevezes(o, id, nev) {
  const uj = masol(o);
  const g = uj.csoportok.find((x) => x.id === id);
  if (g) g.nev = String(nev || '').slice(0, 60);
  return uj;
}

function csoportTorles(o, id) {
  const uj = masol(o);
  uj.csoportok = uj.csoportok.filter((x) => x.id !== id);
  uj.resztvevok.forEach((r) => { if (r.csoport === id) r.csoport = ''; });
  return uj;
}

// A csoport tagjai (résztvevő-sorok); a kezdeményezést a csoport egyszerre dobja.
const csoportTagjai = (o, id) => o.resztvevok.filter((r) => r.csoport === id);

// ---------------- Résztvevők ----------------

// elem: { tipus, id, nev, db? }. opciok: { oldal, csoportba (db > 1-nél alapból igen), fontos, rejtett }.
// A több példányos szörny alapból saját kezdeményezési csoportot kap (a kis NJK-k csoportban, AK 100.).
function resztvevoHozzaadas(o, elem, opciok = {}) {
  let uj = masol(o);
  const tipus = elem.tipus;
  const db = tipus === 'szorny' ? Math.min(MAX_DB, Math.max(1, egesz(elem.db, 1))) : 1;
  const alapOldal = tipus === 'karakter' ? CSAPAT : ELLENFELEK;
  const oldal = uj.oldalak.some((x) => x.id === opciok.oldal) ? opciok.oldal
    : (uj.oldalak.some((x) => x.id === alapOldal) ? alapOldal : uj.oldalak[uj.oldalak.length - 1].id);
  let csoport = '';
  if (opciok.csoport && uj.csoportok.some((g) => g.id === opciok.csoport)) csoport = opciok.csoport;
  else if (db > 1 && opciok.csoportba !== false) {
    const r = csoportHozzaadas(uj, elem.nev);
    uj = r.o;
    csoport = r.id;
  }
  const r = {
    id: ujAzon('r'), forras: { tipus, id: String(elem.id || '') }, nev: String(elem.nev || ''), db, oldal, csoport,
    fontos: opciok.fontos !== undefined ? !!opciok.fontos : tipus !== 'szorny',
    rejtett: !!opciok.rejtett, megjegyzes: ''
  };
  uj.resztvevok.push(r);
  return { o: uj, id: r.id };
}

function resztvevoModositas(o, id, valtozas) {
  const uj = masol(o);
  const r = uj.resztvevok.find((x) => x.id === id);
  if (!r) return o;
  const v = { ...valtozas };
  if (v.db !== undefined) v.db = r.forras.tipus === 'szorny' ? Math.min(MAX_DB, Math.max(1, egesz(v.db, r.db))) : 1;
  if (v.oldal !== undefined && !uj.oldalak.some((x) => x.id === v.oldal)) delete v.oldal;
  if (v.csoport !== undefined && v.csoport !== '' && !uj.csoportok.some((x) => x.id === v.csoport)) delete v.csoport;
  ['fontos', 'rejtett'].forEach((k) => { if (v[k] !== undefined) v[k] = !!v[k]; });
  delete v.id; delete v.forras;
  Object.assign(r, v);
  return uj;
}

// Résztvevő törlése; a kiürült, csak érte létrejött csoport is megszűnik.
function resztvevoTorles(o, id) {
  const uj = masol(o);
  const r = uj.resztvevok.find((x) => x.id === id);
  if (!r) return o;
  uj.resztvevok = uj.resztvevok.filter((x) => x.id !== id);
  if (r.csoport && !uj.resztvevok.some((x) => x.csoport === r.csoport)) uj.csoportok = uj.csoportok.filter((g) => g.id !== r.csoport);
  return uj;
}

// A kampány karakterei a Csapat oldalra (aki már benne van, nem kerül be még egyszer). karakterek: [{ id, nev }].
function csapatHozzaadas(o, karakterek, oldal = CSAPAT) {
  let uj = o;
  const bent = new Set(o.resztvevok.filter((r) => r.forras.tipus === 'karakter').map((r) => r.forras.id));
  (karakterek || []).forEach((c) => {
    if (bent.has(c.id)) return;
    uj = resztvevoHozzaadas(uj, { tipus: 'karakter', id: c.id, nev: c.nev }, { oldal }).o;
  });
  return uj;
}

// Másolat az összecsapásról (új azonosítókkal a résztvevőknek, a csoportok és oldalak megmaradnak).
function osszecsapasMasolat(o) {
  const uj = normalizal(o);
  uj.resztvevok.forEach((r) => { r.id = ujAzon('r'); });
  return uj;
}

// ---------------- Áttekintés és ellenőrzés ----------------

function osszegzes(o) {
  const oldalak = o.oldalak.map((x) => {
    const tagok = o.resztvevok.filter((r) => r.oldal === x.id);
    return { id: x.id, nev: x.nev, db: tagok.reduce((a, r) => a + r.db, 0), rejtett: tagok.filter((r) => r.rejtett).reduce((a, r) => a + r.db, 0) };
  });
  return { oldalak, osszes: oldalak.reduce((a, x) => a + x.db, 0) };
}

// Figyelmeztetések (semmit nem tilt). Visszaad: [szöveg].
function ellenorzes(o) {
  const f = [];
  if (!o.resztvevok.length) { f.push('Még nincs résztvevő.'); return f; }
  const lakott = o.oldalak.filter((x) => o.resztvevok.some((r) => r.oldal === x.id));
  if (lakott.length < 2) f.push('Csak egy oldalon vannak résztvevők, így nincs kivel összecsapni.');
  else if (!lakott.some((a) => lakott.some((b) => a.id !== b.id && viszony(o, a.id, b.id) === 'ellenseges'))) {
    f.push('A résztvevők oldalai közt nincs ellenséges viszony.');
  }
  if (o.resztvevok.every((r) => r.rejtett)) f.push('Minden résztvevő rejtett: induláskor senki nem lesz a kezdeményezési sorban.');
  const lattam = {};
  o.resztvevok.forEach((r) => {
    if (r.forras.tipus === 'szorny') return;
    const k = r.forras.tipus + ':' + r.forras.id;
    if (lattam[k]) f.push(`${r.nev || 'Egy résztvevő'} kétszer szerepel.`);
    lattam[k] = true;
  });
  o.oldalak.forEach((x) => { if (!String(x.nev || '').trim()) f.push('Van név nélküli oldal.'); });
  return f;
}

// ---------------- Nehézség (tájékoztató, AK 105.) ----------------

// A szint fenyegetési sávja (0: Csekély … 4: Legendás).
function szintSav(szint) {
  const s = Math.max(1, Math.min(20, egesz(szint, 1)));
  const i = FENYEGETESEK.findIndex((f) => s >= f.szint[0] && s <= f.szint[1]);
  return i < 0 ? 0 : i;
}

// Egy résztvevő hatékony fenyegetési foka. info: { fenyegetes, erosites (fok), szint } a forrásból.
function resztvevoFok(r, info) {
  if (!info) return null;
  if (r.forras.tipus === 'karakter') return info.szint ? szintSav(info.szint) : null;
  const alap = fenyegetesSorszam(info.fenyegetes);
  if (alap < 0) return null;
  return Math.min(FENYEGETESEK.length - 1 + 2, alap + (EROSITES_FOK[info.erosites] || 0));
}

// A résztvevő adatai a nehézséghez és a listához a környezetből.
// kornyezet: { szornyek: [Szörnyek lap sorai], njkk: [NJK-k (összefoglaló vagy teljes)], karakterek: [{ id, nev, szint }] }
function resztvevoInfo(r, kornyezet = {}) {
  const t = r.forras.tipus;
  if (t === 'szorny') {
    const s = (kornyezet.szornyek || []).find((x) => x.id === r.forras.id);
    return s ? { fenyegetes: s.fenyegetes || '', erosites: 'nincs', nev: s.nev_hu } : null;
  }
  if (t === 'njk') {
    const n = (kornyezet.njkk || []).find((x) => x.id === r.forras.id);
    if (!n) return null;
    const adat = typeof n.adat === 'string' ? (() => { try { return JSON.parse(n.adat); } catch (e) { return {}; } })() : (n.adat || {});
    return { fenyegetes: n.fenyegetes || '', erosites: (adat.erosites && adat.erosites.fok) || n.erosites || 'nincs', nev: n.nev, fajta: n.fajta };
  }
  const c = (kornyezet.karakterek || []).find((x) => x.id === r.forras.id);
  return c ? { szint: egesz(c.szint, 1), nev: c.nev } : null;
}

// Melyik oldal „a csapat”: a Csapat oldal, ha van rajta karakter, különben ahol a legtöbb karakter áll.
function csapatOldala(o) {
  const karakteres = (id) => o.resztvevok.filter((r) => r.oldal === id && r.forras.tipus === 'karakter').length;
  if (o.oldalak.some((x) => x.id === CSAPAT) && karakteres(CSAPAT)) return CSAPAT;
  const legtobb = o.oldalak.map((x) => [x.id, karakteres(x.id)]).sort((a, b) => b[1] - a[1])[0];
  return legtobb && legtobb[1] ? legtobb[0] : (o.oldalak.some((x) => x.id === CSAPAT) ? CSAPAT : o.oldalak[0].id);
}

// Tájékoztató nehézség a fenyegetési szintek és a csapat szintje alapján, kötelezés nélkül.
// kornyezet: mint a resztvevoInfo-nál, és csapat: [{ id, szint }] (a kampány aktív karakterei, ha az összecsapásban nincs karakter).
// Visszaad: null (nincs ellenfél), vagy { becsles, xp, csapat: { szint, letszam, kampanybol }, ellenfelek: [...], megjegyzesek: [] }.
function nehezsegBecsles(o, kornyezet = {}) {
  const csapatId = csapatOldala(o);
  const megjegyzesek = [];
  let tagok = o.resztvevok.filter((r) => r.oldal === csapatId && r.forras.tipus === 'karakter')
    .map((r) => resztvevoInfo(r, kornyezet)).filter((x) => x && x.szint);
  let kampanybol = false;
  if (!tagok.length && (kornyezet.csapat || []).length) {
    tagok = kornyezet.csapat.map((c) => ({ szint: egesz(c.szint, 1) }));
    kampanybol = true;
    megjegyzesek.push('A csapat a kampány aktív karakterei alapján (az összecsapásban még nincs karakter).');
  }
  const ellenfelek = o.resztvevok.filter((r) => viszony(o, csapatId, r.oldal) === 'ellenseges').map((r) => {
    const info = resztvevoInfo(r, kornyezet);
    return { id: r.id, nev: r.nev || (info && info.nev) || '', db: r.db, rejtett: r.rejtett, tipus: r.forras.tipus,
      fenyegetes: info ? (info.fenyegetes || (info.szint ? `${info.szint}. szint` : '')) : '', erosites: info && info.erosites !== 'nincs' ? info.erosites : '',
      fok: resztvevoFok(r, info) };
  });
  if (!ellenfelek.length) return null;
  if (!tagok.length) {
    return { becsles: null, xp: null, csapat: { szint: null, letszam: 0, kampanybol }, ellenfelek,
      megjegyzesek: ['A csapat szintje nem ismert: tegyél karaktert a Csapat oldalra.'] };
  }
  const szint = Math.round(tagok.reduce((a, t) => a + t.szint, 0) / tagok.length);
  const sav = szintSav(szint);
  const ismert = ellenfelek.filter((e) => e.fok !== null);
  if (ismert.length < ellenfelek.length) megjegyzesek.push('Van ellenfél fenyegetési szint nélkül, ezt a becslés nem számolja.');
  ellenfelek.forEach((e) => { e.elteres = e.fok === null ? null : e.fok - sav; });
  let becsles = null;
  if (ismert.length) {
    const max = Math.max(...ismert.map((e) => e.elteres));
    const db = ismert.reduce((a, e) => a + e.db, 0);
    const letszam = tagok.length;
    if (max >= 2) becsles = 'Nagyon nehéz';
    else if (max === 1) becsles = db >= 2 * letszam ? 'Nagyon nehéz' : 'Nehéz';
    else if (max === 0) becsles = db >= 2 * letszam ? 'Nehéz' : 'Átlagos';
    else if (max === -1) becsles = db >= 2 * letszam ? 'Átlagos' : 'Könnyű';
    else becsles = db >= 3 * letszam ? 'Átlagos' : 'Könnyű';
    if (ismert.some((e) => e.rejtett)) megjegyzesek.push('A rejtett (később belépő) ellenfelek is beleszámítanak.');
  }
  return { becsles, xp: becsles ? NEHEZSEGEK[becsles].xp : null, csapat: { szint, letszam: tagok.length, kampanybol }, ellenfelek, megjegyzesek };
}

// ---------------- Indítás: példányok ----------------

// A résztvevők csatapéldányai: a többpéldányos szörny „Farkas 1”, „Farkas 2” stb. néven, ugyanabban a csoportban.
// Visszaad: [{ id, resztvevo_id, forras, nev, oldal, csoport, fontos, rejtett }].
function resztvevokKibontasa(o) {
  const ki = [];
  o.resztvevok.forEach((r) => {
    for (let i = 1; i <= r.db; i++) {
      ki.push({ id: r.db > 1 ? `${r.id}_${i}` : r.id, resztvevo_id: r.id, forras: { ...r.forras },
        nev: r.db > 1 ? `${r.nev} ${i}` : r.nev, oldal: r.oldal, csoport: r.csoport, fontos: r.fontos, rejtett: r.rejtett });
    }
  });
  return ki;
}

// ---------------- Célpontok és láthatóság (a csatában is ezek dolgoznak) ----------------

// A célpontválasztó sorrendje: ellenséges, semleges, szövetséges, saját oldal; azon belül név szerint.
// resztvevok: [{ id, nev, oldal, ... }]. Mindenki választható, a viszony csak sorrend és jelzés.
function celpontSorrend(o, resztvevok, sajatOldal, sajatId) {
  return (resztvevok || []).filter((r) => r.id !== sajatId).map((r) => ({ ...r, viszony: viszony(o, sajatOldal, r.oldal) }))
    .sort((a, b) => VISZONYOK[a.viszony].sorrend - VISZONYOK[b.viszony].sorrend || String(a.nev).localeCompare(String(b.nev), 'hu'));
}

// Figyelmeztetés, ha a támadás célpontja nem ellenséges oldalon áll (semmit nem tilt).
function celpontFigyelmeztetes(o, tamadoOldal, celOldal) {
  const v = viszony(o, tamadoOldal, celOldal);
  if (v === 'sajat') return 'A célpont a saját oldaladon áll.';
  if (v === 'szovetseges') return 'A célpont szövetséges oldalon áll.';
  return null;
}

// Mennyit lát a néző egy résztvevő Egészségéből: 'pontos', 'leiro' vagy 'rejtett'.
// A DM mindent pontosan lát, a saját oldal (bármelyik oldal, ahol a nézőnek karaktere van) is pontos.
function egeszsegLathatosag(beallitas, { dm, nezoOldalak = [], celOldal } = {}) {
  if (dm || nezoOldalak.includes(celOldal)) return 'pontos';
  const b = beallitas && beallitas.csata_egeszseg;
  return EGESZSEG_LATHATOSAG[b] ? b : 'leiro';
}

// Leíró Egészség: ép, sérült (legalább a fele megvan), súlyosan sérült, földön.
function leiroEgeszseg(egeszseg, max) {
  const e = Number(egeszseg) || 0;
  const m = Math.max(1, Number(max) || 1);
  if (e <= 0) return 'földön';
  if (e >= m) return 'ép';
  if (e * 2 >= m) return 'sérült';
  return 'súlyosan sérült';
}

// Az Egészség megjelenítése a láthatóság szerint.
function egeszsegSzoveg(egeszseg, max, lathatosag) {
  if (lathatosag === 'pontos') return `${egeszseg}/${max}`;
  if (lathatosag === 'rejtett') return '?';
  return leiroEgeszseg(egeszseg, max);
}

return { VISZONYOK, CSAPAT, ELLENFELEK, TIPUS_NEV, NEHEZSEGEK, MAX_DB, EGESZSEG_LATHATOSAG, ujAzon, viszonyKulcs, uresOsszecsapas, normalizal, viszony, oldalHozzaadas, oldalAtnevezes, viszonyBeallitas, oldalTorles, csoportHozzaadas, csoportAtnevezes, csoportTorles, csoportTagjai, resztvevoHozzaadas, resztvevoModositas, resztvevoTorles, csapatHozzaadas, osszecsapasMasolat, osszegzes, ellenorzes, szintSav, resztvevoFok, resztvevoInfo, csapatOldala, nehezsegBecsles, resztvevokKibontasa, celpontSorrend, celpontFigyelmeztetes, egeszsegLathatosag, leiroEgeszseg, egeszsegSzoveg };
})();

// ----- web/js/jatek/csata.js -----
const _m_csata = (function () {
// Csatamotor (3. lépés, 4. ütem): a csata állapota és minden lépése tiszta függvényként.
// Böngészőben és Node-ban is fut. Teszt: node tools/teszt/csata.mjs. Terv: claude/csata-terv.md
// („Csataállapot”, „A csata menete”). Szabályok: AK 33–37., 100–101.
//
// A csata állapota (a Csaták lap `adat` mezője):
//   { v, allapot: 'kezdemenyezes' | 'fut' | 'lezart', kor, soron, sorrend: [id], leptek: [id],
//     oldalak, viszonyok, csoportok, resztvevok: [résztvevő], naplo: [{ kor, szoveg }],
//     visszavonas: [lépés], kulcsok: [a már feldolgozott lépések kulcsai] }
// Egy résztvevő:
//   { id, resztvevo_id, forras: { tipus: karakter | njk | szorny, id }, nev, oldal, csoport, fontos, rejtett, meglepett,
//     kezdemenyezes: null | { osszeg, sarkany, tul, kockak, kezi }, egeszseg, egeszseg_max, szivossag,
//     allapot: 'aktiv' | 'haldoklik' | 'kiesett' | 'halott', haldoklas_kor,
//     feltetelek: [{ id, kulcs, nev, lejar_kor, lejar?, forras?, elkezdve? }], hatasok: [{ id, nev, cel, ertek, lejar, kor, fogy?, elkezdve? }],
// A `lejar: 'sajat_kor_vege'` feltétel vagy hatás a gazdája következő körének végén jár le (Megfélemlítve, Gúnyolva,
// Éberség); a `fogy` hatás (cel: 'proba') a következő próbánál elfogy.
//     cselekves: { fo, mellek, plusz, lista }, gyogyithato,
//     magiapont: null | szám, ertekek: { vedekezes, pancelertek, atuto_ellen, magiapont_max, akaratero } }
// Az `ertekek` a lény nézetének csatához kellő része (a DM és a játékos felülete írja); ebből dolgozik a háttér
// a játékos lépéseinél (csatamuvelet.js), mert ott nincs lény-nézet.
// A játékos karakter Egészsége és Mágiapontja a karakter saját állapotában él: a felület minden lépés után
// elküldi a változását (karakterValtozasok), és betöltéskor átveszi a karakterlap értékét (karakterekFrissitese).
// A naplósor { kor, szoveg, dm? }: a dm jelölésűt a játékosok nem látják (például rejtett erősítés felvétele).
const { resztvevokKibontasa, normalizal } = _m_osszecsapas;
const MAX_NAPLO = 80;
const MAX_VISSZAVONAS = 15;
const MAX_KULCS = 40;
const KEZDEMENYEZES_FOKUSZ = 'fok_dexterity_initiative';
const GYOGYITAS_FOKUSZ = 'fok_intelligence_healing';
const GYOGYITAS_CELERTEK = 11;

const masol = (x) => JSON.parse(JSON.stringify(x));
const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
let szamlalo = 0;
const ujId = (elotag) => { szamlalo = (szamlalo + 1) % 1000; return `${elotag}_${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}${szamlalo}`; };
const ujKulcs = () => ujId('l');

// Állapotok neve a felületen.
const ALLAPOT_NEV = { aktiv: 'harcol', haldoklik: 'haldoklik', kiesett: 'kiesett', halott: 'meghalt' };

// Feltételek alaplistája (AK 36., 101., mutatványok). Az időtartamot a DM adja körökben (üres: amíg le nem veszik).
const FELTETELEK = [
  { kulcs: 'fekszik', nev: 'Fekszik', en: 'Prone', leiras: 'Közelharcban +1 a támadás ellene (gépi). Fekve nem futhat; a Mozgás felállítja (gépi).' },
  { kulcs: 'kabult', nev: 'Kábult', en: 'Stunned', leiras: 'A DM dönti el a hatását.' },
  { kulcs: 'lefegyverezve', nev: 'Lefegyverezve', en: 'Disarmed', leiras: 'A fegyvere 1d6 + Erő yardra repült; a támadásnál figyelmeztetés, az Előkészítés leveszi (gépi).' },
  { kulcs: 'megragadva', nev: 'Megragadva', en: 'Grappled', leiras: '' },
  { kulcs: 'vak', nev: 'Vak', en: 'Blinded', leiras: '' },
  { kulcs: 'eszmeletlen', nev: 'Eszméletlen', en: 'Unconscious', leiras: '1 Egészséggel, a kegyelemdöfés elmaradt.' },
  { kulcs: 'megfelemlitve', nev: 'Megfélemlítve', en: 'Threatened', leiras: 'A következő körében a fenyegetőt kell támadnia: a támadás célpontja ő (gépi), a köre végén lejár.' },
  { kulcs: 'gunyolva', nev: 'Gúnyolva', en: 'Taunted', leiras: '−1 a támadásra és a varázslásra a következő körében (gépi), a köre végén lejár.' }
];

// Cselekvések (AK 33–34.). gepi: a felület alkalmazza a hatását; a többi csak jelölés, amely elfogyasztja a cselekvést.
const CSELEKVESEK = [
  { kulcs: 'tamadas', nev: 'Támadás', en: 'Melee / Ranged Attack', fajta: 'fo', tamadas: true },
  { kulcs: 'roham', nev: 'Rohamozás', en: 'Charge', fajta: 'fo', tamadas: true, leiras: 'Fél Sebességnyi mozgás, utána közelharci támadás +1-gyel.' },
  { kulcs: 'mindent_bele', nev: 'Mindent bele támadás', en: 'All-Out Attack', fajta: 'fo', tamadas: true, leiras: 'Találatnál +1 sebzés, de −1 Védekezés a következő köréig.' },
  { kulcs: 'vedekezes', nev: 'Védekezés', en: 'Defend', fajta: 'fo', gepi: true, leiras: '+2 Védekezés a következő köre elejéig.' },
  { kulcs: 'gyogyitas', nev: 'Gyógyítás', en: 'Heal', fajta: 'fo', gepi: true, leiras: 'Intelligencia (Gyógyítás) 11: siker esetén sárkánykocka + Intelligencia Egészség.' },
  { kulcs: 'futas', nev: 'Futás', en: 'Run', fajta: 'fo', leiras: 'Kétszeres Sebességnyi mozgás. Fekve nem lehet.' },
  { kulcs: 'celzas', nev: 'Célzás', en: 'Aim', fajta: 'mellek', gepi: true, leiras: '+1 a következő támadásra, ha a következő cselekvés támadás.' },
  { kulcs: 'mozgas', nev: 'Mozgás', en: 'Move', fajta: 'mellek', leiras: 'Sebességnyi mozgás; felállás, lefekvés, nyeregbe szállás fél Sebességgel.' },
  { kulcs: 'aktivalas', nev: 'Aktiválás', en: 'Activate', fajta: 'mellek', leiras: 'Harcmodor, ital vagy tárgy használatának megkezdése.' },
  { kulcs: 'keszenlet', nev: 'Előkészítés', en: 'Ready', fajta: 'mellek', leiras: 'Fegyver vagy tárgy elővétele, közben egy eltehető.' },
  { kulcs: 'felkeszules', nev: 'Felkészülés', en: 'Prepare', fajta: 'mellek', leiras: 'Egy fő cselekvés kitartása a következő köréig; a köre véget ér.' },
  { kulcs: 'oldalvedelem', nev: 'Résen lét', en: 'Guard Up', fajta: 'mellek', leiras: '+1 vagy +2 Védekezés a kör végéig, ugyanennyi büntetés a próbákra. Fő cselekvés előtt.' },
  { kulcs: 'nyomulas', nev: 'Nyomulás', en: 'Press the Attack', fajta: 'mellek', leiras: 'Ha a megtámadott ellenfél elhátrál, azonnal követheted.' },
  { kulcs: 'ujratoltes', nev: 'Újratöltés', en: 'Reload', fajta: 'mellek', leiras: 'A fegyvertől függően fő, mellék vagy szabad cselekvés.' }
];
const cselekvesAdat = (kulcs) => CSELEKVESEK.find((c) => c.kulcs === kulcs) || null;

// A harci mutatványok gépi hatása (azonosító szerint). A csomagok összetevőit is kibontja.
const MUTATVANY_HATAS = {
  mut_mighty_blow: { sebzes_kocka: 1 },
  mut_lethal_blow: { sebzes_kocka: 2 },
  mut_pierce_armor: { fel_pancel: true },
  mut_knock_prone: { fekszik: true },
  mut_defensive_stance: { vedoallas: true },
  mut_dual_strike: { kettos: true },
  mut_seize_the_initiative: { atvetel: true },
  mut_lightning_attack: { villam: true }
};
function mutatvanyHatasok(mutatvanyok, lapok) {
  const ki = { sebzes_kocka: 0, fel_pancel: false, fekszik: false, vedoallas: false, kettos: false, atvetel: false, villam: 0, szoveges: [] };
  const sorok = (lapok && lapok['Mutatványok']) || [];
  const bont = (id, nev, db) => {
    const sor = sorok.find((m) => m.id === id);
    const r = sor && (typeof sor.reszletek === 'string' ? (() => { try { return JSON.parse(sor.reszletek); } catch (e) { return {}; } })() : sor.reszletek) || {};
    if (Array.isArray(r.osszetevok) && r.osszetevok.length) { r.osszetevok.forEach((x) => bont(x, null, 1)); return; }
    const h = MUTATVANY_HATAS[id];
    if (!h) { ki.szoveges.push(nev || (sor && sor.nev_hu) || id); return; }
    for (let i = 0; i < Math.max(1, db || 1); i++) {
      if (h.sebzes_kocka) ki.sebzes_kocka += h.sebzes_kocka;
      if (h.villam) ki.villam += 1;
    }
    ['fel_pancel', 'fekszik', 'vedoallas', 'kettos', 'atvetel'].forEach((k) => { if (h[k]) ki[k] = true; });
  };
  (mutatvanyok || []).forEach((m) => bont(m.id, m.nev, m.db));
  return ki;
}

// ---------------- Sebzés ----------------

// „2d6+3”, „1d6 − 1”, „3” → { kocka: 2, plusz: 3 } (hatoldalú kockák). Ismeretlen formánál null.
function sebzesKifejezes(s) {
  const t = String(s === undefined || s === null ? '' : s).replace(/\s/g, '').replace(/[−–]/g, '-').toLowerCase();
  if (!t) return null;
  let m = t.match(/^(\d*)d6([+-]\d+)?$/);
  if (m) return { kocka: m[1] === '' ? 1 : Number(m[1]), plusz: m[2] ? Number(m[2]) : 0 };
  m = t.match(/^([+-]?\d+)$/);
  if (m) return { kocka: 0, plusz: Number(m[1]) };
  return null;
}

// A tényleges sebzés: a dobás és a bónuszok összege, a Páncélérték levonásával (átütő sebzésnél nem, kivéve az
// átütő ellen is védő lényt; Páncéltörés: fél Páncélérték, lefelé kerekítve). Soha nem negatív.
function sebzesSzamol({ osszeg, pancelertek = 0, atuto = false, atuto_ellen = false, fel_pancel = false }) {
  let pe = Math.max(0, szam(pancelertek));
  if (atuto && !atuto_ellen) pe = 0;
  if (fel_pancel) pe = Math.floor(pe / 2);
  const nyers = Math.max(0, szam(osszeg));
  return { nyers, pancel: pe, vegso: Math.max(0, nyers - pe) };
}

// ---------------- Létrehozás ----------------

// Csata egy összecsapás adatából. adatok(peldany) → { egeszseg, egeszseg_max, szivossag } a lény nézetéből.
// meglepettOldalak: az első körben nem cselekvő oldalak (AK 101.).
function csataOsszecsapasbol(osszecsapasAdat, adatok, { meglepettOldalak = [] } = {}) {
  const o = normalizal(osszecsapasAdat);
  const resztvevok = resztvevokKibontasa(o).map((p) => {
    const a = (adatok && adatok(p)) || {};
    const max = Math.max(0, szam(a.egeszseg_max, 0));
    return {
      id: p.id, resztvevo_id: p.resztvevo_id, forras: { ...p.forras }, nev: p.nev, oldal: p.oldal, csoport: p.csoport || '',
      fontos: !!p.fontos, rejtett: !!p.rejtett, meglepett: meglepettOldalak.includes(p.oldal),
      kezdemenyezes: null, egeszseg: Math.min(max, Math.max(0, szam(a.egeszseg, max))), egeszseg_max: max, szivossag: szam(a.szivossag),
      allapot: szam(a.egeszseg, max) <= 0 && max > 0 ? (p.forras.tipus === 'karakter' || p.fontos ? 'haldoklik' : 'kiesett') : 'aktiv',
      haldoklas_kor: null, feltetelek: [], hatasok: [], cselekves: uresCselekves(), gyogyithato: true,
      magiapont: a.magiapont === undefined || a.magiapont === null ? null : szam(a.magiapont), ertekek: a.ertekek ? { ...a.ertekek } : null
    };
  });
  return {
    v: 1, allapot: 'kezdemenyezes', kor: 0, soron: null, sorrend: [], leptek: [],
    oldalak: o.oldalak, viszonyok: o.viszonyok, csoportok: o.csoportok, resztvevok,
    naplo: [{ kor: 0, szoveg: 'A csata előkészítve: kezdeményezés.' }], visszavonas: [], kulcsok: [], fuggo: []
  };
}

const uresCselekves = () => ({ fo: 0, mellek: 0, plusz: 0, lista: [] });
const resztvevo = (cs, id) => (cs.resztvevok || []).find((r) => r.id === id) || null;
const naplozas = (cs, szoveg, dm) => { cs.naplo = (cs.naplo || []).concat([dm ? { kor: cs.kor, szoveg, dm: true } : { kor: cs.kor, szoveg }]).slice(-MAX_NAPLO); };

// ---------------- Lépések és visszavonás ----------------

// Egy lépés: a változás előtti állapot elmentése (csak a megváltozott résztvevők), hogy visszavonható legyen.
// fn a másolaton dolgozik (módosíthatja vagy újat adhat vissza). leiras: a napló és a Visszavonás gomb szövege.
// opciok.szerzo: ki lépett (a játékos a saját utolsó lépését visszavonhatja); opciok.dm: a naplósor csak a DM-é.
function lepes(cs, leiras, fn, kulcs, { szerzo = '', dm = false } = {}) {
  const elotte = masol(cs);
  const uj = masol(cs);
  const eredmeny = fn(uj) || uj;
  const regiR = new Map(elotte.resztvevok.map((r) => [r.id, r]));
  const valtozott = {};
  eredmeny.resztvevok.forEach((r) => {
    const v = regiR.get(r.id);
    if (!v) valtozott[r.id] = null;
    else if (JSON.stringify(v) !== JSON.stringify(r)) valtozott[r.id] = v;
  });
  elotte.resztvevok.forEach((r) => { if (!eredmeny.resztvevok.some((x) => x.id === r.id)) valtozott[r.id] = r; });
  const rekord = {
    leiras, kor: elotte.kor, soron: elotte.soron, sorrend: elotte.sorrend, leptek: elotte.leptek, allapot: elotte.allapot,
    oldalak: JSON.stringify(elotte.oldalak) !== JSON.stringify(eredmeny.oldalak) ? elotte.oldalak : undefined,
    viszonyok: JSON.stringify(elotte.viszonyok) !== JSON.stringify(eredmeny.viszonyok) ? elotte.viszonyok : undefined,
    resztvevok: valtozott, naplo_hossz: elotte.naplo.length, sorrend_r: elotte.resztvevok.map((r) => r.id),
    fuggo: JSON.stringify(elotte.fuggo || []) !== JSON.stringify(eredmeny.fuggo || []) ? (elotte.fuggo || []) : undefined
  };
  if (szerzo) rekord.szerzo = szerzo;
  if (leiras) naplozas(eredmeny, leiras, dm);
  rekord.naplo_utana = eredmeny.naplo.length;
  eredmeny.visszavonas = (eredmeny.visszavonas || []).concat([rekord]).slice(-MAX_VISSZAVONAS);
  if (kulcs) eredmeny.kulcsok = (eredmeny.kulcsok || []).concat([kulcs]).slice(-MAX_KULCS);
  return eredmeny;
}

const visszavonhato = (cs) => (cs.visszavonas || []).length > 0;
const utolsoLepes = (cs) => { const v = cs.visszavonas || []; return v.length ? v[v.length - 1].leiras : ''; };

// Az utolsó lépés visszavonása.
function visszavon(cs, kulcs) {
  const uj = masol(cs);
  const rek = (uj.visszavonas || []).pop();
  if (!rek) return uj;
  ['kor', 'soron', 'sorrend', 'leptek', 'allapot'].forEach((k) => { uj[k] = rek[k]; });
  if (rek.oldalak) uj.oldalak = rek.oldalak;
  if (rek.viszonyok) uj.viszonyok = rek.viszonyok;
  if (rek.fuggo) uj.fuggo = rek.fuggo;
  const r = rek.resztvevok || {};
  const meglevo = new Map(uj.resztvevok.map((x) => [x.id, x]));
  Object.keys(r).forEach((id) => { if (r[id]) meglevo.set(id, r[id]); else meglevo.delete(id); });
  uj.resztvevok = (rek.sorrend_r || [...meglevo.keys()]).map((id) => meglevo.get(id)).filter(Boolean);
  // a lépés naplósorait levesszük, a visszavonás maga is bekerül
  if (uj.naplo.length === rek.naplo_utana) uj.naplo = uj.naplo.slice(0, rek.naplo_hossz);
  naplozas(uj, `Visszavonva: ${rek.leiras || 'az utolsó lépés'}.`);
  if (kulcs) uj.kulcsok = (uj.kulcsok || []).concat([kulcs]).slice(-MAX_KULCS);
  return uj;
}

// ---------------- Kezdeményezés ----------------

// A kezdeményezési próba bónusza: Ügyesség (Kezdeményezés), a páncélbüntetéssel (proba.js probaOsszeallit adja).
function kezdemenyezesHianyzik(cs) {
  return cs.resztvevok.filter((r) => !r.rejtett && r.allapot !== 'halott' && !r.kezdemenyezes);
}

// A kezdeményezés rögzítése; csoporttagnál az egész csoport ugyanazt kapja (AK 100.: a csoport egyszer dob).
function kezdemenyezesBeallitas(cs, id, { osszeg, sarkany, tul, kockak, kezi } = {}) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const k = { osszeg: szam(osszeg), sarkany: szam(sarkany), tul: szam(tul), kockak: kockak || null, kezi: !!kezi };
  const celok = r.csoport ? cs.resztvevok.filter((x) => x.csoport === r.csoport) : [r];
  celok.forEach((x) => { x.kezdemenyezes = { ...k }; });
  if (cs.allapot === 'fut') sorrendBeillesztes(cs, celok.map((x) => x.id));
  else cs.sorrend = sorrendSzamol(cs).sorrend;
  return cs;
}

const kezdKulcs = (r) => [szam(r.kezdemenyezes && r.kezdemenyezes.osszeg, -99), szam(r.kezdemenyezes && r.kezdemenyezes.sarkany), szam(r.kezdemenyezes && r.kezdemenyezes.tul)];
function hasonlit(a, b) {
  const x = kezdKulcs(a), y = kezdKulcs(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i];
  // a csoport tagjai egymás mellé
  if ((a.csoport || '') !== (b.csoport || '')) return String(a.csoport || a.id).localeCompare(String(b.csoport || b.id));
  return 0;
}

// A kezdeményezés szerinti sorrend (a rejtettek nélkül). Holtversenyben: sárkánykocka, aztán Ügyesség;
// ha az is egyezik (és nem egy csoport), a DM kézzel rendez: ezeket a holtversenyek lista mutatja.
function sorrendSzamol(cs) {
  const lista = cs.resztvevok.filter((r) => !r.rejtett && r.kezdemenyezes).slice();
  const eredeti = new Map(lista.map((r, i) => [r.id, i]));
  lista.sort((a, b) => hasonlit(a, b) || eredeti.get(a.id) - eredeti.get(b.id));
  const holtversenyek = [];
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1], b = lista[i];
    if (hasonlit(a, b) === 0 && !(a.csoport && a.csoport === b.csoport)) holtversenyek.push([a.id, b.id]);
  }
  return { sorrend: lista.map((r) => r.id), holtversenyek };
}

// Új résztvevők beillesztése a futó sorrendbe a kezdeményezésük szerint (a már meglévők sorrendje nem változik).
function sorrendBeillesztes(cs, ids) {
  ids.forEach((id) => {
    cs.sorrend = cs.sorrend.filter((x) => x !== id);
    const r = resztvevo(cs, id);
    if (!r || r.rejtett || !r.kezdemenyezes) return;
    let hely = cs.sorrend.findIndex((x) => { const m = resztvevo(cs, x); return m && hasonlit(r, m) < 0; });
    if (hely < 0) hely = cs.sorrend.length;
    cs.sorrend.splice(hely, 0, id);
  });
}

// Kézi átrendezés: egy hellyel feljebb (-1) vagy lejjebb (+1).
function athelyezes(cs, id, irany) {
  const i = cs.sorrend.indexOf(id);
  const j = i + irany;
  if (i < 0 || j < 0 || j >= cs.sorrend.length) return cs;
  const s = cs.sorrend.slice();
  [s[i], s[j]] = [s[j], s[i]];
  cs.sorrend = s;
  return cs;
}

// ---------------- Körök ----------------

// Cselekedhet-e (a körben sorra kerülhet): nem rejtett, nem esett ki, nem halt meg, nem haldoklik.
const cselekvoke = (cs, r) => r && !r.rejtett && r.allapot === 'aktiv' && !(cs.kor === 1 && r.meglepett);

// A csata indítása a kezdeményezés után: 1. kör, az első cselekvő jön.
function csataKezdes(cs) {
  const hiany = kezdemenyezesHianyzik(cs);
  if (hiany.length) throw new Error('Még nincs kezdeményezése: ' + hiany.map((r) => r.nev).join(', ') + '.');
  // a DM kézi átrendezése megmarad, ha a sorrend a kezdeményezéssel rendelkezők teljes listája
  const sz = sorrendSzamol(cs).sorrend;
  if (!(cs.sorrend.length === sz.length && sz.every((x) => cs.sorrend.includes(x)))) cs.sorrend = sz;
  cs.allapot = 'fut';
  cs.kor = 1;
  cs.leptek = [];
  cs.soron = null;
  korKezdete(cs);
  return kovetkezoKeres(cs);
}

// A kör eleje: lejárnak az időtartamos feltételek és hatások.
function korKezdete(cs) {
  cs.resztvevok.forEach((r) => {
    const f = r.feltetelek.filter((x) => x.lejar_kor && cs.kor >= x.lejar_kor);
    if (f.length) naplozas(cs, `${r.nev}: lejárt (${f.map((x) => x.nev).join(', ')}).`);
    r.feltetelek = r.feltetelek.filter((x) => !(x.lejar_kor && cs.kor >= x.lejar_kor));
    r.hatasok = r.hatasok.filter((x) => !(x.lejar === 'kor' && cs.kor > x.kor));
    if (cs.kor === 2 && r.meglepett) r.meglepett = false;
  });
}

// A saját kör eleje: a „következő köröd elejéig” tartó hatások lejárnak, a cselekvések nullázódnak,
// a haldokló a végső kör elején meghal.
function sajatKorKezdete(cs, r) {
  // a Célzás is csak a köre végéig él, ha nem követte támadás
  r.hatasok = r.hatasok.filter((x) => !((x.lejar === 'sajat' || x.lejar === 'kovetkezo_tamadas') && cs.kor > x.kor));
  // a „következő köröd végéig” tartók ettől a körtől élnek, és a kör végén járnak le
  r.feltetelek.forEach((f) => { if (f.lejar === 'sajat_kor_vege') f.elkezdve = true; });
  r.hatasok.forEach((h) => { if (h.lejar === 'sajat_kor_vege') h.elkezdve = true; });
  r.cselekves = uresCselekves();
}

// A saját kör vége: lejárnak a „következő köröd végéig” tartó feltételek és hatások.
function sajatKorVege(cs, r) {
  const f = r.feltetelek.filter((x) => x.lejar === 'sajat_kor_vege' && x.elkezdve);
  const h = r.hatasok.filter((x) => x.lejar === 'sajat_kor_vege' && x.elkezdve);
  if (f.length || h.length) naplozas(cs, `${r.nev}: lejárt (${f.map((x) => x.nev).concat(h.map((x) => x.nev)).join(', ')}).`);
  r.feltetelek = r.feltetelek.filter((x) => !(x.lejar === 'sajat_kor_vege' && x.elkezdve));
  r.hatasok = r.hatasok.filter((x) => !(x.lejar === 'sajat_kor_vege' && x.elkezdve));
}

// A következő cselekvő keresése (a soron lévő utáni első, aki ebben a körben még nem lépett).
// A haldoklókat is végigveszi: a végső körük elején meghalnak (AK 36.).
function kovetkezoKeres(cs) {
  for (let fordulo = 0; fordulo < 3; fordulo++) {
    for (const id of cs.sorrend) {
      if (cs.leptek.includes(id)) continue;
      const r = resztvevo(cs, id);
      if (!r) continue;
      if (r.allapot === 'haldoklik' && !r.rejtett) {
        cs.leptek.push(id);
        if (r.haldoklas_kor && cs.kor >= r.haldoklas_kor) {
          r.allapot = 'halott';
          r.feltetelek = r.feltetelek.filter((f) => f.kulcs !== 'haldoklik');
          naplozas(cs, `${r.nev} meghalt.`);
        }
        continue;
      }
      if (!cselekvoke(cs, r)) { cs.leptek.push(id); continue; }
      cs.soron = id;
      sajatKorKezdete(cs, r);
      return cs;
    }
    // új kör
    if (!cs.sorrend.some((id) => { const r = resztvevo(cs, id); return r && (r.allapot === 'aktiv' || r.allapot === 'haldoklik') && !r.rejtett; })) {
      cs.soron = null;
      return cs;
    }
    cs.kor += 1;
    cs.leptek = [];
    korKezdete(cs);
    naplozas(cs, `${cs.kor}. kör.`);
  }
  cs.soron = null;
  return cs;
}

// „Kész, következő”: a soron lévő köre véget ér.
function kovetkezo(cs) {
  if (cs.allapot !== 'fut') return cs;
  const soron = resztvevo(cs, cs.soron);
  if (soron) sajatKorVege(cs, soron);
  if (cs.soron && !cs.leptek.includes(cs.soron)) cs.leptek.push(cs.soron);
  return kovetkezoKeres(cs);
}

// Kezdeményezés átvétele (Seize the Initiative): a résztvevő a sorrend élére kerül; a körben még nem lépettek
// ebben a körben is sorra kerülnek, a következő kört ő kezdi.
function sorrendElere(cs, id) {
  if (!cs.sorrend.includes(id)) return cs;
  cs.sorrend = [id].concat(cs.sorrend.filter((x) => x !== id));
  return cs;
}

// ---------------- Cselekvések ----------------

// Körönként egy fő és egy mellék, vagy két mellék cselekvés (AK 33.). A plusz a mutatványból (Villámtámadás)
// vagy a DM feloldásából jön. A szabad cselekvés nem számít.
function cselekvesEngedett(r, fajta) {
  if (!r) return false;
  const c = r.cselekves || uresCselekves();
  if (fajta === 'szabad') return true;
  if (c.plusz > 0) return true;
  if (fajta === 'fo') return c.fo < 1 && c.fo + c.mellek < 2;
  return c.fo + c.mellek < 2;
}

function cselekvesRogzites(cs, id, fajta, nev) {
  const r = resztvevo(cs, id);
  if (!r || fajta === 'szabad') { if (r && nev) r.cselekves.lista = (r.cselekves.lista || []).concat([nev]); return cs; }
  const c = r.cselekves || (r.cselekves = uresCselekves());
  const alap = fajta === 'fo' ? c.fo < 1 && c.fo + c.mellek < 2 : c.fo + c.mellek < 2;
  if (!alap && c.plusz > 0) c.plusz -= 1;
  else if (fajta === 'fo') c.fo += 1; else c.mellek += 1;
  if (nev) c.lista = (c.lista || []).concat([nev]);
  return cs;
}

function cselekvesFeloldas(cs, id, db = 1) {
  const r = resztvevo(cs, id);
  if (r) r.cselekves.plusz = Math.max(0, (r.cselekves.plusz || 0) + db);
  return cs;
}

function cselekvesSzoveg(r) {
  const c = (r && r.cselekves) || uresCselekves();
  const reszek = [];
  if (c.fo) reszek.push(`fő ${c.fo}`);
  if (c.mellek) reszek.push(`mellék ${c.mellek}`);
  if (c.plusz) reszek.push(`+${c.plusz} további`);
  return reszek.join(', ') || 'még nem cselekedett';
}

// Hatás felvétele (cel: 'vedekezes' | 'tamadas' | 'sebzes'). lejar: 'sajat' (a következő köre elejéig),
// 'kor' (a kör végéig), 'kovetkezo_tamadas' (a következő támadásig, de legfeljebb a köre végéig).
function hatasHozzaadas(cs, id, { nev, cel, ertek, lejar = 'sajat', fogy = false }) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const h = { id: ujId('h'), nev, cel, ertek: szam(ertek), lejar, kor: cs.kor };
  if (fogy) h.fogy = true;
  r.hatasok = r.hatasok.filter((x) => x.nev !== nev).concat([h]);
  return cs;
}

// A következő próbára szóló bónuszok (cel: 'proba', például Éberség): [{ ertek, eredet }].
const probaBonuszok = (r) => ((r && r.hatasok) || []).filter((h) => h.cel === 'proba' && szam(h.ertek)).map((h) => ({ ertek: szam(h.ertek), eredet: h.nev }));
// A próba után elfogynak.
function probaBonuszFogyasztas(cs, id) {
  const r = resztvevo(cs, id);
  if (r) r.hatasok = r.hatasok.filter((h) => !(h.cel === 'proba' && h.fogy));
  return cs;
}
const vanFeltetel = (r, kulcs) => ((r && r.feltetelek) || []).some((f) => f.kulcs === kulcs);

const hatasOsszeg = (r, cel) => ((r && r.hatasok) || []).filter((h) => h.cel === cel).reduce((a, h) => a + szam(h.ertek), 0);

// A célpont Védekezése a csatában: a nézet értéke és a csata hatásai (Védekezés, Védőállás, Mindent bele).
function vedekezes(r, alap) {
  return szam(alap, 10) + hatasOsszeg(r, 'vedekezes');
}

// A támadás módosítói a csata állapotából: a támadó hatásai (Célzás) és a célpont feltételei (fekvő: +1 közelharcban).
function tamadasModositok(tamado, cel, { tavolsagi = false } = {}) {
  const ki = [];
  ((tamado && tamado.hatasok) || []).filter((h) => (h.cel === 'tamadas' || h.cel === 'proba') && szam(h.ertek)).forEach((h) => ki.push({ ertek: szam(h.ertek), eredet: h.nev, hatas: h.id }));
  if (vanFeltetel(tamado, 'gunyolva')) ki.push({ ertek: -1, eredet: 'Gúnyolva' });
  if (cel && !tavolsagi && (cel.feltetelek || []).some((f) => f.kulcs === 'fekszik')) ki.push({ ertek: 1, eredet: 'Fekvő célpont' });
  return ki;
}

// A támadás után a „következő támadásig” szóló hatások (Célzás) elfogynak.
function tamadasUtan(cs, id) {
  const r = resztvevo(cs, id);
  if (r) r.hatasok = r.hatasok.filter((h) => h.lejar !== 'kovetkezo_tamadas' && !(h.cel === 'proba' && h.fogy));
  return cs;
}

// ---------------- Egészség, haldoklás ----------------

// Egészség beállítása a szabályok szerint: nulla alatt nincs, nullánál a játékos karakter és a fontos NJK
// haldoklik (2 + Szívósság kör múlva, a saját köre elején hal meg), a többi kiesik (AK 36., 101.).
// A haldokló gyógyulása (Egészség nulla fölött) megszünteti a haldoklást.
function egeszsegBeallitas(cs, id, ertek) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const regi = r.egeszseg;
  r.egeszseg = Math.max(0, Math.min(r.egeszseg_max || szam(ertek), Math.round(szam(ertek))));
  if (r.egeszseg <= 0 && regi > 0 && r.allapot === 'aktiv') {
    if (r.forras.tipus === 'karakter' || r.fontos) {
      r.allapot = 'haldoklik';
      r.haldoklas_kor = (cs.kor || 0) + 2 + Math.max(0, r.szivossag);
      naplozas(cs, `${r.nev} haldoklik: a ${r.haldoklas_kor}. kör saját köre elején meghal, ha addig nem gyógyítják.`);
    } else {
      r.allapot = 'kiesett';
      naplozas(cs, `${r.nev} kiesett.`);
    }
  } else if (r.egeszseg > 0 && (r.allapot === 'haldoklik' || (r.allapot === 'kiesett' && regi <= 0))) {
    r.allapot = 'aktiv';
    r.haldoklas_kor = null;
    naplozas(cs, `${r.nev} újra harcol.`);
  }
  if (r.egeszseg < regi) r.gyogyithato = true;
  return cs;
}

function sebzesAlkalmazas(cs, id, mennyi) {
  const r = resztvevo(cs, id);
  if (!r || !(szam(mennyi) > 0)) return cs;
  return egeszsegBeallitas(cs, id, r.egeszseg - szam(mennyi));
}

// Gyógyítás (Heal cselekvés, ital, varázslat): legfeljebb a maximumig. heal: a Gyógyítás cselekvésből jön
// (a célpont addig nem kaphat újabbat, amíg újabb sebzést nem szenved).
function gyogyitas(cs, id, mennyi, { heal = false } = {}) {
  const r = resztvevo(cs, id);
  if (!r || !(szam(mennyi) > 0)) return cs;
  egeszsegBeallitas(cs, id, Math.min(r.egeszseg_max, r.egeszseg + szam(mennyi)));
  if (heal) r.gyogyithato = false;
  return cs;
}

// A DM kézi döntése: kiesett, haldoklik, halott vagy újra harcol.
function allapotBeallitas(cs, id, allapot) {
  const r = resztvevo(cs, id);
  if (!r || !ALLAPOT_NEV[allapot]) return cs;
  r.allapot = allapot;
  if (allapot === 'haldoklik' && !r.haldoklas_kor) r.haldoklas_kor = (cs.kor || 0) + 2 + Math.max(0, r.szivossag);
  if (allapot !== 'haldoklik') r.haldoklas_kor = null;
  if (allapot === 'aktiv' && r.egeszseg <= 0) r.egeszseg = 1;
  return cs;
}

function fontosBeallitas(cs, id, fontos) {
  const r = resztvevo(cs, id);
  if (r) r.fontos = !!fontos;
  return cs;
}

// ---------------- Feltételek ----------------

// korok: hány körig tart (a kör elején jár le); üres vagy 0: amíg le nem veszik.
// lejar: 'sajat_kor_vege' (a gazdája következő körének végén jár le); forras: ki okozta (Megfélemlítve: a fenyegető).
function feltetelHozzaadas(cs, id, { kulcs, nev, korok, lejar, forras }) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const alap = FELTETELEK.find((f) => f.kulcs === kulcs);
  const n = String(nev || (alap && alap.nev) || '').trim().slice(0, 60);
  if (!n) return cs;
  const k = szam(korok);
  const f = { id: ujId('f'), kulcs: alap ? alap.kulcs : '', nev: n, lejar_kor: k > 0 ? (cs.kor || 0) + k : null };
  if (lejar) f.lejar = lejar;
  if (forras) f.forras = forras;
  r.feltetelek = r.feltetelek.filter((x) => (alap ? x.kulcs !== alap.kulcs : x.nev !== n)).concat([f]);
  return cs;
}

function feltetelTorles(cs, id, feltetelId) {
  const r = resztvevo(cs, id);
  if (r) r.feltetelek = r.feltetelek.filter((f) => f.id !== feltetelId);
  return cs;
}

// ---------------- Résztvevők csata közben ----------------

// Rejtett résztvevő belépése: a kezdeményezésével bekerül a sorrendbe, és a következő körtől cselekszik.
function belepes(cs, id, kezdemenyezes) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  r.rejtett = false;
  if (kezdemenyezes) r.kezdemenyezes = { ...kezdemenyezes };
  if (cs.allapot === 'fut') {
    sorrendBeillesztes(cs, [id]);
    if (!cs.leptek.includes(id)) cs.leptek.push(id);
  }
  return cs;
}

// Új résztvevő a csata közben (gyors hozzáadás): a felület adja az alapadatait. csoportNev: a több példányban
// felvett lény közös kezdeményezési csoportja (azonos néven egy csoport). A futó csatában az új résztvevő
// a belépésre vár (rejtett), amíg kezdeményezést nem kap.
function resztvevoHozzaadas(cs, { forras, nev, oldal, fontos = false, rejtett = false, egeszseg, egeszseg_max, szivossag, kezdemenyezes = null, csoportNev = '', magiapont = null, ertekek = null }) {
  const id = ujId('cs');
  let csoport = '';
  if (csoportNev) {
    const meglevo = (cs.csoportok || []).find((g) => g.nev === csoportNev);
    if (meglevo) csoport = meglevo.id;
    else { csoport = ujId('g'); cs.csoportok = (cs.csoportok || []).concat([{ id: csoport, nev: csoportNev }]); }
  }
  const max = Math.max(0, szam(egeszseg_max));
  cs.resztvevok.push({
    id, resztvevo_id: id, forras: { ...forras }, nev: String(nev || 'Új résztvevő'), oldal: oldal || (cs.oldalak[0] && cs.oldalak[0].id), csoport,
    fontos: !!fontos, rejtett: !!rejtett, meglepett: false, kezdemenyezes, egeszseg: Math.min(max, szam(egeszseg, max)), egeszseg_max: max,
    szivossag: szam(szivossag), allapot: 'aktiv', haldoklas_kor: null, feltetelek: [], hatasok: [], cselekves: uresCselekves(), gyogyithato: true,
    magiapont: magiapont === null || magiapont === undefined ? null : szam(magiapont), ertekek: ertekek ? { ...ertekek } : null
  });
  if (kezdemenyezes && !rejtett) belepes(cs, id, kezdemenyezes);
  else if (cs.allapot === 'fut' && !kezdemenyezes) resztvevo(cs, id).rejtett = true;
  return cs;
}

// A résztvevő eltávolítása (tévedésből felvett lény); a csata sorrendjéből is kikerül.
function resztvevoTorles(cs, id) {
  cs.resztvevok = cs.resztvevok.filter((r) => r.id !== id);
  cs.sorrend = cs.sorrend.filter((x) => x !== id);
  cs.leptek = cs.leptek.filter((x) => x !== id);
  if (cs.soron === id) { cs.soron = null; kovetkezoKeres(cs); }
  return cs;
}

function oldalValtas(cs, id, oldal) {
  const r = resztvevo(cs, id);
  if (r && cs.oldalak.some((o) => o.id === oldal)) r.oldal = oldal;
  return cs;
}

// ---------------- Karakterek Egészsége ----------------

// A játékos karakterek aktuális értékei a karakterlapról (betöltéskor, nem lépés):
// { [karakter id]: { egeszseg, egeszseg_max, szivossag, magiapont, ertekek } }.
// Csak az eltérőt írja át; az állapot (haldoklás) a szabály szerint igazodik.
function karakterekFrissitese(cs, ertekek) {
  let valtozott = false;
  cs.resztvevok.forEach((r) => {
    if (r.forras.tipus !== 'karakter') return;
    const e = ertekek && ertekek[r.forras.id];
    if (!e) return;
    if (Number.isFinite(Number(e.egeszseg_max)) && r.egeszseg_max !== Number(e.egeszseg_max)) { r.egeszseg_max = Number(e.egeszseg_max); valtozott = true; }
    if (Number.isFinite(Number(e.szivossag)) && r.szivossag !== Number(e.szivossag)) { r.szivossag = Number(e.szivossag); valtozott = true; }
    if (e.magiapont !== undefined && e.magiapont !== null && Number.isFinite(Number(e.magiapont)) && r.magiapont !== Number(e.magiapont)) { r.magiapont = Number(e.magiapont); valtozott = true; }
    if (e.ertekek && ertekekBeallitas(cs, r.id, e.ertekek)) valtozott = true;
    if (Number.isFinite(Number(e.egeszseg)) && r.egeszseg !== Number(e.egeszseg)) {
      const ertek = Number(e.egeszseg);
      if (r.allapot === 'halott') { r.egeszseg = ertek; valtozott = true; return; }
      egeszsegBeallitas(cs, r.id, ertek);
      valtozott = true;
    }
  });
  return valtozott;
}

// A résztvevő csataértékeinek (Védekezés, Páncélérték, Mágiapont maximuma, Akaraterő) frissítése a nézetből.
// Igazat ad, ha változott valami.
function ertekekBeallitas(cs, id, e) {
  const r = resztvevo(cs, id);
  if (!r || !e) return false;
  const uj = { ...(r.ertekek || {}) };
  Object.keys(e).forEach((k) => { if (e[k] !== undefined) uj[k] = e[k]; });
  if (JSON.stringify(uj) === JSON.stringify(r.ertekek || null)) return false;
  r.ertekek = uj;
  if ((r.magiapont === null || r.magiapont === undefined) && Number.isFinite(Number(uj.magiapont_max)) && Number(uj.magiapont_max) > 0) r.magiapont = Number(uj.magiapont_max);
  return true;
}

// Mágiapont beállítása (0 és a maximum között).
function magiapontBeallitas(cs, id, ertek) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const max = r.ertekek && Number.isFinite(Number(r.ertekek.magiapont_max)) ? Number(r.ertekek.magiapont_max) : Infinity;
  r.magiapont = Math.max(0, Math.min(max, Math.round(szam(ertek))));
  return cs;
}

// A lépés során megváltozott karakter-értékek (a háttér ezeket a karakter állapotába írja):
// { [karakter id]: { egeszseg, magiapont? } }.
function karakterValtozasok(elotte, utana) {
  const ki = {};
  (utana.resztvevok || []).forEach((r) => {
    if (r.forras.tipus !== 'karakter') return;
    const v = (elotte.resztvevok || []).find((x) => x.id === r.id);
    const mpValt = r.magiapont !== null && r.magiapont !== undefined && (!v || v.magiapont !== r.magiapont);
    if (!v || v.egeszseg !== r.egeszseg || mpValt) {
      ki[r.forras.id] = { egeszseg: r.egeszseg };
      if (r.magiapont !== null && r.magiapont !== undefined) ki[r.forras.id].magiapont = r.magiapont;
    }
  });
  return ki;
}

// ---------------- Összegzés ----------------

function csataOsszegzes(cs) {
  const oldalak = (cs.oldalak || []).map((o) => {
    const tagok = cs.resztvevok.filter((r) => r.oldal === o.id && !r.rejtett);
    return { id: o.id, nev: o.nev, harcol: tagok.filter((r) => r.allapot === 'aktiv').length, osszes: tagok.length };
  });
  return {
    oldalak,
    kiesettek: cs.resztvevok.filter((r) => r.allapot === 'kiesett' || r.allapot === 'halott').map((r) => r.nev),
    haldoklok: cs.resztvevok.filter((r) => r.allapot === 'haldoklik').map((r) => r.nev),
    serultek: cs.resztvevok.filter((r) => r.allapot === 'aktiv' && r.egeszseg < r.egeszseg_max).map((r) => r.nev),
    rejtettek: cs.resztvevok.filter((r) => r.rejtett).map((r) => r.nev)
  };
}

// A soron lévő és a következő nevei (a fejléchez).
function kovetkezoNev(cs) {
  if (cs.allapot !== 'fut') return '';
  const proba = masol({ ...cs, naplo: [], visszavonas: [] });
  kovetkezo(proba);
  const r = resztvevo(proba, proba.soron);
  return r ? (proba.kor > cs.kor ? `${r.nev} (új kör)` : r.nev) : '';
}

return { MAX_NAPLO, MAX_VISSZAVONAS, KEZDEMENYEZES_FOKUSZ, GYOGYITAS_FOKUSZ, GYOGYITAS_CELERTEK, ujKulcs, ALLAPOT_NEV, FELTETELEK, CSELEKVESEK, cselekvesAdat, mutatvanyHatasok, sebzesKifejezes, sebzesSzamol, csataOsszecsapasbol, resztvevo, lepes, visszavonhato, utolsoLepes, visszavon, kezdemenyezesHianyzik, kezdemenyezesBeallitas, sorrendSzamol, athelyezes, csataKezdes, kovetkezo, sorrendElere, cselekvesEngedett, cselekvesRogzites, cselekvesFeloldas, cselekvesSzoveg, hatasHozzaadas, probaBonuszok, probaBonuszFogyasztas, vanFeltetel, hatasOsszeg, vedekezes, tamadasModositok, tamadasUtan, egeszsegBeallitas, sebzesAlkalmazas, gyogyitas, allapotBeallitas, fontosBeallitas, feltetelHozzaadas, feltetelTorles, belepes, resztvevoHozzaadas, resztvevoTorles, oldalValtas, karakterekFrissitese, ertekekBeallitas, magiapontBeallitas, karakterValtozasok, csataOsszegzes, kovetkezoNev };
})();

// ----- web/js/jatek/csatamuvelet.js -----
const _m_csatamuvelet = (function () {
// Csatalépések szándékként (3. lépés, 5. ütem): a támadás, a varázslat, a gyógyítás, a cselekvések, a kezdeményezés,
// a kör vége és a célpont próbája egyetlen leíró objektumból („művelet”) alkalmazva. A DM felülete ezekkel lép
// (a teljes állapotot küldi, combat.act), a játékos felülete a műveletet küldi (combat.player), és a háttér
// ugyanezzel a kóddal alkalmazza a teljes csatán (backend/Csatamotor.gs, a tools/csatamotor_general.py kimenete).
// Itt van a játékosnak szűrt csata (jatekosNezet), a varázslatok adatai és a lezárás segédei is.
// Tiszta függvények, böngészőben, Node-ban és Apps Scriptben is futnak. Teszt: node tools/teszt/csatamuvelet.mjs
// Terv: claude/csata-terv.md („Játékos oldal”, „A csata menete” 7. és 13. pont).
//
// Egy művelet: { tipus, r (a cselekvő résztvevő azonosítója), ... }
//   kezdemenyezes  { osszeg, sarkany, tul, kockak, kezi }
//   cselekves      { kulcs } vagy { szabad: { nev, fajta } }
//   kovetkezo      {}
//   tamadas        { cel, cselekves, tamadas: { nev, atuto }, osszeg, talalat, sebzes, pancel?, fel_pancel, kegyelem,
//                    masodik: { cel, sebzes } | null, hatasok: { fekszik, vedoallas, atvetel, villam }, mutatvanyok: [név] }
//   gyogyitas      { cel, mennyi }
//   varazslat      { varazslat: { id, nev }, fajta, mp, siker, osszeg, celok: [id], proba: { tul, fokuszok, celertek, nev } | null,
//                    sebzes: { teljes, csokkentett, atuto } | null, gyogyitas, extra: { cel, sebzes } | null,
//                    hatasok: { vedopajzs }, mutatvanyok: [név] }
//   celpont_proba  { proba_id, osszeg, kockak, kezi }
//   mutatvany_proba { proba_id, fel: 'tamado' | 'cel', osszeg, sarkany, tul, kockak, kezi }
// A támadás és a varázslat mutatvany_probak mezője: [{ mutatvany, nev }] a próbát kérő mutatványok (MUTATVANY_PROBAK).
//   visszavonas    {} (a játékos csak a saját utolsó lépését vonhatja vissza)
// A függő próbák a csata `fuggo` listájában. A varázslat célpontjáé: { id, varazslo, varazslo_nev, varazslat, cel, cel_nev,
//   tul, fokuszok, proba_nev, celertek, teljes, csokkentett, atuto, kor }; a célpont irányítója (és a DM) dobja.
// A mutatványé: { id, fajta: 'mutatvany', mutatvany, nev, tipus: 'sajat' | 'ellen', tamado, tamado_nev, cel, cel_nev,
//   tamado_proba, cel_proba, celertek, eredmeny: { tamado, cel }, kor }; mindkét oldalt az irányítója (és a DM) dobja.
const C = _m_csata;
const { egeszsegLathatosag, leiroEgeszseg } = _m_osszecsapas;
const masol = (x) => JSON.parse(JSON.stringify(x));
const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
const reszletekBol = (e) => {
  const r = e && e.reszletek;
  if (!r) return {};
  if (typeof r === 'string') { try { return JSON.parse(r); } catch (err) { return {}; } }
  return r;
};
let szamlalo = 0;
const ujId = (elotag) => { szamlalo = (szamlalo + 1) % 1000; return `${elotag}_${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}${szamlalo}`; };

const MUVELET_TIPUSOK = ['kezdemenyezes', 'cselekves', 'kovetkezo', 'tamadas', 'gyogyitas', 'varazslat', 'celpont_proba', 'mutatvany_proba', 'visszavonas'];
const ismeretlenHp = (r) => !r || r.egeszseg === null || r.egeszseg === undefined;

// ---------------- Varázslatok ----------------

// A varázslat ideje a cselekvés fajtájára (a perces, órás varázslat csatában fő cselekvésnek számít).
const IDO_FAJTA = { fo: 'fo', kis: 'mellek', szabad: 'szabad' };

// Sebzés- vagy gyógyításkifejezés a varázslat adatából: „2d6+Akaraterő”, „Akaraterő (legalább 1)”, „1d6+1”, „0”.
// Visszaad: { kocka, plusz } vagy null.
function varazslatKifejezes(s, akarat = 0) {
  if (s === null || s === undefined || s === '') return null;
  const a = Math.round(szam(akarat));
  let t = String(s).trim();
  if (/^Akaraterő\s*\(legalább 1\)$/i.test(t)) return { kocka: 0, plusz: Math.max(1, a) };
  t = t.replace(/\+\s*Akaraterő/gi, a >= 0 ? `+${a}` : `${a}`).replace(/^Akaraterő$/i, String(a));
  return C.sebzesKifejezes(t);
}

// A varázslat csatához szükséges adatai (a Varázslatok lap sorából). akarat: a varázsló Akaraterője.
function varazslatAdat(elem, { akarat = 0 } = {}) {
  if (!elem) return null;
  const r = reszletekBol(elem);
  const mp = r.mp && typeof r.mp === 'object' ? r.mp : { min: szam(elem.mp_koltseg), max: szam(elem.mp_koltseg), plusz: false };
  const pr = r.proba && typeof r.proba === 'object' && r.proba.tulajdonsag ? r.proba : null;
  const gy = r.gyogyitas ? String(r.gyogyitas) : '';
  const gyMp = /mágiapontonként/i.test(gy);
  return {
    id: elem.id, nev: elem.nev_hu || elem.nev_en || elem.id, arkanum: elem.arkanum || '', fokozat: elem.fokozat || '',
    ido_kod: r.ido_kod || 'fo', fajta: IDO_FAJTA[r.ido_kod] || 'fo',
    mp: { min: szam(mp.min), max: mp.max === null || mp.max === undefined ? null : szam(mp.max), plusz: !!mp.plusz },
    celertek: r.celertek && typeof r.celertek === 'object' ? szam(r.celertek.ertek, null) : szam(elem.celertek, null),
    proba: pr ? { tul: pr.tulajdonsag, fokuszok: Array.isArray(pr.fokusz) ? pr.fokusz.slice() : (pr.fokusz ? [pr.fokusz] : []) } : null,
    sebzes: varazslatKifejezes(r.sebzes, akarat), sebzes_szoveg: r.sebzes || '',
    csokkentett: r.sebzes_ellenallaskor === null || r.sebzes_ellenallaskor === undefined ? null : varazslatKifejezes(r.sebzes_ellenallaskor, akarat),
    csokkentett_szoveg: r.sebzes_ellenallaskor || '',
    atuto: !!r.atuto,
    gyogyitas: gyMp ? null : varazslatKifejezes(gy.replace(/\s/g, ''), akarat), gyogyitas_mp: gyMp, gyogyitas_szoveg: gy,
    terulet: r.terulet || '', hatotav: r.hatotav_yard || null, leiras: elem.leiras_hu || ''
  };
}

// A gyógyító varázslat kockái: „Mágiapontonként 1d6” esetén a kifizetett Mágiapont.
function varazslatGyogyitasKocka(v, mp) {
  if (!v) return null;
  if (v.gyogyitas_mp) return { kocka: Math.max(0, Math.round(szam(mp))), plusz: 0 };
  return v.gyogyitas;
}

// A varázslati mutatványok gépi hatása (azonosító szerint): Erőteljes varázslás (+1 Varázserő pontonként, legfeljebb +3),
// Ügyes varázslás (−1 Mágiapont), Hatalmas varázslat (+1d6 egy célpontnak), Halálos varázslat (+2d6 egy célpontnak),
// Mágikus védőpajzs (+2 Védekezés). A többi szövegként, a DM dönt. mutatvanyok: [{ id, nev, mp, db }].
function varazsMutatvanyHatasok(mutatvanyok) {
  const ki = { varazsero: 0, mp_kedvezmeny: 0, extra_kocka: 0, vedopajzs: false, szoveges: [] };
  (mutatvanyok || []).forEach((m) => {
    const db = Math.max(1, szam(m.db, 1));
    if (m.id === 'mut_powerful_casting') ki.varazsero = Math.min(3, ki.varazsero + Math.max(db, szam(m.mp, 1)));
    else if (m.id === 'mut_skillful_casting') ki.mp_kedvezmeny += db;
    else if (m.id === 'mut_mighty_spell') ki.extra_kocka += db;
    else if (m.id === 'mut_lethal_spell') ki.extra_kocka += 2 * db;
    else if (m.id === 'mut_magic_shield') ki.vedopajzs = true;
    else ki.szoveges.push(m.nev || m.id);
  });
  return ki;
}

// A próbát kérő mutatványok (a leírásuk szerint) és a következményük. A próba: { nev, tul, fokuszok, barmely_fokusz,
// tamadas (támadópróba: a támadónál a támadás bónusza, a célpontnál a legjobb támadása) }.
const MUTATVANY_PROBAK = {
  mut_stay_aware: { tipus: 'sajat', tamado: { nev: 'Észlelés (bármely fókusz)', tul: 'tul_perception', fokuszok: [], barmely_fokusz: true }, celertek: 11,
    kovetkezmeny: 'Siker: +1 a következő próbára (a következő köre végéig), vagy a DM elárul valamit a harctérről.' },
  mut_threaten: { tipus: 'ellen', tamado: { nev: 'Erő (Megfélemlítés)', tul: 'tul_strength', fokuszok: ['fok_strength_intimidation'] },
    cel: { nev: 'Akaraterő (Önfegyelem)', tul: 'tul_willpower', fokuszok: ['fok_willpower_self_discipline'] },
    kovetkezmeny: 'Ha a fenyegető nyer: a célpont Megfélemlítve, a következő körében őt kell támadnia.' },
  mut_taunt: { tipus: 'ellen', tamado: { nev: 'Kommunikáció (Megtévesztés)', tul: 'tul_communication', fokuszok: ['fok_communication_deception'] },
    cel: { nev: 'Akaraterő (Önfegyelem)', tul: 'tul_willpower', fokuszok: ['fok_willpower_self_discipline'] },
    kovetkezmeny: 'Ha a gúnyolódó nyer: a célpont Gúnyolva, a következő körében −1 a támadásra és a varázslásra.' },
  mut_disarm: { tipus: 'ellen', tamado: { nev: 'támadópróba', tamadas: true }, cel: { nev: 'támadópróba', tamadas: true },
    kovetkezmeny: 'Ha a támadó nyer: a célpont Lefegyverezve, a fegyvere 1d6 + Erő yardra repül.' },
  mut_disrupt_magic: { tipus: 'sajat', tamado: { nev: 'Intelligencia (Hatalom arkánum)', tul: 'tul_intelligence', fokuszok: ['fok_intelligence_power_arcana'] }, celertek: null,
    kovetkezmeny: 'A megzavart hatás Varázsereje ellen: ha eléri, a hatás megszűnik (a DM tudja a Varázserőt).', mp_nelkul: true }
};
// A kosár mutatványai közül a próbát kérők: [{ mutatvany, nev }].
function mutatvanyProbak(mutatvanyok) {
  return (mutatvanyok || []).filter((m) => MUTATVANY_PROBAK[m.id]).map((m) => ({ mutatvany: m.id, nev: m.nev || m.id }));
}
// A Félelmetes varázslat Célértéke: 10 + a varázsló Akaraterője (a varázslón hatásként él a következő köre elejéig).
const FELELMETES = 'Félelmetes varázslat';

function mutatvanyFuggok(x, lista, tamadoId, celId) {
  const t = C.resztvevo(x, tamadoId);
  const c = celId ? C.resztvevo(x, celId) : null;
  (lista || []).forEach((p) => {
    const d = MUTATVANY_PROBAK[p.mutatvany];
    if (!d || (d.tipus === 'ellen' && !c)) return;
    x.fuggo = (x.fuggo || []).concat([{
      id: ujId('p'), fajta: 'mutatvany', mutatvany: p.mutatvany, nev: p.nev, tipus: d.tipus, tamado: tamadoId, tamado_nev: t ? t.nev : '',
      cel: c ? c.id : null, cel_nev: c ? c.nev : '', tamado_proba: { ...d.tamado, bonusz: d.tamado.tamadas ? szam(p.bonusz) : undefined },
      cel_proba: d.cel ? { ...d.cel } : null, celertek: d.celertek === undefined ? null : d.celertek, kovetkezmeny: d.kovetkezmeny,
      eredmeny: { tamado: null, cel: null }, kor: x.kor
    }]);
  });
}

// A mutatványpróba kimenete, ha minden kell dobás megvan: { kesz, nyert: 'tamado' | 'cel' | null, holtverseny, siker }.
function mutatvanyProbaAllas(f) {
  const a = f.eredmeny && f.eredmeny.tamado;
  const b = f.eredmeny && f.eredmeny.cel;
  if (f.tipus === 'sajat') {
    if (!a) return { kesz: false };
    return { kesz: true, siker: f.celertek === null || f.celertek === undefined ? null : szam(a.osszeg) >= szam(f.celertek) };
  }
  if (!a || !b) return { kesz: false };
  const k = (e) => [szam(e.osszeg), szam(e.sarkany), szam(e.tul)];
  const x = k(a), y = k(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return { kesz: true, nyert: x[i] > y[i] ? 'tamado' : 'cel' };
  return { kesz: true, nyert: null, holtverseny: true };
}

function mutatvanyKovetkezmeny(x, f, allas) {
  if (f.mutatvany === 'mut_stay_aware' && allas.siker) C.hatasHozzaadas(x, f.tamado, { nev: 'Éberség', cel: 'proba', ertek: 1, lejar: 'sajat_kor_vege', fogy: true });
  if (allas.nyert !== 'tamado') return;
  if (f.mutatvany === 'mut_threaten') C.feltetelHozzaadas(x, f.cel, { kulcs: 'megfelemlitve', nev: `Megfélemlítve (${f.tamado_nev})`, lejar: 'sajat_kor_vege', forras: f.tamado });
  if (f.mutatvany === 'mut_taunt') C.feltetelHozzaadas(x, f.cel, { kulcs: 'gunyolva', lejar: 'sajat_kor_vege', forras: f.tamado });
  if (f.mutatvany === 'mut_disarm') C.feltetelHozzaadas(x, f.cel, { kulcs: 'lefegyverezve' });
}

function mutatvanyProbaSzoveg(f, allas) {
  const e = f.eredmeny || {};
  if (f.tipus === 'sajat') {
    const o = `${f.tamado_nev}: ${f.nev}, ${f.tamado_proba.nev} ${szam(e.tamado && e.tamado.osszeg)}`;
    if (allas.siker === null) return `${o} (a DM dönt)`;
    return `${o} vs ${f.celertek}: ${allas.siker ? 'siker' : 'kudarc'}${allas.siker && f.mutatvany === 'mut_stay_aware' ? ' (+1 a következő próbára)' : ''}`;
  }
  const o = `${f.nev}: ${f.tamado_nev} ${szam(e.tamado && e.tamado.osszeg)}, ${f.cel_nev} ${szam(e.cel && e.cel.osszeg)}`;
  if (allas.holtverseny) return `${o}: teljes holtverseny, újra kell dobni`;
  const k = { mut_threaten: `${f.cel_nev} Megfélemlítve`, mut_taunt: `${f.cel_nev} Gúnyolva`, mut_disarm: `${f.cel_nev} Lefegyverezve` }[f.mutatvany] || 'siker';
  return `${o}: ${allas.nyert === 'tamado' ? k : `${f.cel_nev} ellenállt`}`;
}

// ---------------- Segédek ----------------

// A célpont Védekezése és Páncélértéke a csata állapotából (ertekek), a csata hatásaival. null, ha nem ismert.
function celVedekezes(cel) {
  if (!cel || !cel.ertekek || !Number.isFinite(Number(cel.ertekek.vedekezes))) return null;
  return C.vedekezes(cel, cel.ertekek.vedekezes);
}
const celPancel = (cel, m) => (cel && cel.ertekek && Number.isFinite(Number(cel.ertekek.pancelertek)) ? Number(cel.ertekek.pancelertek) : szam(m && m.pancel));
const celAtutoEllen = (cel) => !!(cel && cel.ertekek && cel.ertekek.atuto_ellen);

// Sebzés alkalmazása; a játékos szűrt nézetében az ismeretlen Egészségű célpontot nem érinti (azt a háttér számolja).
function sebez(x, id, v) {
  const r = C.resztvevo(x, id);
  if (!r || ismeretlenHp(r) || !(v > 0)) return;
  C.sebzesAlkalmazas(x, id, v);
}
function gyogyit(x, id, v, opciok) {
  const r = C.resztvevo(x, id);
  if (!r || ismeretlenHp(r) || !(v > 0)) return;
  C.gyogyitas(x, id, v, opciok);
}
const nevE = (cs, id) => { const r = C.resztvevo(cs, id); return r ? r.nev : '?'; };

// A támadás eredménye a csata állapotából: a háttér a saját Védekezés- és Páncélérték-adatából számol,
// a kliens beküldött találata csak akkor számít, ha a célpont értékei nem ismertek.
function tamadasEredmeny(cs, m) {
  const cel = C.resztvevo(cs, m.cel);
  const ved = celVedekezes(cel);
  const talalat = ved === null ? !!m.talalat : szam(m.osszeg) >= ved;
  const atuto = !!(m.tamadas && m.tamadas.atuto);
  const v1 = talalat ? C.sebzesSzamol({ osszeg: szam(m.sebzes), pancelertek: celPancel(cel, m), atuto, atuto_ellen: celAtutoEllen(cel), fel_pancel: !!m.fel_pancel }).vegso : 0;
  let talalat2 = false, v2 = 0;
  const cel2 = m.masodik && C.resztvevo(cs, m.masodik.cel);
  if (talalat && cel2) {
    const ved2 = celVedekezes(cel2);
    talalat2 = ved2 === null ? !!m.masodik.talalat : szam(m.osszeg) >= ved2;
    if (talalat2) v2 = C.sebzesSzamol({ osszeg: szam(m.masodik.sebzes), pancelertek: celPancel(cel2, m.masodik), atuto, atuto_ellen: celAtutoEllen(cel2), fel_pancel: !!m.fel_pancel }).vegso;
  }
  return { talalat, v1, talalat2, v2, ved };
}

// A célpont próbájának kimenete: { siker, sebzes } (a csökkentett sebzés hiánya sikernél nulla sebzést jelent).
function celpontProbaEredmeny(cs, f, osszeg) {
  const siker = szam(osszeg) >= szam(f.celertek);
  const nyers = siker ? (f.csokkentett === null || f.csokkentett === undefined ? 0 : szam(f.csokkentett)) : szam(f.teljes);
  const cel = C.resztvevo(cs, f.cel);
  const vegso = f.teljes === null || f.teljes === undefined ? 0
    : C.sebzesSzamol({ osszeg: nyers, pancelertek: celPancel(cel), atuto: !!f.atuto, atuto_ellen: celAtutoEllen(cel) }).vegso;
  return { siker, sebzes: vegso, van_sebzes: f.teljes !== null && f.teljes !== undefined };
}

// ---------------- Leírás és alkalmazás ----------------

function muveletLeiras(cs, m) {
  const ki = nevE(cs, m.r);
  switch (m.tipus) {
    case 'kezdemenyezes': return `${ki}: kezdeményezés ${szam(m.osszeg)}`;
    case 'cselekves': {
      if (m.szabad) return `${ki}: ${String(m.szabad.nev || '').trim()}`;
      const a = C.cselekvesAdat(m.kulcs);
      const rr = C.resztvevo(cs, m.r);
      const plusz = m.kulcs === 'mozgas' && C.vanFeltetel(rr, 'fekszik') ? ' (feláll)' : m.kulcs === 'keszenlet' && C.vanFeltetel(rr, 'lefegyverezve') ? ' (újra fegyver a kezében)' : '';
      return `${ki}: ${a ? a.nev : m.kulcs}${plusz}`;
    }
    case 'kovetkezo': return `${nevE(cs, cs.soron) || ki} köre véget ért`;
    case 'tamadas': {
      const e = tamadasEredmeny(cs, m);
      const mut = (m.mutatvanyok || []).length ? ` (${m.mutatvanyok.join(', ')})` : '';
      return e.talalat
        ? `${ki} → ${nevE(cs, m.cel)}: ${e.v1} sebzés${e.v2 ? `, ${nevE(cs, m.masodik.cel)}: ${e.v2}` : ''}${mut}`
        : `${ki} → ${nevE(cs, m.cel)}: nem talált`;
    }
    case 'gyogyitas': return szam(m.mennyi) > 0 ? `${ki} gyógyítja: ${nevE(cs, m.cel)} +${szam(m.mennyi)}` : `${ki} gyógyítása nem sikerült (${nevE(cs, m.cel)})`;
    case 'varazslat': {
      const v = (m.varazslat && m.varazslat.nev) || 'varázslat';
      if (!m.siker) return `${ki}: ${v} nem sikerült (${szam(m.mp)} MP)`;
      const celok = (m.celok || []).map((id) => nevE(cs, id)).join(', ');
      const mut = (m.mutatvanyok || []).length ? ` (${m.mutatvanyok.join(', ')})` : '';
      return `${ki}: ${v}${celok ? ' → ' + celok : ''}, ${szam(m.mp)} MP${m.proba && (m.celok || []).length ? ', a célpont próbája következik' : ''}${mut}`;
    }
    case 'celpont_proba': {
      const f = ((cs.fuggo) || []).find((x) => x.id === m.proba_id);
      if (!f) return 'Célpont próbája';
      const e = celpontProbaEredmeny(cs, f, m.osszeg);
      return `${f.cel_nev}: ${f.varazslat} ellen ${e.siker ? 'ellenállt' : 'nem állt ellen'} (${szam(m.osszeg)} vs ${f.celertek})${e.van_sebzes ? `, ${e.sebzes} sebzés` : ''}`;
    }
    case 'mutatvany_proba': {
      const f = ((cs.fuggo) || []).find((x) => x.id === m.proba_id);
      if (!f) return 'Mutatvány próbája';
      const masolat = { ...f, eredmeny: { ...(f.eredmeny || {}), [m.fel]: { osszeg: szam(m.osszeg), sarkany: szam(m.sarkany), tul: szam(m.tul) } } };
      const allas = mutatvanyProbaAllas(masolat);
      if (!allas.kesz) return `${m.fel === 'tamado' ? f.tamado_nev : f.cel_nev}: ${f.nev} próbája ${szam(m.osszeg)}, a másik fél dobására vár`;
      return mutatvanyProbaSzoveg(masolat, allas);
    }
    default: return '';
  }
}

// A művelet alkalmazása a csata másolatán (x-et módosítja). A leírás előre számolódik (muveletLeiras).
function muveletAlkalmazas(x, m) {
  const r = C.resztvevo(x, m.r);
  switch (m.tipus) {
    case 'kezdemenyezes':
      return C.kezdemenyezesBeallitas(x, m.r, { osszeg: m.osszeg, sarkany: m.sarkany, tul: m.tul, kockak: m.kockak, kezi: m.kezi });
    case 'cselekves': {
      if (m.szabad) return C.cselekvesRogzites(x, m.r, m.szabad.fajta || 'mellek', String(m.szabad.nev || '').trim().slice(0, 80));
      const a = C.cselekvesAdat(m.kulcs);
      if (!a) return x;
      C.cselekvesRogzites(x, m.r, a.fajta, a.nev);
      if (m.kulcs === 'vedekezes') C.hatasHozzaadas(x, m.r, { nev: 'Védekezés', cel: 'vedekezes', ertek: 2, lejar: 'sajat' });
      if (m.kulcs === 'celzas') C.hatasHozzaadas(x, m.r, { nev: 'Célzás', cel: 'tamadas', ertek: 1, lejar: 'kovetkezo_tamadas' });
      if (r && m.kulcs === 'mozgas' && C.vanFeltetel(r, 'fekszik')) r.feltetelek = r.feltetelek.filter((f) => f.kulcs !== 'fekszik');
      if (r && m.kulcs === 'keszenlet' && C.vanFeltetel(r, 'lefegyverezve')) r.feltetelek = r.feltetelek.filter((f) => f.kulcs !== 'lefegyverezve');
      return x;
    }
    case 'kovetkezo': return C.kovetkezo(x);
    case 'tamadas': {
      const e = tamadasEredmeny(x, m);
      const a = C.cselekvesAdat(m.cselekves) || C.cselekvesAdat('tamadas');
      C.cselekvesRogzites(x, m.r, a.fajta, a.nev);
      C.tamadasUtan(x, m.r);
      if (m.cselekves === 'mindent_bele') C.hatasHozzaadas(x, m.r, { nev: 'Mindent bele', cel: 'vedekezes', ertek: -1, lejar: 'sajat' });
      if (!e.talalat) return x;
      const cel = C.resztvevo(x, m.cel);
      if (m.kegyelem && cel && !ismeretlenHp(cel) && cel.egeszseg - e.v1 <= 0 && e.v1 > 0) {
        C.egeszsegBeallitas(x, m.cel, 1);
        C.feltetelHozzaadas(x, m.cel, { kulcs: 'eszmeletlen' });
      } else sebez(x, m.cel, e.v1);
      if (e.v2) sebez(x, m.masodik.cel, e.v2);
      const h = m.hatasok || {};
      if (h.fekszik) C.feltetelHozzaadas(x, m.cel, { kulcs: 'fekszik' });
      if (h.vedoallas) C.hatasHozzaadas(x, m.r, { nev: 'Védőállás', cel: 'vedekezes', ertek: 2, lejar: 'sajat' });
      if (h.atvetel) C.sorrendElere(x, m.r);
      if (h.villam) C.cselekvesFeloldas(x, m.r, szam(h.villam, 1));
      mutatvanyFuggok(x, m.mutatvany_probak, m.r, m.cel);
      return x;
    }
    case 'gyogyitas':
      C.cselekvesRogzites(x, m.r, 'fo', 'Gyógyítás');
      if (szam(m.mennyi) > 0) gyogyit(x, m.cel, szam(m.mennyi), { heal: true });
      return x;
    case 'varazslat': {
      const nev = (m.varazslat && m.varazslat.nev) || 'Varázslat';
      C.cselekvesRogzites(x, m.r, m.fajta || 'fo', 'Varázslat: ' + nev);
      if (r && r.magiapont !== null && r.magiapont !== undefined) C.magiapontBeallitas(x, m.r, r.magiapont - szam(m.mp));
      C.probaBonuszFogyasztas(x, m.r);
      if (!m.siker) return x;
      const h = m.hatasok || {};
      if (h.vedopajzs) C.hatasHozzaadas(x, m.r, { nev: 'Mágikus védőpajzs', cel: 'vedekezes', ertek: 2, lejar: 'sajat' });
      if (h.felelmetes) C.hatasHozzaadas(x, m.r, { nev: FELELMETES, cel: 'felelmetes', ertek: szam(h.felelmetes), lejar: 'sajat' });
      mutatvanyFuggok(x, m.mutatvany_probak, m.r, (m.celok || [])[0]);
      const celok = (m.celok || []).filter((id) => C.resztvevo(x, id));
      if (szam(m.gyogyitas) > 0) celok.forEach((id) => gyogyit(x, id, szam(m.gyogyitas)));
      const extra = (id) => (m.extra && m.extra.cel === id ? szam(m.extra.sebzes) : 0);
      if (m.proba) {
        x.fuggo = (x.fuggo || []).concat(celok.map((id) => {
          const c = C.resztvevo(x, id);
          const s = m.sebzes || null;
          return {
            id: ujId('p'), varazslo: m.r, varazslo_nev: r ? r.nev : '', varazslat: nev, cel: id, cel_nev: c.nev,
            tul: m.proba.tul, fokuszok: m.proba.fokuszok || [], proba_nev: m.proba.nev || '', celertek: szam(m.proba.celertek, 10),
            teljes: s ? szam(s.teljes) + extra(id) : null,
            csokkentett: s && s.csokkentett !== null && s.csokkentett !== undefined ? szam(s.csokkentett) + (szam(s.csokkentett) > 0 ? extra(id) : 0) : null,
            atuto: !!(s && s.atuto), kor: x.kor
          };
        }));
      } else if (m.sebzes) {
        celok.forEach((id) => {
          const c = C.resztvevo(x, id);
          const v = C.sebzesSzamol({ osszeg: szam(m.sebzes.teljes) + extra(id), pancelertek: celPancel(c), atuto: !!m.sebzes.atuto, atuto_ellen: celAtutoEllen(c) }).vegso;
          sebez(x, id, v);
        });
      }
      return x;
    }
    case 'celpont_proba': {
      const f = (x.fuggo || []).find((y) => y.id === m.proba_id);
      if (!f) return x;
      const e = celpontProbaEredmeny(x, f, m.osszeg);
      x.fuggo = x.fuggo.filter((y) => y.id !== f.id);
      C.probaBonuszFogyasztas(x, f.cel);
      if (e.sebzes) sebez(x, f.cel, e.sebzes);
      return x;
    }
    case 'mutatvany_proba': {
      const f = (x.fuggo || []).find((y) => y.id === m.proba_id);
      if (!f) return x;
      f.eredmeny = { ...(f.eredmeny || {}), [m.fel]: { osszeg: szam(m.osszeg), sarkany: szam(m.sarkany), tul: szam(m.tul) } };
      C.probaBonuszFogyasztas(x, m.fel === 'tamado' ? f.tamado : f.cel);
      const allas = mutatvanyProbaAllas(f);
      if (!allas.kesz) return x;
      if (allas.holtverseny) { f.eredmeny = { tamado: null, cel: null }; return x; }
      x.fuggo = x.fuggo.filter((y) => y.id !== f.id);
      mutatvanyKovetkezmeny(x, f, allas);
      return x;
    }
    default: return x;
  }
}

// Egy művelet lépésként (visszavonható, kulccsal). opciok: { szerzo } (lásd csata.js lepes).
function muveletLepes(cs, m, kulcs, opciok = {}) {
  if (m.tipus === 'visszavonas') return C.visszavon(cs, kulcs);
  return C.lepes(cs, muveletLeiras(cs, m), (x) => muveletAlkalmazas(x, m), kulcs, opciok);
}

// ---------------- Ellenőrzés (a játékos lépése a háttérben) ----------------

// Mit tehet a játékos: csak az általa irányított résztvevőkért (iranyitott), a saját körében, a cselekvésszámláló
// szerint; a kezdeményezést a kezdeményezés szakaszában; a célpont próbáját, ha ő irányítja a célpontot.
// Visszaad: a hiba szövege, vagy null. dm: a DM bármit megtehet.
function muveletEllenorzes(cs, m, { iranyitott = [], dm = false, szerzo = '' } = {}) {
  if (!m || typeof m !== 'object' || MUVELET_TIPUSOK.indexOf(m.tipus) < 0) return 'Ismeretlen lépés.';
  if (!cs || cs.allapot === 'lezart') return 'A csata lezárult.';
  if (m.tipus === 'visszavonas') {
    const v = cs.visszavonas || [];
    const utolso = v[v.length - 1];
    if (!utolso) return 'Nincs visszavonható lépés.';
    if (!dm && (!utolso.szerzo || utolso.szerzo !== szerzo)) return 'Csak a saját utolsó lépésedet vonhatod vissza.';
    return null;
  }
  if (m.tipus === 'mutatvany_proba') {
    const f = (cs.fuggo || []).find((x) => x.id === m.proba_id);
    if (!f || f.fajta !== 'mutatvany') return 'Ez a próba már lezárult.';
    if (m.fel !== 'tamado' && m.fel !== 'cel') return 'Hibás oldal.';
    if (m.fel === 'cel' && f.tipus !== 'ellen') return 'Ennél a próbánál a célpont nem dob.';
    if (f.eredmeny && f.eredmeny[m.fel]) return 'Ezt az oldalt már dobták.';
    if (!dm && iranyitott.indexOf(f[m.fel]) < 0) return 'Ezt a próbát az irányítója dobja.';
    return null;
  }
  if (m.tipus === 'celpont_proba') {
    const f = (cs.fuggo || []).find((x) => x.id === m.proba_id);
    if (!f || f.fajta === 'mutatvany') return 'Ez a próba már lezárult.';
    if (!dm && iranyitott.indexOf(f.cel) < 0) return 'Ezt a próbát a célpont irányítója dobja.';
    return null;
  }
  if (dm) return null;
  const r = C.resztvevo(cs, m.r);
  if (!r || r.rejtett) return 'Nincs ilyen résztvevő.';
  if (iranyitott.indexOf(r.id) < 0) return 'Ezt a résztvevőt nem te irányítod.';
  if (m.tipus === 'kezdemenyezes') {
    if (cs.allapot !== 'kezdemenyezes') return 'A kezdeményezést már lezárták; a DM rendezi.';
    return null;
  }
  if (cs.allapot !== 'fut') return 'A csata még nem indult el.';
  if (cs.soron !== r.id) return 'Nem te következel.';
  if (m.tipus === 'kovetkezo') return null;
  if (r.allapot !== 'aktiv') return 'Ez a résztvevő most nem cselekedhet.';
  const fajta = m.tipus === 'cselekves' ? (m.szabad ? (m.szabad.fajta || 'mellek') : ((C.cselekvesAdat(m.kulcs) || {}).fajta || 'fo'))
    : m.tipus === 'varazslat' ? (m.fajta || 'fo') : m.tipus === 'tamadas' ? ((C.cselekvesAdat(m.cselekves) || { fajta: 'fo' }).fajta) : 'fo';
  if (m.tipus === 'cselekves' && !m.szabad && !C.cselekvesAdat(m.kulcs)) return 'Ismeretlen cselekvés.';
  if (m.tipus === 'cselekves' && m.kulcs === 'futas' && C.vanFeltetel(r, 'fekszik')) return 'Fekve nem lehet futni: előbb Mozgással felállni.';
  if (!C.cselekvesEngedett(r, fajta)) return 'Ebben a körben ez a cselekvés már elfogyott.';
  const cel = (id) => { const c = C.resztvevo(cs, id); return c && !c.rejtett; };
  if (m.tipus === 'tamadas') {
    if (!cel(m.cel)) return 'Nincs ilyen célpont.';
    if (m.masodik && !cel(m.masodik.cel)) return 'Nincs ilyen második célpont.';
  }
  if (m.tipus === 'gyogyitas') {
    const c = C.resztvevo(cs, m.cel);
    if (!cel(m.cel)) return 'Nincs ilyen célpont.';
    if (szam(m.mennyi) > 0 && c.gyogyithato === false) return `${c.nev} már kapott Gyógyítást, és azóta nem sérült meg.`;
  }
  if (m.tipus === 'varazslat') {
    if (!(m.celok || []).every(cel)) return 'Nincs ilyen célpont.';
    if (szam(m.mp) < 0) return 'Hibás Mágiapont.';
    if (r.magiapont !== null && r.magiapont !== undefined && szam(m.mp) > r.magiapont) return 'Nincs elég Mágiapont.';
  }
  return null;
}

// ---------------- A játékosnak szűrt csata ----------------

// A játékos (vagy mesterjátékos) nézete: a rejtett résztvevők és a DM naplósorai nélkül, más oldal Egészsége a kampány
// beállítása szerint (pontos, leíró, rejtett), a visszavonási adatok helyett csak az utolsó lépés neve.
// A célpontok Védekezése és Páncélértéke megérkezik (a találatot a játékos eszköze számolja), de a felület csak akkor
// mutatja a számot, ha a kampányban a Célérték nem rejtett (vedekezes_rejtett).
// iranyitott: a néző által irányított résztvevők azonosítói; szerzo: a néző azonosítója.
function jatekosNezet(cs, { beallitas = {}, iranyitott = [], szerzo = '' } = {}) {
  const rejtett = new Set((cs.resztvevok || []).filter((r) => r.rejtett).map((r) => r.id));
  const nezoOldalak = (cs.resztvevok || []).filter((r) => iranyitott.indexOf(r.id) >= 0).map((r) => r.oldal);
  const resztvevok = (cs.resztvevok || []).filter((r) => !r.rejtett).map((r) => {
    const o = masol(r);
    o.iranyithato = iranyitott.indexOf(r.id) >= 0;
    const lath = egeszsegLathatosag(beallitas, { nezoOldalak, celOldal: r.oldal });
    if (lath !== 'pontos') {
      o.egeszseg_szoveg = lath === 'rejtett' ? '?' : leiroEgeszseg(r.egeszseg, r.egeszseg_max);
      o.egeszseg = null;
      o.egeszseg_max = null;
      o.magiapont = null;
      o.haldoklas_kor = null;
      o.ertekek = r.ertekek ? { vedekezes: r.ertekek.vedekezes, pancelertek: r.ertekek.pancelertek, atuto_ellen: !!r.ertekek.atuto_ellen } : null;
    }
    return o;
  });
  const v = cs.visszavonas || [];
  const utolso = v[v.length - 1];
  return {
    v: cs.v, allapot: cs.allapot, kor: cs.kor, soron: rejtett.has(cs.soron) ? null : cs.soron,
    sorrend: (cs.sorrend || []).filter((id) => !rejtett.has(id)), leptek: (cs.leptek || []).filter((id) => !rejtett.has(id)),
    oldalak: cs.oldalak, viszonyok: cs.viszonyok, csoportok: cs.csoportok, resztvevok,
    naplo: (cs.naplo || []).filter((n) => !n.dm), kulcsok: cs.kulcsok || [],
    fuggo: (cs.fuggo || []).filter((f) => !rejtett.has(f.cel) && !rejtett.has(f.varazslo) && !rejtett.has(f.tamado)),
    utolso_lepes: utolso ? { leiras: utolso.leiras || '', sajat: !!szerzo && utolso.szerzo === szerzo } : null,
    vedekezes_rejtett: !(beallitas && beallitas.celertek_rejtett === false),
    jatekos: true
  };
}

// ---------------- Lezárás ----------------

// A csata összecsapás-alakja (a nehézségbecsléshez és az XP-javaslathoz, osszecsapas.js nehezsegBecsles).
function osszecsapasCsatabol(cs) {
  return {
    leiras: '', helyszin: '', terep: '', megjegyzes: '', oldalak: cs.oldalak || [], viszonyok: cs.viszonyok || {}, csoportok: [],
    resztvevok: (cs.resztvevok || []).map((r) => ({ id: r.id, forras: { ...r.forras }, nev: r.nev, db: 1, oldal: r.oldal, csoport: '', fontos: !!r.fontos, rejtett: false, megjegyzes: '' }))
  };
}

// A becsült nehézség XP-besorolása (karakter/xp.js XP_TALALKOZAS kulcsai).
const XP_BESOROLAS = { 'Könnyű': 'konnyu', 'Átlagos': 'kozepes', 'Nehéz': 'nehez', 'Nagyon nehéz': 'nehez' };

// A csata karakterei (az XP-kiosztáshoz): a nem rejtett játékos karakterek, azonosítónként egyszer.
function csataKarakterei(cs) {
  const ki = [];
  (cs.resztvevok || []).forEach((r) => { if (r.forras.tipus === 'karakter' && !ki.some((x) => x.id === r.forras.id)) ki.push({ id: r.forras.id, nev: r.nev, allapot: r.allapot }); });
  return ki;
}

// Az NJK-tár elemeinek állapota a csata végén (a háttér visszaírja): [{ njk_id, nev, egeszseg, magiapont, allapot, feltetelek }].
// Ha egy NJK több példányban szerepelt, az utolsó példány számít.
function njkAllapotok(cs) {
  const m = {};
  (cs.resztvevok || []).forEach((r) => {
    if (r.forras.tipus !== 'njk') return;
    m[r.forras.id] = { njk_id: r.forras.id, nev: r.nev, egeszseg: r.egeszseg, magiapont: r.magiapont === undefined ? null : r.magiapont,
      allapot: r.allapot, feltetelek: (r.feltetelek || []).map((f) => f.nev) };
  });
  return Object.keys(m).map((k) => m[k]);
}

return { MUVELET_TIPUSOK, varazslatKifejezes, varazslatAdat, varazslatGyogyitasKocka, varazsMutatvanyHatasok, MUTATVANY_PROBAK, mutatvanyProbak, FELELMETES, mutatvanyProbaAllas, celVedekezes, tamadasEredmeny, celpontProbaEredmeny, muveletLeiras, muveletAlkalmazas, muveletLepes, muveletEllenorzes, jatekosNezet, osszecsapasCsatabol, XP_BESOROLAS, csataKarakterei, njkAllapotok };
})();

const CsataMotor_ = Object.assign({}, _m_osszecsapas, _m_csata, _m_csatamuvelet);

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
    'share.update':            { fn: megosztasModositasa_, szerep: 'dm' },
    'share.seen':              { fn: megosztasLatta_ },
    'share.image.add':         { fn: megosztasKepFeltoltese_, szerep: 'dm' },
    'npc.list':                { fn: njkLista_, szerep: 'dm' },
    'npc.get':                 { fn: njkLekerese_ },
    'npc.save':                { fn: njkMentese_, szerep: 'dm' },
    'npc.archive':             { fn: njkArchivalasa_, szerep: 'dm' },
    'npc.delete':              { fn: njkTorlese_, szerep: 'dm' },
    'npc.image.set':           { fn: njkKepBeallitasa_, szerep: 'dm' },
    'npc.detach':              { fn: njkLevalasztasa_, szerep: 'dm' },
    'encounter.list':          { fn: osszecsapasLista_, szerep: 'dm' },
    'encounter.save':          { fn: osszecsapasMentese_, szerep: 'dm' },
    'encounter.archive':       { fn: osszecsapasArchivalasa_, szerep: 'dm' },
    'encounter.delete':        { fn: osszecsapasTorlese_, szerep: 'dm' },
    'combat.start':            { fn: csataInditasa_, szerep: 'dm' },
    'combat.act':              { fn: csataLepese_, szerep: 'dm' },
    'combat.player':           { fn: csataJatekosLepese_ },
    'combat.close':            { fn: csataLezarasa_, szerep: 'dm' },
    'combat.delete':           { fn: csataTorlese_, szerep: 'dm' },
    'campaign.frame.save':     { fn: keretMentese_, szerep: 'dm' },
    'prep.get':                { fn: elokeszitesLekerese_, szerep: 'dm' },
    'world.save':              { fn: vilagMentese_, szerep: 'dm' },
    'element.save':            { fn: elemMentese_, szerep: 'dm' },
    'element.archive':         { fn: elemArchivalasa_, szerep: 'dm' },
    'element.delete':          { fn: elemTorlese_, szerep: 'dm' },
    'element.detach':          { fn: elemLevalasztasa_, szerep: 'dm' },
    'element.promote':         { fn: elemEmelese_, szerep: 'dm' },
    'link.save':               { fn: kapcsolatMentese_, szerep: 'dm' },
    'link.delete':             { fn: kapcsolatTorlese_, szerep: 'dm' },
    'element.image.add':       { fn: elemKepFeltoltese_, szerep: 'dm' },
    'element.image.trash':     { fn: elemKepTorlese_, szerep: 'dm' }
    // 'ai.ask': kihasználatlan (a szabálybíró külön Claude projekt, lásd a 4. lépést)
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
// adat: { kampany_id, ismert?: a kliens verziója, teljes?: igaz }. Ha a teljes kérés és a verzió eltér az ismerttől,
// a válasz rögtön a kampány állapotát is hozza (state.get), így a változás egy hívással megérkezik.
function allapotFigyeles_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  const verzio = kampanyVerzio_(a.kampany_id);
  if (a.teljes && a.ismert !== undefined && a.ismert !== null && Number(a.ismert) !== Number(verzio)) {
    return { verzio: verzio, allapot: allapotLekerese_({ kampany_id: a.kampany_id }, felh) };
  }
  return { verzio: verzio };
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
  elemKepekEngedese_(felh, engedett);
  megosztasKepekEngedese_(felh, k, engedett);
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

// ---- Szintek és öröklés (5.5, Kampányépítő 5. fejezet) ----
// Szint: sablon (adat.sablon), világ (vilag_id), szabad (a többi, kampányokhoz rendelhető). Az NJK épülhet egy másikra
// (alap_id). Az öröklés materializált: a sor mindig a teljes adatot tárolja, az adat.felulirt pedig a saját mezőket.
// Mentéskor a háttér kiszámolja a felülírásokat (az alaptól eltérő mezők), az alap módosításakor a rá épülőket frissíti.
// A mezőlista azonos a web/js/kampany/szereplo.js OROKOLHETO listájával (a teszt összeveti).
const NJK_SZEREPLO_MEZOK = ['szerepek', 'szerep_jegyzet', 'ellenpolus_id', 'epitesi_mod', 'epites_jegyzet', 'cel', 'indok', 'vonas',
  'arnyalatok', 'hang', 'hibak', 'elet', 'gyerekkor', 'ma', 'kapcsolat_jegyzet', 'rejtett', 'kulcspontok', 'monologus', 'kerdesek',
  'fejlodes_terv', 'valtozasok'];
const NJK_OROKOLHETO = ['nev', 'fajta', 'fenyegetes', 'alap_szorny', 'adat.statblokk', 'adat.erosites', 'adat.kezi',
  'adat.szerep.koncepcio', 'adat.szerep.megjelenes', 'adat.szerep.motivacio', 'adat.szerep.nyilvanos', 'adat.szerep.titkok',
  'adat.szerep.kapcsolatok', 'adat.szerep.dm_jegyzet', 'adat.szerep.feladatok'].concat(NJK_SZEREPLO_MEZOK.map(function (m) { return 'adat.szereplo.' + m; }));
const NJK_MAX_LANC = 4;

function njkSablon_(n) { return !!njkAdat_(n).sablon; }
function njkSzint_(n) { return njkSablon_(n) ? 'sablon' : n.vilag_id ? 'vilag' : 'szabad'; }

function njkUt_(n, ut) {
  let x = n;
  const r = ut.split('.');
  for (let i = 0; i < r.length; i++) { if (!x || typeof x !== 'object') return undefined; x = x[r[i]]; }
  return x;
}
function njkUtBeallit_(n, ut, ertek) {
  const r = ut.split('.');
  let x = n;
  for (let i = 0; i < r.length - 1; i++) { if (!x[r[i]] || typeof x[r[i]] !== 'object') x[r[i]] = {}; x = x[r[i]]; }
  if (ertek === undefined) delete x[r[r.length - 1]]; else x[r[r.length - 1]] = JSON.parse(JSON.stringify(ertek));
}
function njkUres_(x) {
  return x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length) ||
    (typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length);
}
function njkAzonos_(a, b) { return (njkUres_(a) && njkUres_(b)) || JSON.stringify(a) === JSON.stringify(b); }

// A felülírások (az alaptól eltérő mezők), és az örökölt mezők beírása az alapból.
function njkFelulirasok_(n, alap) {
  return NJK_OROKOLHETO.filter(function (ut) { return !njkAzonos_(njkUt_(n, ut), njkUt_(alap, ut)); });
}
function njkFeloldas_(n, alap, felulirt) {
  NJK_OROKOLHETO.forEach(function (ut) { if (felulirt.indexOf(ut) < 0) njkUtBeallit_(n, ut, njkUt_(alap, ut)); });
  n.adat = njkAdat_(n);
  n.adat.felulirt = felulirt.slice();
}

// Lehet-e az alapja (hibát dob, ha nem).
function njkAlapEllenorzes_(n, alap, sorok) {
  if (!alap) throw hiba_('nem_talalhato', 'Nincs ilyen alap NJK.');
  if (alap.id === n.id) throw hiba_('hibas_adat', 'Egy NJK nem épülhet önmagára.');
  const nsz = njkSzint_(n), asz = njkSzint_(alap);
  if (nsz === 'sablon' && asz !== 'sablon') throw hiba_('hibas_adat', 'Sablon csak sablonra épülhet.');
  if (nsz === 'vilag' && !(asz === 'sablon' || (asz === 'vilag' && alap.vilag_id === n.vilag_id))) {
    throw hiba_('hibas_adat', 'Világ-NJK csak sablonra vagy ugyanannak a világnak az NJK-jára épülhet. Előbb válaszd le.');
  }
  let x = alap, hossz = 1;
  const volt = {};
  while (x) {
    if (x.id === n.id || volt[x.id]) throw hiba_('hibas_adat', 'Körbe érne az öröklés.');
    volt[x.id] = true;
    hossz++;
    if (hossz > NJK_MAX_LANC) throw hiba_('hibas_adat', 'Legfeljebb ' + NJK_MAX_LANC + ' szint örökölhető egymásra.');
    const aid = x.alap_id;
    x = aid ? sorok.find(function (y) { return y.id === aid; }) : null;
  }
}

// Az alapjára épülő NJK-k frissítése (zárolás alatt): az örökölt mezők az új értéket kapják. A változott
// NJK-k kampányainak listáját adja vissza.
function njkPeldanyokFrissitese_(alap, sorok, felh, mely) {
  const kampanyok = [];
  if ((mely || 0) > NJK_MAX_LANC) return kampanyok;
  sorok.filter(function (x) { return x.alap_id === alap.id; }).forEach(function (p) {
    const elotte = JSON.stringify([p.nev, p.fajta, p.fenyegetes, p.alap_szorny, p.adat]);
    const felulirt = (Array.isArray(njkAdat_(p).felulirt) ? njkAdat_(p).felulirt : []).filter(function (ut) { return NJK_OROKOLHETO.indexOf(ut) >= 0; });
    p.adat = njkAdat_(p);
    njkFeloldas_(p, alap, felulirt);
    if (JSON.stringify([p.nev, p.fajta, p.fenyegetes, p.alap_szorny, p.adat]) === elotte) return;
    const regi = Number(p.verzio) || 0;
    p.verzio = regi + 1;
    p.modositva = most_();
    p.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', p);
    valtozasNaplozasa_(felh, 'njk.orokles', p.id, regi, p.verzio);
    njkKampanyai_(p).forEach(function (k) { kampanyok.push(k); });
    njkPeldanyokFrissitese_(p, sorok, felh, (mely || 0) + 1).forEach(function (k) { kampanyok.push(k); });
  });
  return kampanyok;
}

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
    kep: kep ? (kep.belyeg || kep.kep || '') : '', koncepcio: sz.koncepcio ? String(sz.koncepcio).slice(0, 160) : '',
    vilag_id: n.vilag_id || '', alap_id: n.alap_id || '', sablon: njkSablon_(n),
    szerepek: Array.isArray(objektum_(njkAdat_(n).szereplo).szerepek) ? njkAdat_(n).szereplo.szerepek : []
  };
}

// lathatosag: 'teljes' (DM: minden), 'kovetonek' (statblokk, titkok nélkül), 'nyilvanos' (név, kép, leírás)
function njkNezet_(n, lathatosag) {
  const o = njkOsszefoglalo_(n);
  o.lathatosag = lathatosag;
  const adat = njkAdat_(n);
  if (lathatosag === 'teljes') { o.adat = adat; return o; }
  const sz = adat.szerep || {};
  delete o.vilag_id; delete o.alap_id; delete o.sablon; delete o.szerepek;
  if (lathatosag === 'kovetonek') {
    const masolat = JSON.parse(JSON.stringify(adat));
    delete masolat.szereplo; delete masolat.felulirt; delete masolat.sablon;
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
    // a kép csak az npc.image.set művelettel változhat, a sablon jelölő csak létrehozáskor
    const regiKep = njkKep_(n);
    const sablon = njkSablon_(n);
    const adat = a.adat;
    adat.szerep = adat.szerep && typeof adat.szerep === 'object' ? adat.szerep : {};
    adat.szerep.kep = regiKep;
    if (sablon) adat.sablon = true; else delete adat.sablon;
    n.adat = adat;
  }
  if (a.vilag_id !== undefined) {
    const w = String(a.vilag_id || '');
    if (w && njkSablon_(n)) throw hiba_('hibas_adat', 'A sablon nem tartozik világhoz.');
    if (w && !epitoSorok_('Világok').some(function (x) { return x.id === w; })) throw hiba_('nem_talalhato', 'Nincs ilyen világ.');
    n.vilag_id = w;
  }
  if (a.alap_id !== undefined) n.alap_id = String(a.alap_id || '');
}

// Az öröklés rendezése mentés előtt: az alap ellenőrzése, a felülírások kiszámolása, a sablon korlátai.
function njkOroklesRendezese_(n, sorok) {
  n.adat = njkAdat_(n);
  if (njkSablon_(n) && (njkKampanyai_(n).length || n.kotodes)) throw hiba_('hibas_adat', 'A sablon nem rendelhető kampányhoz, és nincs gazdája.');
  if (!n.alap_id) { n.adat.felulirt = []; return; }
  const alap = sorok.find(function (x) { return x.id === n.alap_id; });
  njkAlapEllenorzes_(n, alap, sorok);
  njkFeloldas_(n, alap, njkFelulirasok_(n, alap));
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
        iranyito: '', adat: a.sablon ? { sablon: true } : {}, verzio: 1, modositva: most_(), modositotta: felh.n, aktiv: true,
        vilag_id: '', alap_id: '' };
      njkMezok_(n, Object.assign({ nev: a.nev || '' }, a), k);
      njkOroklesRendezese_(n, sorok);
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
    njkOroklesRendezese_(n, sorok);
    n.verzio = regi + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    const peldanyKampanyok = njkPeldanyokFrissitese_(n, sorok, felh, 0);
    const erintett = regiKampanyok.concat(njkKampanyai_(n), peldanyKampanyok).filter(function (x, i, t) { return t.indexOf(x) === i; });
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
    const sorok = njkSorok_();
    const n = njkKeresese_(a.id, sorok);
    if (igaz_(n.aktiv)) throw hiba_('hibas_adat', 'Csak archivált NJK törölhető. Előbb archiváld.');
    if (sorok.some(function (x) { return x.alap_id === n.id; })) throw hiba_('hibas_adat', 'Más NJK-k erre épülnek (alapjuk). Előbb válaszd le őket.');
    sorTorlese_('jatek', 'NJK-k', n._sor);
    kepekKukaba_(njkKep_(n));
    valtozasNaplozasa_(felh, 'njk.torol', n.id, n.verzio, '');
    return { torolve: n.id };
  });
}

// action: npc.detach (DM)   adat: { id, verzio? }   Leválasztás az alapjáról: a jelenlegi (teljes) adat megmarad.
function njkLevalasztasa_(a, felh) {
  return zarolva_(function () {
    const n = njkKeresese_(a.id);
    const regi = Number(n.verzio) || 0;
    if (a.verzio !== undefined && Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'Az NJK-t közben más is módosította.', { aktualis: njkNezet_(n, 'teljes') });
    }
    if (!n.alap_id) return { njk: njkNezet_(n, 'teljes'), verzio: regi };
    n.alap_id = '';
    n.adat = njkAdat_(n);
    n.adat.felulirt = [];
    n.verzio = regi + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    valtozasNaplozasa_(felh, 'njk.levalaszt', n.id, regi, n.verzio);
    return { njk: njkNezet_(n, 'teljes'), verzio: n.verzio };
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

// Csatamotor (3. lépés, 4–5. ütem): a csaták tárolása. A szabályok a felületen vannak (web/js/jatek/csata.js,
// csatamuvelet.js). A DM a lépés utáni teljes állapotot küldi (combat.act): itt csak verzió, dupla küldés szűrése,
// a játékos karakterek Egészségének és Mágiapontjának visszaírása és a kampány verziójának növelése történik.
// A játékos a lépését műveletként küldi (combat.player): a háttér a felület kódjából fordított CsataMotor_-ral
// (backend/Csatamotor.gs) ellenőrzi és alkalmazza a teljes csatán. A játékos szűrt csatát kap (jatekosNezet).
// Terv: claude/csata-terv.md, „Csataállapot”, „Játékos oldal” és „Háttér és teljesítmény”.

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

// A játékos karakterek Egészségének és Mágiapontjának visszaírása a karakter saját állapotába (zárolás alatt hívandó).
// ertekek: { karakter id: egeszseg } vagy { karakter id: { egeszseg, magiapont? } }. Csak a csata résztvevőiként
// szereplő karakterek írhatók.
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
    const e = ertekek[kid] && typeof ertekek[kid] === 'object' ? ertekek[kid] : { egeszseg: ertekek[kid] };
    const uj = Math.max(0, Math.round(Number(e.egeszseg) || 0));
    const mp = e.magiapont === undefined || e.magiapont === null || e.magiapont === '' ? null : Math.max(0, Math.round(Number(e.magiapont) || 0));
    // a régi szerkezetű (átvett) karakternél a felület az egeszseg.aktualis mezőből olvas
    const regiSzerk = !(Number(adat.sema) >= 1) && adat.egeszseg && typeof adat.egeszseg === 'object';
    const mpValt = mp !== null && Number(adat.allapot.magiapont) !== mp;
    if (adat.allapot.egeszseg === uj && (!regiSzerk || Number(adat.egeszseg.aktualis) === uj) && !mpValt) return;
    adat.allapot.egeszseg = uj;
    if (mp !== null) adat.allapot.magiapont = mp;
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

// action: combat.close (DM)   adat: { id, adat?, njk_visszairas? }   A csata lezárása; az összecsapása „lefutott” lesz.
// Az NJK-tár résztvevőinek Egészsége, Mágiapontja és feltételei az NJK állapotába íródnak (njk_visszairas: false
// esetén nem), és a szereplésük bejegyződik. Az XP-t a felület a meglévő character.xp művelettel osztja ki.
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
    const njkIrt = csataNjkVisszairasa_(c, a.njk_visszairas !== false, felh);
    kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.lezar', c.id, '', c.verzio);
    return { csata: csataNezet_(c), njkk: njkIrt };
  });
}

// Az NJK-k állapota és szereplése a lezáráskor (zárolás alatt hívandó). allapotIs: az Egészség, a Mágiapont és a
// feltételek visszaírása; a szereplés mindig bejegyződik. Visszaad: a módosított NJK-k azonosítói.
function csataNjkVisszairasa_(c, allapotIs, felh) {
  const lista = CsataMotor_.njkAllapotok(c.adat || {});
  if (!lista.length) return [];
  const sorok = njkSorok_();
  const irt = [];
  lista.forEach(function (e) {
    const n = sorok.find(function (x) { return x.id === e.njk_id; });
    if (!n) return;
    const adat = n.adat && typeof n.adat === 'object' ? n.adat : {};
    if (allapotIs) {
      adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
      adat.allapot.egeszseg = Math.max(0, Math.round(Number(e.egeszseg) || 0));
      if (e.magiapont !== null && e.magiapont !== undefined) adat.allapot.magiapont = Math.max(0, Math.round(Number(e.magiapont) || 0));
      adat.allapot.feltetelek = (e.feltetelek || []).slice(0, 20);
      if (e.allapot === 'halott') adat.allapot.halott = true;
    }
    adat.szereplesek = (Array.isArray(adat.szereplesek) ? adat.szereplesek : [])
      .concat([{ kampany_id: c.kampany_id, csata_id: c.id, cim: c.cim, idopont: most_(), kimenet: e.allapot }]).slice(-50);
    n.adat = adat;
    n.verzio = (Number(n.verzio) || 0) + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    irt.push(n.id);
  });
  return irt;
}

// A felhasználó által irányított résztvevők: a karakterek, amelyeket írhat (a mesterjátékos a kampány összes
// karakterét), és a követők, akikért dobhat (njkDobhat_). A DM mindenkit irányít.
function csataIranyitott_(adat, felh, k, njkk) {
  const resztvevok = (adat && adat.resztvevok) || [];
  if (felh.r === 'dm') return resztvevok.map(function (r) { return r.id; });
  const sorok = njkk || null;
  let njkLista = sorok;
  return resztvevok.filter(function (r) {
    if (!r.forras) return false;
    if (r.forras.tipus === 'karakter') {
      const kar = k.karakterek.find(function (c) { return c.id === r.forras.id; });
      return !!kar && karakterIrhato_(felh, kar, k);
    }
    if (r.forras.tipus === 'njk') {
      if (!njkLista) njkLista = njkSorok_();
      const n = njkLista.find(function (x) { return x.id === r.forras.id; });
      return !!n && njkDobhat_(felh, n, k);
    }
    return false;
  }).map(function (r) { return r.id; });
}

// A kampány folyamatban lévő csatái a játékosnak (state.get): szűrve, pillanatképek nélkül.
function kampanyCsataiJatekosnak_(kampany, felh, k) {
  const futo = csataSorok_().filter(function (c) { return c.kampany_id === kampany.id && c.allapot !== 'lezart'; });
  if (!futo.length) return [];
  const beallitas = kampanyBeallitasai_(kampany);
  const njkk = njkSorok_();
  return futo.map(function (c) { return csataJatekosNezete_(c, felh, k, beallitas, njkk); });
}

function csataJatekosNezete_(c, felh, k, beallitas, njkk) {
  const adat = c.adat && typeof c.adat === 'object' ? c.adat : { resztvevok: [] };
  const iranyitott = csataIranyitott_(adat, felh, k, njkk);
  return {
    id: c.id, kampany_id: c.kampany_id, cim: c.cim, allapot: c.allapot, kor: Number(c.kor) || 0, verzio: Number(c.verzio) || 0,
    adat: CsataMotor_.jatekosNezet(adat, { beallitas: beallitas, iranyitott: iranyitott, szerzo: felh.u })
  };
}

// action: combat.player   adat: { id, kulcs, muvelet }
// A játékos (vagy mesterjátékos, követő irányítója) lépése műveletként (web/js/jatek/csatamuvelet.js). A háttér
// ellenőrzi (csak a saját résztvevőiért, a saját körében), és a teljes csatán alkalmazza; verzió nem kell, mert
// a művelet mindig az aktuális állapotra épül. A válasz a játékosnak szűrt csata.
function csataJatekosLepese_(a, felh) {
  if (!a.id || !a.muvelet || typeof a.muvelet !== 'object') throw hiba_('hianyzo_adat', 'Hiányzik a csata vagy a lépés.');
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    const kampany = kampanyKeresese_(c.kampany_id, k);
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep || (szerep !== 'dm' && kampany.allapot === ARCHIVALT)) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    const beallitas = kampanyBeallitasai_(kampany);
    const njkk = njkSorok_();
    const kulcsok = c.adat && Array.isArray(c.adat.kulcsok) ? c.adat.kulcsok : [];
    if (a.kulcs && kulcsok.indexOf(a.kulcs) >= 0) return { csata: csataJatekosNezete_(c, felh, k, beallitas, njkk), ismetelt: true, kampany_verziok: {} };
    if (c.allapot === 'lezart') throw hiba_('hibas_adat', 'Ez a csata már lezárult.');
    const iranyitott = csataIranyitott_(c.adat, felh, k, njkk);
    const hiba = CsataMotor_.muveletEllenorzes(c.adat, a.muvelet, { iranyitott: iranyitott, dm: szerep === 'dm', szerzo: felh.u });
    if (hiba) throw hiba_('hibas_lepes', hiba);
    const elotte = c.adat;
    let uj;
    try {
      uj = CsataMotor_.muveletLepes(elotte, a.muvelet, a.kulcs || '', { szerzo: felh.u });
    } catch (e) {
      throw hiba_('hibas_lepes', String(e && e.message || e));
    }
    csataAdatEllenorzes_(uj);
    c.adat = uj;
    c.allapot = CSATA_ALLAPOTOK.indexOf(uj.allapot) >= 0 && uj.allapot !== 'lezart' ? uj.allapot : c.allapot;
    c.kor = Number(uj.kor) || 0;
    c.verzio = (Number(c.verzio) || 0) + 1;
    c.modositva = most_();
    c.modositotta = felh.n;
    sorFrissitese_('jatek', 'Csaták', c);
    const irt = csataKarakterek_(c, CsataMotor_.karakterValtozasok(elotte, uj), k, felh);
    const kv = kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    return { csata: csataJatekosNezete_(c, felh, k, beallitas, njkk), verzio: c.verzio, karakterek: irt, kampany_verziok: kv };
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
  // a kampánykeret játékosoknak szóló része (bemutatás, szintsáv, karakterkészítési ajánlások), lásd Epito.gs
  const jr = keretJatekosoknak_(keretAdat_(kampany));
  if (jr) o.keret_jatekosoknak = jr;
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
// a dobásnapló és a megosztások sorai is maradnak. A kampány összecsapásai, csatái, előkészítő elemei
// (Kampányépítő) és azok kapcsolatai törlődnek; a világ elemei és a sablonok megmaradnak.
function kampanyTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.id, k);
    if (kampany.allapot !== ARCHIVALT) throw hiba_('hibas_adat', 'Csak archivált kampány törölhető. Előbb archiváld.');
    const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; });
    sorokTorlese_('jatek', 'Kampánykarakterek', kapcsolatok.map(function (x) { return x._sor; }));
    kampanyOsszecsapasainakTorlese_(kampany.id);
    kampanyCsatainakTorlese_(kampany.id);
    kampanyElokeszitesTorlese_(kampany.id);
    kampanyMegosztasainakTorlese_(kampany.id);
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
  const megoszt = kampanyMegosztasai_(osszesMegosztas, kampany, szerep, sajatKarakterek, felh);

  const o = {
    verzio: Number(kampany.verzio) || 0,
    kampany: kampanyNezet_(kampany, szerep),
    karakterek: karakterek,
    dobasok: dobasok,
    probak: probak,
    megosztasok: megoszt.megosztasok,
    alanyok: megoszt.alanyok,
    njkk: njkk
  };
  // az előkészített összecsapások csak a DM-é
  if (szerep === 'dm') {
    o.osszecsapasok = kampanyOsszecsapasai_(kampany);
    o.csatak = kampanyCsatai_(kampany);
  } else {
    o.csatak = kampanyCsataiJatekosnak_(kampany, felh, k); // szűrve: rejtett résztvevők, DM naplósorai nélkül
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
// adat: { kampany_id, cimzett: 'mindenki' | karakter_id, tipus: 'njk' | 'kep' | 'level' | 'szoveg', cim, hivatkozas }
// A 6.2 kiosztható anyagai és alanyai (tipus 'anyag', 'alany'): Anyagok.gs.
function megosztasKuldese_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  if (a.tipus === 'anyag' || a.tipus === 'alany') return anyagKuldese_(a, felh);
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

// ===== Anyagok.gs =====

// Kampányjátszó 6.2: kiosztható anyagok (levél, irat, nyom, kép, képrészlet, részlet) és alanyaik.
// Minden a Megosztások lapon él: tipus 'anyag' (kiosztott anyag) vagy 'alany' (akiről vagy amiről a részletek szólnak).
// A régi, egycímzettes sorok (tipus 'njk', 'kep', 'level', 'szoveg') változatlanul működnek.
//
// Az anyag pillanatkép: a szöveg és a kivágott kép másolatként kerül a sorba, illetve a Drive „Kiosztások” mappájába,
// így ha a DM később átírja az előkészítő elemet, a játékos nem lát többet. A játékos az anyagot csak szűrve kapja meg
// (forrás és DM-adat nélkül), az alanynak pedig csak az ismert nevét (a valódit csak felfedés után).

const ANYAG_FAJTAK = ['level', 'nyom', 'kep', 'kepreszlet', 'reszlet'];
const ALANY_KATEGORIAK = ['szemely', 'hely', 'targy', 'egyeb'];
const LEVEL_MEZOK = ['felado', 'cimzett', 'alairas', 'pecset', 'kezires', 'allapot'];
const MAX_ANYAG_SZOVEG = 20000;
const MAX_ANYAG_KEP = 6;

function szoveg_(x, max) { return String(x === undefined || x === null ? '' : x).slice(0, max || 500); }

// A sor címzettjei listaként ('mindenki' vagy karakterazonosítók); a régi sorokban egyetlen cimzett mező van.
function megosztasCimzettjei_(m) {
  const l = Array.isArray(m.cimzettek) && m.cimzettek.length ? m.cimzettek : [m.cimzett || 'mindenki'];
  return l.map(String);
}

// Látja-e a sort a kérő. szerep: 'dm', 'mester', 'jatekos'; sajat: a kérő által írható karakterek a kampányban.
// Az alanysorokat a játékos nem így kapja (lásd alanyokJatekosnak_).
function megosztasLathato_(m, szerep, sajat) {
  if (szerep === 'dm') return true;
  if (m.tipus === 'alany') return false;
  if (m.allapot === 'visszavont') return false;
  if (szerep === 'mester') return true; // a mesterjátékos a kampány összes karakterét kezeli
  const c = megosztasCimzettjei_(m);
  return c.indexOf('mindenki') >= 0 || c.some(function (id) { return sajat.indexOf(id) >= 0; });
}

// Az anyag adatának tisztítása (csak az ismert mezők, hosszkorláttal).
function anyagAdatTisztit_(x) {
  const a = objektum_(x);
  const o = { fajta: ANYAG_FAJTAK.indexOf(a.fajta) >= 0 ? a.fajta : 'nyom', szoveg: szoveg_(a.szoveg, MAX_ANYAG_SZOVEG) };
  if (o.fajta === 'level') {
    const l = objektum_(a.level);
    o.level = {};
    LEVEL_MEZOK.forEach(function (m) { o.level[m] = szoveg_(l[m], 300); });
  }
  o.kepek = (Array.isArray(a.kepek) ? a.kepek : []).slice(0, MAX_ANYAG_KEP).filter(function (k) { return k && k.kep; }).map(function (k) {
    return { kep: szoveg_(k.kep, 100), belyeg: szoveg_(k.belyeg || k.kep, 100), cim: szoveg_(k.cim, 120),
      szel: Number(k.szel) || 0, mag: Number(k.mag) || 0, terkep: k.terkep === true };
  });
  const f = objektum_(a.forras);
  if (f.id || f.nev) o.forras = { tipus: szoveg_(f.tipus, 30), id: szoveg_(f.id, 60), nev: szoveg_(f.nev, 200), anyag: szoveg_(f.anyag, 60) };
  if (a.elozo) o.elozo = szoveg_(a.elozo, 60);
  return o;
}

function alanyAdatTisztit_(x, regi) {
  const a = objektum_(x);
  const r = objektum_(regi);
  const v = objektum_(a.valodi !== undefined ? a.valodi : r.valodi);
  return {
    kategoria: ALANY_KATEGORIAK.indexOf(a.kategoria) >= 0 ? a.kategoria : (r.kategoria || 'egyeb'),
    valodi: { tipus: szoveg_(v.tipus, 30), id: szoveg_(v.id, 60), nev: szoveg_(v.nev, 200) },
    felfedve: a.felfedve !== undefined ? a.felfedve === true : r.felfedve === true,
    osszekapcsolva: a.osszekapcsolva !== undefined ? szoveg_(a.osszekapcsolva, 60) : (r.osszekapcsolva || ''),
    jegyzet: a.jegyzet !== undefined ? szoveg_(a.jegyzet, 2000) : (r.jegyzet || '')
  };
}

// Eléri-e a láncot id-től indulva a keresett alany (körfigyeléshez).
function alanyLancban_(id, keresett, alanyok) {
  let most = id;
  for (let i = 0; i < 30 && most; i++) {
    if (most === keresett) return true;
    const a = alanyok.find(function (x) { return x.id === most; });
    most = a ? objektum_(a.adat).osszekapcsolva : '';
  }
  return !!most;
}

// A kampány karakterei (a címzettek ellenőrzéséhez).
function kampanyKarakterIdk_(kampanyId) {
  return sorok_('jatek', 'Kampánykarakterek').filter(function (x) { return x.kampany_id === kampanyId; })
    .map(function (x) { return x.karakter_id; });
}

function cimzettekTisztit_(lista, kampanyId) {
  const l = (Array.isArray(lista) ? lista : [lista || 'mindenki']).map(String).filter(Boolean);
  if (!l.length || l.indexOf('mindenki') >= 0) return ['mindenki'];
  const tagok = kampanyKarakterIdk_(kampanyId);
  const rossz = l.filter(function (id) { return tagok.indexOf(id) < 0; });
  if (rossz.length) throw hiba_('hibas_adat', 'A címzett nincs a kampányban.');
  return l.filter(function (id, i) { return l.indexOf(id) === i; }).slice(0, 20);
}

// share.send új formája: { kampany_id, tipus: 'anyag', id?, cim, cimzettek, adat, alany_id?, megmutat? }
// vagy alany: { kampany_id, tipus: 'alany', id?, cim (ismert név), adat: { kategoria, valodi: { tipus, id, nev } } }
function anyagKuldese_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    if (!kampanyok.some(function (x) { return x.id === a.kampany_id; })) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const sorok = sorok_('jatek', 'Megosztások');
    let id = ujId_('m');
    if (a.id && /^m_[a-z0-9]{6,16}$/.test(String(a.id))) {
      const meglevo = sorok.find(function (x) { return x.id === a.id; });
      if (meglevo) { delete meglevo._sor; return { megosztas: meglevo, mar_megvolt: true }; } // ismételt küldés (sorból)
      id = String(a.id);
    }
    const alany = a.tipus === 'alany';
    const cim = szoveg_(a.cim, 200).trim();
    if (alany && !cim) throw hiba_('hianyzo_adat', 'Add meg az alany ismert nevét.');
    let alanyId = '';
    if (!alany && a.alany_id) {
      const al = sorok.find(function (x) { return x.id === a.alany_id && x.tipus === 'alany' && x.kampany_id === a.kampany_id; });
      if (!al) throw hiba_('nem_talalhato', 'Nincs ilyen alany ebben a kampányban.');
      alanyId = al.id;
    }
    const cimzettek = alany ? [] : cimzettekTisztit_(a.cimzettek || a.cimzett, a.kampany_id);
    const adat = alany ? alanyAdatTisztit_(a.adat) : anyagAdatTisztit_(a.adat);
    const m = {
      id: id, kampany_id: a.kampany_id, cimzett: alany ? '' : (cimzettek[0] === 'mindenki' ? 'mindenki' : 'tobb'),
      tipus: alany ? 'alany' : 'anyag', cim: cim, hivatkozas: adat.forras ? adat.forras.id : (adat.valodi ? adat.valodi.id : ''),
      idopont: most_(), cimzettek: cimzettek, adat: adat, alany_id: alanyId, allapot: 'aktiv', latta: {},
      megmutat: !alany && a.megmutat ? most_() : '', letrehozta: felh.u, verzio: 1
    };
    sorHozzaadasa_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([a.kampany_id], kampanyok);
    return { megosztas: m };
  });
}

// action: share.update (DM)
// adat: { id, allapot?: 'aktiv' | 'visszavont', megmutat?: true, cim?, cimzettek?, alany_id?, adat? (alanynál: kategoria,
// valodi, felfedve, osszekapcsolva, jegyzet) }
function megosztasModositasa_(a, felh) {
  return zarolva_(function () {
    const sorok = sorok_('jatek', 'Megosztások');
    const m = sorok.find(function (x) { return x.id === a.id; });
    if (!m) throw hiba_('nem_talalhato', 'Nincs ilyen kiosztás.');
    if (a.allapot !== undefined) m.allapot = a.allapot === 'visszavont' ? 'visszavont' : 'aktiv';
    if (a.cim !== undefined) {
      const cim = szoveg_(a.cim, 200).trim();
      if (m.tipus === 'alany' && !cim) throw hiba_('hianyzo_adat', 'Az alany ismert neve nem lehet üres.');
      m.cim = cim;
    }
    if (m.tipus === 'alany') {
      if (a.adat !== undefined) {
        const uj = alanyAdatTisztit_(a.adat, m.adat);
        if (uj.osszekapcsolva) {
          const alanyok = sorok.filter(function (x) { return x.tipus === 'alany' && x.kampany_id === m.kampany_id; });
          if (!alanyok.some(function (x) { return x.id === uj.osszekapcsolva; })) throw hiba_('nem_talalhato', 'Nincs ilyen alany ebben a kampányban.');
          const proba = alanyok.map(function (x) { return x.id === m.id ? Object.assign({}, x, { adat: uj }) : x; });
          if (alanyLancban_(uj.osszekapcsolva, m.id, proba)) throw hiba_('hibas_adat', 'Az összekapcsolás körbe érne.');
        }
        m.adat = uj;
      }
    } else if (m.tipus === 'anyag') {
      if (a.megmutat) m.megmutat = most_();
      if (a.cimzettek !== undefined) {
        m.cimzettek = cimzettekTisztit_(a.cimzettek, m.kampany_id);
        m.cimzett = m.cimzettek[0] === 'mindenki' ? 'mindenki' : 'tobb';
      }
      if (a.alany_id !== undefined) {
        if (a.alany_id && !sorok.some(function (x) { return x.id === a.alany_id && x.tipus === 'alany' && x.kampany_id === m.kampany_id; })) {
          throw hiba_('nem_talalhato', 'Nincs ilyen alany ebben a kampányban.');
        }
        m.alany_id = a.alany_id || '';
      }
    } else {
      throw hiba_('hibas_adat', 'Ez a régi megosztás nem módosítható.');
    }
    m.verzio = (Number(m.verzio) || 1) + 1;
    sorFrissitese_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([m.kampany_id]);
    delete m._sor;
    return { megosztas: m };
  });
}

// action: share.seen   adat: { id }   A játékos megnyitotta az anyagot (a DM listájában „látta” jel).
function megosztasLatta_(a, felh) {
  if (felh.r === 'dm') return { latta: false };
  const k = kornyezet_();
  const m = sorok_('jatek', 'Megosztások').find(function (x) { return x.id === a.id; });
  if (!m || m.tipus !== 'anyag') throw hiba_('nem_talalhato', 'Nincs ilyen anyag.');
  const kampany = kampanyKeresese_(m.kampany_id, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (!szerep || !megosztasLathato_(m, szerep, sajatKampanyKarakterek_(felh, kampany, k))) throw hiba_('nincs_jogosultsag', 'Ezt az anyagot nem látod.');
  if (objektum_(m.latta)[felh.u]) return { latta: true };
  return zarolva_(function () {
    const friss = sorok_('jatek', 'Megosztások').find(function (x) { return x.id === a.id; });
    const latta = objektum_(friss.latta);
    if (latta[felh.u]) return { latta: true };
    latta[felh.u] = most_();
    cellaIrasa_('jatek', 'Megosztások', friss._sor, 'latta', latta);
    kampanyVerziokNovelese_([friss.kampany_id]);
    return { latta: true };
  });
}

// action: share.image.add (DM)   adat: { kep, belyeg } (base64 JPEG, a böngésző vágta és méretezte)
function megosztasKepFeltoltese_(a, felh) {
  if (!a.kep) throw hiba_('hianyzo_adat', 'Hiányzik a kép.');
  if (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET) throw hiba_('tul_nagy', 'A kép túl nagy.');
  const mappa = kiosztasMappa_();
  const azon = 'anyag_' + Utilities.getUuid().slice(0, 8);
  const fajl = function (b64, nev) {
    return mappa.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', azon + '_' + nev + '.jpg'));
  };
  const kep = fajl(a.kep, 'kep').getId();
  const belyeg = a.belyeg ? fajl(a.belyeg, 'belyeg').getId() : kep;
  return { kep: { kep: kep, belyeg: belyeg } };
}

function kiosztasMappa_() {
  const id = beallitas_('KIOSZTASMAPPA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* törölték: újra létrehozzuk */ }
  }
  const mappa = mappa_(DriveApp.getFolderById(beallitas_('MAPPA_ID')), 'Kiosztások');
  PropertiesService.getScriptProperties().setProperty('KIOSZTASMAPPA_ID', mappa.getId());
  CacheService.getScriptCache().put('prop_KIOSZTASMAPPA_ID', mappa.getId(), BEALLITAS_CACHE_MP);
  return mappa;
}

// A felhasználó által írható karakterek egy kampányban (a címzettség ellenőrzéséhez).
function sajatKampanyKarakterek_(felh, kampany, k) {
  return k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; }).map(function (x) {
    return k.karakterek.find(function (c) { return c.id === x.karakter_id; });
  }).filter(function (c) { return c && karakterIrhato_(felh, c, k); }).map(function (c) { return c.id; });
}

// Az anyag a játékos (és a mesterjátékos) nézetében: forrás, DM-adat és mások „látta” jele nélkül.
function anyagJatekosnak_(m, felh) {
  const a = objektum_(m.adat);
  const adat = { fajta: a.fajta, szoveg: a.szoveg || '', kepek: (a.kepek || []).map(function (k) {
    return { kep: k.kep, belyeg: k.belyeg, cim: k.cim, szel: k.szel, mag: k.mag, terkep: k.terkep };
  }) };
  if (a.level) adat.level = a.level;
  if (a.elozo) adat.elozo = a.elozo;
  return {
    id: m.id, kampany_id: m.kampany_id, tipus: 'anyag', cim: m.cim, idopont: m.idopont, cimzettek: megosztasCimzettjei_(m),
    alany_id: m.alany_id || '', megmutat: m.megmutat || '', adat: adat, latta_en: !!objektum_(m.latta)[felh.u]
  };
}

// A játékosnak csak azok az alanyok jutnak el, amelyekhez neki látható anyag tartozik (az összekapcsolás láncával
// együtt), és csak az ismert nevük; a valódi név a felfedés után.
function alanyokJatekosnak_(alanySorok, anyagok) {
  const kell = {};
  anyagok.forEach(function (m) {
    let most = m.alany_id;
    for (let i = 0; i < 20 && most && !kell[most]; i++) {
      kell[most] = true;
      const a = alanySorok.find(function (x) { return x.id === most; });
      most = a ? objektum_(a.adat).osszekapcsolva : '';
    }
  });
  return alanySorok.filter(function (a) { return kell[a.id]; }).map(function (a) {
    const d = objektum_(a.adat);
    const valodi = objektum_(d.valodi);
    return {
      id: a.id, tipus: 'alany', ismert_nev: a.cim, nev: d.felfedve && valodi.nev ? valodi.nev : a.cim, felfedve: d.felfedve === true,
      kategoria: d.kategoria || 'egyeb', osszekapcsolva: d.osszekapcsolva || ''
    };
  });
}

// A kampány állapotába: a kérő szerint szűrt megosztások és alanyok.
function kampanyMegosztasai_(osszes, kampany, szerep, sajat, felh) {
  const sajatSorok = osszes.filter(function (m) { return m.kampany_id === kampany.id; });
  if (szerep === 'dm') {
    return {
      megosztasok: sajatSorok.filter(function (m) { return m.tipus !== 'alany'; }).map(function (m) { const o = Object.assign({}, m); delete o._sor; return o; }),
      alanyok: sajatSorok.filter(function (m) { return m.tipus === 'alany'; }).map(function (m) { const o = Object.assign({}, m); delete o._sor; return o; })
    };
  }
  const lathato = sajatSorok.filter(function (m) { return megosztasLathato_(m, szerep, sajat); });
  const anyagok = lathato.filter(function (m) { return m.tipus === 'anyag'; });
  return {
    megosztasok: lathato.map(function (m) {
      if (m.tipus === 'anyag') return anyagJatekosnak_(m, felh);
      const o = Object.assign({}, m); delete o._sor; return o;
    }),
    alanyok: alanyokJatekosnak_(sajatSorok.filter(function (m) { return m.tipus === 'alany'; }), anyagok)
  };
}

// Az image.get engedélylistájához: a kiosztott anyagok képei annak, aki az anyagot látja (a DM mindet).
function megosztasKepekEngedese_(felh, k, engedett) {
  const szerepek = {};
  sorok_('jatek', 'Megosztások').forEach(function (m) {
    if (m.tipus !== 'anyag') return;
    const kepek = objektum_(m.adat).kepek;
    if (!Array.isArray(kepek) || !kepek.length) return;
    if (!(m.kampany_id in szerepek)) {
      const kampany = k.kampanyok.find(function (x) { return x.id === m.kampany_id; });
      const szerep = kampany && (felh.r === 'dm' || kampany.allapot !== ARCHIVALT) ? kampanySzerep_(felh, kampany, k) : null;
      szerepek[m.kampany_id] = szerep ? { szerep: szerep, sajat: sajatKampanyKarakterek_(felh, kampany, k) } : null;
    }
    const sz = szerepek[m.kampany_id];
    if (!sz || !megosztasLathato_(m, sz.szerep, sz.sajat)) return;
    kepek.forEach(function (x) {
      if (x && x.kep) engedett[x.kep] = true;
      if (x && x.belyeg) engedett[x.belyeg] = true;
    });
  });
}

// A kampány törlésekor a megosztásai is törlődnek (a Drive képei maradnak, a napi mentés miatt).
function kampanyMegosztasainakTorlese_(kampanyId) {
  const sorok = sorok_('jatek', 'Megosztások').filter(function (m) { return m.kampany_id === kampanyId; });
  sorokTorlese_('jatek', 'Megosztások', sorok.map(function (m) { return m._sor; }));
}

// ===== Epito.gs =====

// Kampányépítő (5. lépés, 5.1 alépés): világok, elemek (sablon, világelem, kampányelem), kapcsolatok és a
// kampánykeret. Terv: claude/kampanyepito-terv.md. Minden művelet csak a DM-é. Az öröklés, a fa, a kapcsolatok
// és a keret logikája a felületen van (web/js/kampany/), itt tárolás, verziózás és a szerkezet ellenőrzése.
// Az előkészítés nem növeli a kampány verzióját (a játékosok state.poll hívását nem terheli), kivéve ha a keret
// játékosoknak szóló része (bemutatás, szintsáv, karakterkészítési ajánlások) változik.

const ELEM_SZULOK = {
  kaland: [], resz: ['kaland', 'resz'], jelenet: ['kaland', 'resz'], helyszin: ['helyszin'], csoport: ['csoport'],
  jutalom: [], istenseg: ['istenseg'], keret: []
};
const KAPCSOLAT_TIPUSOK = ['kovetkezik', 'feltetele', 'itt_tortenik', 'szerepel', 'jutalma', 'resze', 'tagja', 'vezeti',
  'tulajdonosa', 'imadja', 'szovetsegese', 'ellensege', 'baratja', 'szeretoje', 'hazastarsa', 'testvere', 'unokatestvere',
  'szulo_gyermek', 'nagyszulo_unoka', 'nagybacsi_unokaocs', 'egyeb'];
const MAX_ELEM_MERET = 48000;
const ELEM_ID_MINTA = /^el_[a-z0-9]{6,24}$/;
const VILAG_ID_MINTA = /^w_[a-z0-9]{6,24}$/;
const LINK_ID_MINTA = /^ln_[a-z0-9]{6,24}$/;
const SZINT_RANG_ = { sablon: 0, vilag: 1, kampany: 2 };

function epitoSorok_(nev) {
  try { return sorok_('jatek', nev); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function objektum_(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }

function vilagNezet_(w) {
  return { id: w.id, nev: w.nev || '', adat: objektum_(w.adat), verzio: Number(w.verzio) || 0, modositva: w.modositva || '',
    modositotta: w.modositotta || '', aktiv: igaz_(w.aktiv) };
}

function elemNezet_(e) {
  return { id: e.id, tipus: e.tipus, nev: e.nev || '', vilag_id: e.vilag_id || '', kampany_id: e.kampany_id || '',
    alap_id: e.alap_id || '', szulo_id: e.szulo_id || '', sorrend: Number(e.sorrend) || 0, adat: objektum_(e.adat),
    verzio: Number(e.verzio) || 0, modositva: e.modositva || '', modositotta: e.modositotta || '', aktiv: igaz_(e.aktiv) };
}

function kapcsolatNezet_(k) {
  return { id: k.id, honnan: k.honnan, hova: k.hova, tipus: k.tipus, megjegyzes: k.megjegyzes || '',
    vilag_id: k.vilag_id || '', kampany_id: k.kampany_id || '', aktiv: igaz_(k.aktiv) };
}

function elemSzint_(e) { return e.kampany_id ? 'kampany' : e.vilag_id ? 'vilag' : 'sablon'; }

// ---- A kampánykeret ----

function keretAdat_(kampany) {
  const k = objektum_(kampany && kampany.keret);
  const o = {};
  Object.keys(k).forEach(function (m) { if (m !== '_verzio') o[m] = k[m]; });
  return o;
}
function keretVerzio_(kampany) { return Number(objektum_(kampany && kampany.keret)._verzio) || 0; }

// A keret játékosoknak szóló része (ugyanaz, mint a felületen: web/js/kampany/keret.js jatekosoknak). Üresen null.
const AJANLAS_KATEGORIAK_ = ['fajok', 'hatterek', 'osztalyok', 'fokuszok', 'talentumok', 'arkanumok', 'specializaciok'];
function keretJatekosoknak_(k) {
  const lista = function (x) { return Array.isArray(x) ? x.filter(function (y) { return y !== null && y !== undefined && y !== ''; }).map(String) : []; };
  const aj = objektum_(k.ajanlasok);
  const ajanlasok = {};
  AJANLAS_KATEGORIAK_.forEach(function (c) {
    const x = objektum_(aj[c]);
    const a1 = lista(x.ajanlott), k1 = lista(x.kizart);
    if (a1.length || k1.length) ajanlasok[c] = { ajanlott: a1, kizart: k1 };
  });
  const o = { bemutatas: String(objektum_(k.kalandra_hivas).jatekosoknak || ''), ajanlasok: ajanlasok, jegyzet: String(aj.jegyzet || '') };
  const sav = objektum_(k.szintsav);
  const kezdo = Number(sav.kezdo) || 1, zaro = Number(sav.zaro) || 20;
  if (kezdo !== 1 || zaro !== 20) o.szintsav = { kezdo: kezdo, zaro: zaro };
  if (!o.bemutatas && !Object.keys(ajanlasok).length && !o.jegyzet && !o.szintsav) return null;
  return o;
}

// action: campaign.frame.save (DM)   adat: { id: kampány, verzio, keret }
// A keret saját verziót kap (a JSON _verzio mezője). Ütközésnél a válasz az aktuális keretet hozza.
function keretMentese_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    const kampany = kampanyok.find(function (x) { return x.id === a.id; });
    if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const regiVerzio = keretVerzio_(kampany);
    const regi = keretAdat_(kampany);
    if (a.verzio !== undefined && a.verzio !== null && Number(a.verzio) !== regiVerzio) {
      throw hiba_('utkozes', 'A kampánykeretet közben más is módosította.', { aktualis: { keret: regi, verzio: regiVerzio } });
    }
    if (!a.keret || typeof a.keret !== 'object' || Array.isArray(a.keret)) throw hiba_('hibas_adat', 'Hibás kampánykeret.');
    if (JSON.stringify(a.keret).length > MAX_ELEM_MERET) throw hiba_('tul_nagy', 'A kampánykeret túl nagy egy cellához.');
    if (a.keret.vilag_id && !epitoSorok_('Világok').some(function (w) { return w.id === a.keret.vilag_id; })) {
      throw hiba_('hibas_adat', 'Nincs ilyen világ.');
    }
    const uj = {};
    Object.keys(a.keret).forEach(function (m) { if (m !== '_verzio') uj[m] = a.keret[m]; });
    const jatekosValtozott = JSON.stringify(keretJatekosoknak_(regi)) !== JSON.stringify(keretJatekosoknak_(uj));
    uj._verzio = regiVerzio + 1;
    kampany.keret = uj;
    sorFrissitese_('jatek', 'Kampányok', kampany);
    const kv = jatekosValtozott ? kampanyVerziokNovelese_([kampany.id], kampanyok) : {};
    valtozasNaplozasa_(felh, 'keret.ment', kampany.id, regiVerzio, regiVerzio + 1);
    const o = { verzio: regiVerzio + 1, kampany_verziok: kv };
    if (jatekosValtozott) o.kampany = kampanyNezet_(kampany, 'dm');
    return o;
  });
}

// ---- Lekérés ----

// action: prep.get (DM)   adat: { vilag_id?, kampany_id? }
// Egy hívásban: a világok listája, a sablonok, a világ elemei (kampánynál a keret világáé), a kampány elemei,
// a hozzájuk tartozó kapcsolatok, és kampánynál a keret a verziójával. Az elemek alapjai és szülei mindig
// bekerülnek (a lánc és a fa teljes legyen).
function elokeszitesLekerese_(a) {
  let vilagId = a.vilag_id || '';
  let kampany = null;
  if (a.kampany_id) {
    kampany = kampanyKeresese_(a.kampany_id, { kampanyok: sorok_('jatek', 'Kampányok') });
    vilagId = keretAdat_(kampany).vilag_id || '';
  }
  const kell = function (x) {
    if (!x.vilag_id && !x.kampany_id) return true;
    if (vilagId && x.vilag_id === vilagId) return true;
    return !!kampany && x.kampany_id === kampany.id;
  };
  // a kiválasztott elemek alapjai és szülei is jönnek (például ha a kampány egy másik világ elemére épül)
  const mind = epitoSorok_('Elemek');
  const benne = {};
  mind.forEach(function (e) { if (kell(e)) benne[e.id] = true; });
  let valtozott = true, kor = 0;
  while (valtozott && kor++ < 10) {
    valtozott = false;
    mind.forEach(function (e) {
      if (!benne[e.id]) return;
      [e.alap_id, e.szulo_id].forEach(function (r) { if (r && !benne[r]) { benne[r] = true; valtozott = true; } });
    });
  }
  const o = {
    vilag_id: vilagId,
    vilagok: epitoSorok_('Világok').map(vilagNezet_),
    elemek: mind.filter(function (e) { return benne[e.id]; }).map(elemNezet_),
    kapcsolatok: epitoSorok_('Kapcsolatok').filter(kell).map(kapcsolatNezet_)
  };
  if (kampany) o.keret = { kampany_id: kampany.id, keret: keretAdat_(kampany), verzio: keretVerzio_(kampany) };
  return o;
}

// ---- Világ ----

// action: world.save (DM)   adat: { id, uj?, verzio?, nev?, adat?, aktiv? }
// Új világnál az azonosítót a felület adja (w_…), így a mentés optimista lehet; az ismételt küldés nem hoz létre újat.
function vilagMentese_(a, felh) {
  return zarolva_(function () {
    const vilagok = epitoSorok_('Világok');
    let w = vilagok.find(function (x) { return x.id === a.id; });
    if (a.uj) {
      if (w) return { vilag: vilagNezet_(w), verzio: Number(w.verzio) || 0 };
      if (!VILAG_ID_MINTA.test(String(a.id || ''))) throw hiba_('hibas_adat', 'Hibás világazonosító.');
      w = { id: a.id, nev: '', adat: {}, verzio: 0, aktiv: true };
    } else {
      if (!w) throw hiba_('nem_talalhato', 'Nincs ilyen világ.');
      if (a.verzio !== undefined && Number(a.verzio) !== (Number(w.verzio) || 0)) {
        throw hiba_('utkozes', 'A világot közben más is módosította.', { aktualis: vilagNezet_(w) });
      }
    }
    if (a.nev !== undefined) w.nev = String(a.nev || '').trim().slice(0, 120);
    if (a.adat !== undefined) {
      if (!a.adat || typeof a.adat !== 'object' || Array.isArray(a.adat)) throw hiba_('hibas_adat', 'Hibás világadat.');
      if (JSON.stringify(a.adat).length > MAX_ELEM_MERET) throw hiba_('tul_nagy', 'A világ adatai túl nagyok egy cellához.');
      w.adat = a.adat;
    }
    if (a.aktiv !== undefined) w.aktiv = !!a.aktiv;
    if (!w.nev) throw hiba_('hianyzo_adat', 'Adj nevet a világnak.');
    const regi = Number(w.verzio) || 0;
    w.verzio = regi + 1;
    w.modositva = most_();
    w.modositotta = felh.n;
    if (a.uj) sorHozzaadasa_('jatek', 'Világok', w); else sorFrissitese_('jatek', 'Világok', w);
    valtozasNaplozasa_(felh, a.uj ? 'vilag.letrehoz' : 'vilag.ment', w.id, regi, w.verzio);
    return { vilag: vilagNezet_(w), verzio: w.verzio };
  });
}

// ---- Elemek ----

function elemKeresese_(id, elemek) {
  const e = elemek.find(function (x) { return x.id === id; });
  if (!e) throw hiba_('nem_talalhato', 'Nincs ilyen elem.');
  return e;
}

// A szerkezet ellenőrzése (ugyanaz a szabály, mint a felületen: web/js/kampany/elem.js ellenoriz).
function elemEllenorzes_(e, elemek, kampanyok, vilagok) {
  if (!ELEM_SZULOK.hasOwnProperty(e.tipus)) throw hiba_('hibas_adat', 'Ismeretlen elemtípus.');
  if (e.vilag_id && e.kampany_id) throw hiba_('hibas_adat', 'Egy elem vagy világhoz, vagy kampányhoz tartozik.');
  if (e.tipus === 'keret' && (e.vilag_id || e.kampany_id)) throw hiba_('hibas_adat', 'A kampánykeret elemként csak sablon lehet.');
  if (e.vilag_id && !vilagok.some(function (w) { return w.id === e.vilag_id; })) throw hiba_('hibas_adat', 'Nincs ilyen világ.');
  if (e.kampany_id && !kampanyok.some(function (k) { return k.id === e.kampany_id; })) throw hiba_('hibas_adat', 'Nincs ilyen kampány.');
  if (e.alap_id) {
    const al = elemek.find(function (x) { return x.id === e.alap_id; });
    if (!al) throw hiba_('hibas_adat', 'Az alap elem nem található.');
    if (al.tipus !== e.tipus || al.id === e.id || SZINT_RANG_[elemSzint_(al)] >= SZINT_RANG_[elemSzint_(e)]) {
      throw hiba_('hibas_adat', 'Az alap csak azonos típusú, magasabb szintű elem lehet.');
    }
  }
  if (e.szulo_id) {
    const sz = elemek.find(function (x) { return x.id === e.szulo_id; });
    if (!sz) throw hiba_('hibas_adat', 'A szülő elem nem található.');
    if (ELEM_SZULOK[e.tipus].indexOf(sz.tipus) < 0) throw hiba_('hibas_adat', 'Ez az elem nem kerülhet ez alá.');
    const se = elemSzint_(e), ss = elemSzint_(sz);
    const illik = se === 'sablon' ? ss === 'sablon'
      : se === 'vilag' ? ss === 'vilag' && sz.vilag_id === e.vilag_id
      : ss === 'vilag' || (ss === 'kampany' && sz.kampany_id === e.kampany_id);
    if (!illik) throw hiba_('hibas_adat', 'A szülő szintje nem illik az elemhez.');
    let x = sz, n = 0;
    while (x && n++ < 30) {
      if (x.id === e.id) throw hiba_('hibas_adat', 'Az elem nem kerülhet a saját leszármazottja alá.');
      const sid = x.szulo_id;
      x = sid ? elemek.find(function (y) { return y.id === sid; }) : null;
    }
  }
}

function elemAdatEllenorzes_(adat) {
  if (!adat || typeof adat !== 'object' || Array.isArray(adat)) throw hiba_('hibas_adat', 'Hibás elemadat.');
  if (JSON.stringify(adat).length > MAX_ELEM_MERET) throw hiba_('tul_nagy', 'Az elem adatai túl nagyok egy cellához. Bontsd több elemre.');
}

// action: element.save (DM)
// adat: { id, uj?, verzio?, tipus (újnál), vilag_id, kampany_id (újnál), nev?, alap_id?, szulo_id?, sorrend?, adat? }
// A szint (sablon, világ, kampány) csak létrehozáskor adható meg; utána az element.promote vált.
function elemMentese_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    let e = elemek.find(function (x) { return x.id === a.id; });
    if (a.uj) {
      if (e) return { elem: elemNezet_(e), verzio: Number(e.verzio) || 0 }; // ismételt küldés
      if (!ELEM_ID_MINTA.test(String(a.id || ''))) throw hiba_('hibas_adat', 'Hibás elemazonosító.');
      e = { id: a.id, tipus: a.tipus, nev: '', vilag_id: a.vilag_id || '', kampany_id: a.kampany_id || '', alap_id: '',
        szulo_id: '', sorrend: 0, adat: {}, verzio: 0, aktiv: true };
    } else {
      if (!e) throw hiba_('nem_talalhato', 'Nincs ilyen elem.');
      if (a.verzio !== undefined && Number(a.verzio) !== (Number(e.verzio) || 0)) {
        throw hiba_('utkozes', 'Az elemet közben más is módosította.', { aktualis: elemNezet_(e) });
      }
    }
    if (a.nev !== undefined) e.nev = String(a.nev || '').slice(0, 160);
    if (a.alap_id !== undefined) e.alap_id = a.alap_id || '';
    if (a.szulo_id !== undefined) e.szulo_id = a.szulo_id || '';
    if (a.sorrend !== undefined) e.sorrend = Number(a.sorrend) || 0;
    if (a.adat !== undefined) { elemAdatEllenorzes_(a.adat); e.adat = a.adat; }
    elemEllenorzes_(e, elemek.concat(a.uj ? [e] : []), sorok_('jatek', 'Kampányok'), epitoSorok_('Világok'));
    const regi = Number(e.verzio) || 0;
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    if (a.uj) sorHozzaadasa_('jatek', 'Elemek', e); else sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, a.uj ? 'elem.letrehoz' : 'elem.ment', e.id, regi, e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio, modositva: e.modositva };
  });
}

// action: element.archive (DM)   adat: { id, aktiv }
function elemArchivalasa_(a, felh) {
  return zarolva_(function () {
    const e = elemKeresese_(a.id, epitoSorok_('Elemek'));
    e.aktiv = !!a.aktiv;
    e.verzio = (Number(e.verzio) || 0) + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, e.aktiv ? 'elem.visszaallit' : 'elem.archival', e.id, '', e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio };
  });
}

// action: element.delete (DM)   adat: { id }
// Csak archivált elem törölhető, és csak ha nincs gyereke és nem alapja más elemnek. A kapcsolatai is törlődnek.
function elemTorlese_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    const e = elemKeresese_(a.id, elemek);
    if (igaz_(e.aktiv)) throw hiba_('hibas_adat', 'Csak archivált elem törölhető. Előbb archiváld.');
    if (elemek.some(function (x) { return x.szulo_id === e.id; })) throw hiba_('hibas_adat', 'Az elemnek vannak gyerekei. Előbb helyezd át vagy töröld őket.');
    if (elemek.some(function (x) { return x.alap_id === e.id; })) throw hiba_('hibas_adat', 'Más elemek erre épülnek (alapjuk). Előbb válaszd le őket.');
    const kapcs = epitoSorok_('Kapcsolatok').filter(function (k) { return k.honnan === e.id || k.hova === e.id; });
    if (kapcs.length) sorokTorlese_('jatek', 'Kapcsolatok', kapcs.map(function (k) { return k._sor; }));
    sorTorlese_('jatek', 'Elemek', e._sor);
    valtozasNaplozasa_(felh, 'elem.torol', e.id, e.verzio, '');
    return { torolve: e.id, kapcsolatok: kapcs.map(function (k) { return k.id; }) };
  });
}

// action: element.detach (DM)   adat: { id, verzio? }
// Leválasztás: az öröklött értékek bemásolódnak (a lánc összefésülve, a saját értékek nyernek), az alap megszűnik.
function elemLevalasztasa_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    const e = elemKeresese_(a.id, elemek);
    if (a.verzio !== undefined && Number(a.verzio) !== (Number(e.verzio) || 0)) {
      throw hiba_('utkozes', 'Az elemet közben más is módosította.', { aktualis: elemNezet_(e) });
    }
    if (!e.alap_id) return { elem: elemNezet_(e), verzio: Number(e.verzio) || 0 };
    const lanc = [];
    let x = e;
    while (x && lanc.length < 4 && lanc.indexOf(x) < 0) {
      lanc.push(x);
      const aid = x.alap_id;
      x = aid ? elemek.find(function (y) { return y.id === aid; }) : null;
    }
    const adat = {};
    for (let i = lanc.length - 1; i >= 0; i--) {
      const d = objektum_(lanc[i].adat);
      Object.keys(d).forEach(function (m) { adat[m] = d[m]; });
    }
    elemAdatEllenorzes_(adat);
    e.adat = adat;
    e.alap_id = '';
    const regi = Number(e.verzio) || 0;
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, 'elem.levalaszt', e.id, regi, e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio };
  });
}

// action: element.promote (DM)   adat: { id, verzio?, vilag_id }
// Világelemmé emelés: a kampányelem a világ eleme lesz (ugyanazzal az azonosítóval, a kapcsolatai megmaradnak).
// Ha a szülője kampányelem, a fa gyökerébe kerül.
function elemEmelese_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    const e = elemKeresese_(a.id, elemek);
    if (a.verzio !== undefined && Number(a.verzio) !== (Number(e.verzio) || 0)) {
      throw hiba_('utkozes', 'Az elemet közben más is módosította.', { aktualis: elemNezet_(e) });
    }
    if (!e.kampany_id) throw hiba_('hibas_adat', 'Csak kampányelem emelhető világelemmé.');
    if (!a.vilag_id) throw hiba_('hianyzo_adat', 'Melyik világba kerüljön? A kampánykeretben válassz világot.');
    e.vilag_id = a.vilag_id;
    e.kampany_id = '';
    const sz = e.szulo_id ? elemek.find(function (y) { return y.id === e.szulo_id; }) : null;
    if (sz && elemSzint_(sz) === 'kampany') e.szulo_id = '';
    elemEllenorzes_(e, elemek, sorok_('jatek', 'Kampányok'), epitoSorok_('Világok'));
    const regi = Number(e.verzio) || 0;
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, 'elem.emel', e.id, regi, e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio };
  });
}

// ---- Kapcsolatok ----

// action: link.save (DM)   adat: { id, uj?, honnan, hova, tipus, megjegyzes?, vilag_id?, kampany_id? }
function kapcsolatMentese_(a, felh) {
  return zarolva_(function () {
    const sorok = epitoSorok_('Kapcsolatok');
    let k = sorok.find(function (x) { return x.id === a.id; });
    if (a.uj) {
      if (k) return { kapcsolat: kapcsolatNezet_(k) };
      if (!LINK_ID_MINTA.test(String(a.id || ''))) throw hiba_('hibas_adat', 'Hibás kapcsolatazonosító.');
      k = { id: a.id, aktiv: true };
    } else if (!k) throw hiba_('nem_talalhato', 'Nincs ilyen kapcsolat.');
    ['honnan', 'hova', 'tipus', 'vilag_id', 'kampany_id'].forEach(function (m) { if (a[m] !== undefined) k[m] = String(a[m] || ''); });
    if (a.megjegyzes !== undefined) k.megjegyzes = String(a.megjegyzes || '').slice(0, 300);
    if (!k.honnan || !k.hova || k.honnan === k.hova) throw hiba_('hibas_adat', 'A kapcsolat két különböző végét meg kell adni.');
    if (KAPCSOLAT_TIPUSOK.indexOf(k.tipus) < 0) throw hiba_('hibas_adat', 'Ismeretlen kapcsolattípus.');
    if (k.vilag_id && k.kampany_id) throw hiba_('hibas_adat', 'A kapcsolat vagy világhoz, vagy kampányhoz tartozik.');
    if (a.uj) sorHozzaadasa_('jatek', 'Kapcsolatok', k); else sorFrissitese_('jatek', 'Kapcsolatok', k);
    valtozasNaplozasa_(felh, a.uj ? 'kapcsolat.letrehoz' : 'kapcsolat.ment', k.id, '', '');
    return { kapcsolat: kapcsolatNezet_(k) };
  });
}

// action: link.delete (DM)   adat: { id }
function kapcsolatTorlese_(a, felh) {
  return zarolva_(function () {
    const k = epitoSorok_('Kapcsolatok').find(function (x) { return x.id === a.id; });
    if (!k) return { torolve: a.id }; // már törölve (ismételt küldés)
    sorTorlese_('jatek', 'Kapcsolatok', k._sor);
    valtozasNaplozasa_(felh, 'kapcsolat.torol', k.id, '', '');
    return { torolve: k.id };
  });
}

// A kampány törlésekor az elemei és a kapcsolatai is törlődnek (zárolás alatt hívandó). A kampányelemre épülő
// vagy alá tartozó világelem nem lehet, így a törlés nem hagy árva hivatkozást a világban.
function kampanyElokeszitesTorlese_(kampanyId) {
  const elemek = epitoSorok_('Elemek').filter(function (e) { return e.kampany_id === kampanyId; });
  const ids = elemek.map(function (e) { return e.id; });
  const kapcs = epitoSorok_('Kapcsolatok').filter(function (k) {
    return k.kampany_id === kampanyId || ids.indexOf(k.honnan) >= 0 || ids.indexOf(k.hova) >= 0;
  });
  if (kapcs.length) sorokTorlese_('jatek', 'Kapcsolatok', kapcs.map(function (k) { return k._sor; }));
  if (elemek.length) sorokTorlese_('jatek', 'Elemek', elemek.map(function (e) { return e._sor; }));
  return elemek.length;
}

// ---- Az elemek képei (5.3: jelenetképek és térképek; közös mező minden elemen) ----
// A képek a Drive „Kampányképek” mappájában vannak; az elem adatában csak a fájlazonosítók (adat.kepek:
// [{ kep, belyeg, cim, terkep, szel, mag }]). Csak a DM tölthet fel és kérhet le ilyen képet.

function kampanyKepMappa_() {
  const id = beallitas_('KAMPANYKEPMAPPA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* törölték: újra létrehozzuk */ }
  }
  const mappa = mappa_(DriveApp.getFolderById(beallitas_('MAPPA_ID')), 'Kampányképek');
  PropertiesService.getScriptProperties().setProperty('KAMPANYKEPMAPPA_ID', mappa.getId());
  CacheService.getScriptCache().put('prop_KAMPANYKEPMAPPA_ID', mappa.getId(), BEALLITAS_CACHE_MP);
  return mappa;
}

// Az elemekben hivatkozott képfájlok azonosítói (a saját és az örökölt értékek is, hiszen mind az adatban vannak).
function elemKepei_(elemek) {
  const ki = {};
  (elemek || epitoSorok_('Elemek')).forEach(function (e) {
    const kepek = objektum_(e.adat).kepek;
    (Array.isArray(kepek) ? kepek : []).forEach(function (k) {
      if (k && k.kep) ki[k.kep] = true;
      if (k && k.belyeg) ki[k.belyeg] = true;
    });
  });
  return ki;
}

// action: element.image.add (DM)   adat: { kep, belyeg? }  (base64 JPEG)  → { kep: { kep, belyeg } }
// Csak a fájlokat hozza létre; az elem adatába a felület írja be (element.save), mert a képlista öröklődhet.
function elemKepFeltoltese_(a, felh) {
  if (!a.kep) throw hiba_('hianyzo_adat', 'Hiányzik a kép.');
  if (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET) throw hiba_('tul_nagy', 'A kép túl nagy.');
  const mappa = kampanyKepMappa_();
  const azon = 'kep_' + Utilities.getUuid().slice(0, 8);
  const fajl = function (b64, nev) {
    return mappa.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', azon + '_' + nev + '.jpg'));
  };
  const kep = fajl(a.kep, 'kep').getId();
  const belyeg = a.belyeg ? fajl(a.belyeg, 'belyeg').getId() : kep;
  valtozasNaplozasa_(felh, 'elem.kep', kep, 0, 1);
  return { kep: { kep: kep, belyeg: belyeg } };
}

// action: element.image.trash (DM)   adat: { kep: { kep, belyeg } }
// A fájlok a kukába kerülnek, de csak ha már egyetlen elem sem hivatkozik rájuk (a sablon képét a példányok is használják),
// és ha a Kampányképek mappában vannak (más képet így nem lehet törölni).
function elemKepTorlese_(a, felh) {
  const k = objektum_(a.kep);
  return zarolva_(function () {
    const hasznalt = elemKepei_();
    const mappaId = kampanyKepMappa_().getId();
    const torolt = [];
    [k.kep, k.belyeg].filter(Boolean).forEach(function (id) {
      if (hasznalt[id] || torolt.indexOf(id) >= 0) return;
      try {
        const f = DriveApp.getFileById(id);
        const szulok = f.getParents();
        let benne = false;
        while (szulok.hasNext()) if (szulok.next().getId() === mappaId) benne = true;
        if (!benne) return;
        f.setTrashed(true);
        torolt.push(id);
      } catch (e) { /* már nincs meg */ }
    });
    if (torolt.length) valtozasNaplozasa_(felh, 'elem.kep:torol', torolt[0], 1, 0);
    return { torolve: torolt };
  });
}

// Az image.get engedélylistájához: a DM az elemek képeit is lekérheti.
function elemKepekEngedese_(felh, engedett) {
  if (!felh || felh.r !== 'dm') return;
  const kepek = elemKepei_();
  Object.keys(kepek).forEach(function (id) { engedett[id] = true; });
}
