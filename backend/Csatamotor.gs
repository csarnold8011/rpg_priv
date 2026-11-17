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
