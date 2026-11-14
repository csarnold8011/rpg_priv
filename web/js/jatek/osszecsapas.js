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
import { FENYEGETESEK, fenyegetesSorszam } from './leny.js';

export const VISZONYOK = {
  ellenseges: { nev: 'ellenséges', sorrend: 0 },
  semleges: { nev: 'semleges', sorrend: 1 },
  szovetseges: { nev: 'szövetséges', sorrend: 2 },
  sajat: { nev: 'saját oldal', sorrend: 3 }
};
export const CSAPAT = 'o_csapat';
export const ELLENFELEK = 'o_ellen';
export const TIPUS_NEV = { szorny: 'Bestiárium', njk: 'NJK', karakter: 'Karakter' };
// Az erősítés nagyjából egy fenyegetési fokkal emeli a lényt (C 104.: az elit egy fokkal erősebb).
const EROSITES_FOK = { nincs: 0, elit: 1, hosi: 2, epikus: 3 };
// XP az összecsapás nehézsége szerint (AK 117–118.), a csata lezárásakor javaslatként.
export const NEHEZSEGEK = {
  'Könnyű': { xp: 100, tonus: undefined },
  'Átlagos': { xp: 250, tonus: 'accent' },
  'Nehéz': { xp: 400, tonus: 'warning' },
  'Nagyon nehéz': { xp: 400, tonus: 'danger' }
};
export const MAX_DB = 30;
// Más oldal Egészsége a játékosoknak (kampánybeállítás: csata_egeszseg).
export const EGESZSEG_LATHATOSAG = {
  pontos: 'Pontos érték',
  leiro: 'Leíró (ép, sérült, súlyosan sérült, földön)',
  rejtett: 'Rejtett'
};

let szamlalo = 0;
export function ujAzon(elotag) {
  szamlalo = (szamlalo + 1) % 1000;
  return `${elotag}_${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 6)}${szamlalo}`;
}
const egesz = (x, alap) => (Number.isFinite(Number(x)) && x !== '' && x !== null ? Math.round(Number(x)) : alap);
const masol = (x) => JSON.parse(JSON.stringify(x));
export const viszonyKulcs = (a, b) => [a, b].sort().join('|');

// ---------------- Létrehozás, betöltés ----------------

export function uresOsszecsapas() {
  return {
    leiras: '', helyszin: '', terep: '', megjegyzes: '',
    oldalak: [{ id: CSAPAT, nev: 'Csapat' }, { id: ELLENFELEK, nev: 'Ellenfelek' }],
    viszonyok: { [viszonyKulcs(CSAPAT, ELLENFELEK)]: 'ellenseges' },
    csoportok: [],
    resztvevok: []
  };
}

// A tárolt (esetleg hiányos vagy régi) adatból teljes szerkezet. Semmit nem dob el, ami értelmes.
export function normalizal(adat) {
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

export function viszony(o, a, b) {
  if (!a || !b) return 'semleges';
  if (a === b) return 'sajat';
  const v = o && o.viszonyok && o.viszonyok[viszonyKulcs(a, b)];
  return VISZONYOK[v] && v !== 'sajat' ? v : 'semleges';
}

export function oldalHozzaadas(o, nev, alapViszony = 'semleges') {
  const uj = masol(o);
  const id = ujAzon('o');
  uj.oldalak.push({ id, nev: String(nev || '').trim() || `${uj.oldalak.length + 1}. oldal` });
  uj.oldalak.forEach((x) => { if (x.id !== id) uj.viszonyok[viszonyKulcs(x.id, id)] = alapViszony; });
  return uj;
}

export function oldalAtnevezes(o, id, nev) {
  const uj = masol(o);
  const x = uj.oldalak.find((y) => y.id === id);
  if (x) x.nev = String(nev || '').slice(0, 60);
  return uj;
}

export function viszonyBeallitas(o, a, b, v) {
  if (a === b || !VISZONYOK[v] || v === 'sajat') return o;
  const uj = masol(o);
  uj.viszonyok[viszonyKulcs(a, b)] = v;
  return uj;
}

// Oldal törlése: a résztvevői az „ide” oldalra kerülnek (alapból az első megmaradó oldalra). Az utolsó oldal nem törölhető.
export function oldalTorles(o, id, ide) {
  if (o.oldalak.length <= 1 || !o.oldalak.some((x) => x.id === id)) return o;
  const uj = masol(o);
  uj.oldalak = uj.oldalak.filter((x) => x.id !== id);
  const cel = uj.oldalak.some((x) => x.id === ide) ? ide : uj.oldalak[0].id;
  uj.resztvevok.forEach((r) => { if (r.oldal === id) r.oldal = cel; });
  Object.keys(uj.viszonyok).forEach((k) => { if (k.split('|').includes(id)) delete uj.viszonyok[k]; });
  return uj;
}

// ---------------- Kezdeményezési csoportok ----------------

export function csoportHozzaadas(o, nev) {
  const uj = masol(o);
  const id = ujAzon('g');
  uj.csoportok.push({ id, nev: String(nev || '').trim() || `${uj.csoportok.length + 1}. csoport` });
  return { o: uj, id };
}

export function csoportAtnevezes(o, id, nev) {
  const uj = masol(o);
  const g = uj.csoportok.find((x) => x.id === id);
  if (g) g.nev = String(nev || '').slice(0, 60);
  return uj;
}

export function csoportTorles(o, id) {
  const uj = masol(o);
  uj.csoportok = uj.csoportok.filter((x) => x.id !== id);
  uj.resztvevok.forEach((r) => { if (r.csoport === id) r.csoport = ''; });
  return uj;
}

// A csoport tagjai (résztvevő-sorok); a kezdeményezést a csoport egyszerre dobja.
export const csoportTagjai = (o, id) => o.resztvevok.filter((r) => r.csoport === id);

// ---------------- Résztvevők ----------------

// elem: { tipus, id, nev, db? }. opciok: { oldal, csoportba (db > 1-nél alapból igen), fontos, rejtett }.
// A több példányos szörny alapból saját kezdeményezési csoportot kap (a kis NJK-k csoportban, AK 100.).
export function resztvevoHozzaadas(o, elem, opciok = {}) {
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

export function resztvevoModositas(o, id, valtozas) {
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
export function resztvevoTorles(o, id) {
  const uj = masol(o);
  const r = uj.resztvevok.find((x) => x.id === id);
  if (!r) return o;
  uj.resztvevok = uj.resztvevok.filter((x) => x.id !== id);
  if (r.csoport && !uj.resztvevok.some((x) => x.csoport === r.csoport)) uj.csoportok = uj.csoportok.filter((g) => g.id !== r.csoport);
  return uj;
}

// A kampány karakterei a Csapat oldalra (aki már benne van, nem kerül be még egyszer). karakterek: [{ id, nev }].
export function csapatHozzaadas(o, karakterek, oldal = CSAPAT) {
  let uj = o;
  const bent = new Set(o.resztvevok.filter((r) => r.forras.tipus === 'karakter').map((r) => r.forras.id));
  (karakterek || []).forEach((c) => {
    if (bent.has(c.id)) return;
    uj = resztvevoHozzaadas(uj, { tipus: 'karakter', id: c.id, nev: c.nev }, { oldal }).o;
  });
  return uj;
}

// Másolat az összecsapásról (új azonosítókkal a résztvevőknek, a csoportok és oldalak megmaradnak).
export function osszecsapasMasolat(o) {
  const uj = normalizal(o);
  uj.resztvevok.forEach((r) => { r.id = ujAzon('r'); });
  return uj;
}

// ---------------- Áttekintés és ellenőrzés ----------------

export function osszegzes(o) {
  const oldalak = o.oldalak.map((x) => {
    const tagok = o.resztvevok.filter((r) => r.oldal === x.id);
    return { id: x.id, nev: x.nev, db: tagok.reduce((a, r) => a + r.db, 0), rejtett: tagok.filter((r) => r.rejtett).reduce((a, r) => a + r.db, 0) };
  });
  return { oldalak, osszes: oldalak.reduce((a, x) => a + x.db, 0) };
}

// Figyelmeztetések (semmit nem tilt). Visszaad: [szöveg].
export function ellenorzes(o) {
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
export function szintSav(szint) {
  const s = Math.max(1, Math.min(20, egesz(szint, 1)));
  const i = FENYEGETESEK.findIndex((f) => s >= f.szint[0] && s <= f.szint[1]);
  return i < 0 ? 0 : i;
}

// Egy résztvevő hatékony fenyegetési foka. info: { fenyegetes, erosites (fok), szint } a forrásból.
export function resztvevoFok(r, info) {
  if (!info) return null;
  if (r.forras.tipus === 'karakter') return info.szint ? szintSav(info.szint) : null;
  const alap = fenyegetesSorszam(info.fenyegetes);
  if (alap < 0) return null;
  return Math.min(FENYEGETESEK.length - 1 + 2, alap + (EROSITES_FOK[info.erosites] || 0));
}

// A résztvevő adatai a nehézséghez és a listához a környezetből.
// kornyezet: { szornyek: [Szörnyek lap sorai], njkk: [NJK-k (összefoglaló vagy teljes)], karakterek: [{ id, nev, szint }] }
export function resztvevoInfo(r, kornyezet = {}) {
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
export function csapatOldala(o) {
  const karakteres = (id) => o.resztvevok.filter((r) => r.oldal === id && r.forras.tipus === 'karakter').length;
  if (o.oldalak.some((x) => x.id === CSAPAT) && karakteres(CSAPAT)) return CSAPAT;
  const legtobb = o.oldalak.map((x) => [x.id, karakteres(x.id)]).sort((a, b) => b[1] - a[1])[0];
  return legtobb && legtobb[1] ? legtobb[0] : (o.oldalak.some((x) => x.id === CSAPAT) ? CSAPAT : o.oldalak[0].id);
}

// Tájékoztató nehézség a fenyegetési szintek és a csapat szintje alapján, kötelezés nélkül.
// kornyezet: mint a resztvevoInfo-nál, és csapat: [{ id, szint }] (a kampány aktív karakterei, ha az összecsapásban nincs karakter).
// Visszaad: null (nincs ellenfél), vagy { becsles, xp, csapat: { szint, letszam, kampanybol }, ellenfelek: [...], megjegyzesek: [] }.
export function nehezsegBecsles(o, kornyezet = {}) {
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
export function resztvevokKibontasa(o) {
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
export function celpontSorrend(o, resztvevok, sajatOldal, sajatId) {
  return (resztvevok || []).filter((r) => r.id !== sajatId).map((r) => ({ ...r, viszony: viszony(o, sajatOldal, r.oldal) }))
    .sort((a, b) => VISZONYOK[a.viszony].sorrend - VISZONYOK[b.viszony].sorrend || String(a.nev).localeCompare(String(b.nev), 'hu'));
}

// Figyelmeztetés, ha a támadás célpontja nem ellenséges oldalon áll (semmit nem tilt).
export function celpontFigyelmeztetes(o, tamadoOldal, celOldal) {
  const v = viszony(o, tamadoOldal, celOldal);
  if (v === 'sajat') return 'A célpont a saját oldaladon áll.';
  if (v === 'szovetseges') return 'A célpont szövetséges oldalon áll.';
  return null;
}

// Mennyit lát a néző egy résztvevő Egészségéből: 'pontos', 'leiro' vagy 'rejtett'.
// A DM mindent pontosan lát, a saját oldal (bármelyik oldal, ahol a nézőnek karaktere van) is pontos.
export function egeszsegLathatosag(beallitas, { dm, nezoOldalak = [], celOldal } = {}) {
  if (dm || nezoOldalak.includes(celOldal)) return 'pontos';
  const b = beallitas && beallitas.csata_egeszseg;
  return EGESZSEG_LATHATOSAG[b] ? b : 'leiro';
}

// Leíró Egészség: ép, sérült (legalább a fele megvan), súlyosan sérült, földön.
export function leiroEgeszseg(egeszseg, max) {
  const e = Number(egeszseg) || 0;
  const m = Math.max(1, Number(max) || 1);
  if (e <= 0) return 'földön';
  if (e >= m) return 'ép';
  if (e * 2 >= m) return 'sérült';
  return 'súlyosan sérült';
}

// Az Egészség megjelenítése a láthatóság szerint.
export function egeszsegSzoveg(egeszseg, max, lathatosag) {
  if (lathatosag === 'pontos') return `${egeszseg}/${max}`;
  if (lathatosag === 'rejtett') return '?';
  return leiroEgeszseg(egeszseg, max);
}
