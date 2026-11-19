// Kampányépítő (5. lépés): az elemek típusai, szintjei és öröklése. Tiszta függvények, a felület és a
// teszt (tools/teszt/kampany.mjs) is használja. Terv: claude/kampanyepito-terv.md, „Közös alap”.
//
// Egy elem: { id, tipus, nev, vilag_id, kampany_id, alap_id, szulo_id, sorrend, adat, verzio, aktiv, ... }
// Szint: sablon (vilag_id és kampany_id üres), világelem (vilag_id), kampányelem (kampany_id).
// Az adat a saját értékeket tartalmazza: alap_id esetén csak a felülírásokat, különben a teljes tartalmat.
// A megjelenített érték mezőnként: a lánc első olyan eleme, amelyben a mező szerepel (kampány, világ, sablon).
// A listás mezők egészben íródnak felül (nincs elemenkénti összefésülés).

// Az elemtípusok. szulok: milyen típusú elem alá kerülhet a fában (üres lista: csak gyökér).
export const ELEMTIPUSOK = {
  kaland: { nev: 'Kaland', tobbes: 'Kalandok', szulok: [], alepes: '5.2' },
  resz: { nev: 'Rész', tobbes: 'Részek', szulok: ['kaland', 'resz'], alepes: '5.2' },
  jelenet: { nev: 'Jelenet', tobbes: 'Jelenetek', szulok: ['kaland', 'resz'], alepes: '5.3' },
  helyszin: { nev: 'Helyszín', tobbes: 'Helyszínek', szulok: ['helyszin'], alepes: '5.4' },
  csoport: { nev: 'Csoport', tobbes: 'Csoportok', szulok: ['csoport'], alepes: '5.4' },
  jutalom: { nev: 'Jutalom', tobbes: 'Jutalmak', szulok: [], alepes: '5.6' },
  istenseg: { nev: 'Vallás vagy istenség', tobbes: 'Vallások és istenségek', szulok: ['istenseg'], alepes: '5.8' },
  keret: { nev: 'Kampánykeret', tobbes: 'Kampánykeretek', szulok: [], csakSablon: true, alepes: '5.1' }
};

export const SZINTEK = { sablon: 'Sablon', vilag: 'Világ', kampany: 'Kampány' };
export const ALLAPOTOK = { vazlat: 'vázlat', kesz: 'kész' };

// A minden elemen meglévő mezők (az adatban). A név is öröklődik.
export const KOZOS_MEZOK = ['nev', 'osszefoglalo', 'leiras', 'felolvasando', 'titkok', 'cimkek', 'kepek', 'forras', 'oldal', 'allapot'];

export const MEZO_NEV = {
  nev: 'Név', osszefoglalo: 'Rövid összefoglaló', leiras: 'Leírás', felolvasando: 'Felolvasandó szöveg',
  titkok: 'A DM titkai', cimkek: 'Címkék', kepek: 'Képek', forras: 'Forrás', oldal: 'Oldal', allapot: 'Állapot'
};

const LANC_MAX = 4;
const MAX_FA_MELYSEG = 30;

export const masol = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const vanErtek = (o, m) => !!o && Object.prototype.hasOwnProperty.call(o, m) && o[m] !== undefined;
const ures = (x) => x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length);

export function egyenlo(a, b) {
  return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
}

export function szint(e) {
  if (!e) return null;
  if (e.kampany_id) return 'kampany';
  if (e.vilag_id) return 'vilag';
  return 'sablon';
}

const SZINT_RANG = { sablon: 0, vilag: 1, kampany: 2 };

// Az elemek azonosító szerinti indexe (Map).
export function index(elemek) {
  const m = new Map();
  (elemek || []).forEach((e) => { if (e && e.id) m.set(e.id, e); });
  return m;
}

const adatOf = (e) => (e && e.adat && typeof e.adat === 'object' ? e.adat : {});

// Az öröklési lánc: [elem, alapja, annak alapja, ...]. Körre és túl hosszú láncra védett.
export function lanc(e, ix) {
  const ki = [];
  const latott = new Set();
  let x = e;
  while (x && !latott.has(x.id) && ki.length < LANC_MAX) {
    ki.push(x);
    latott.add(x.id);
    x = x.alap_id ? ix.get(x.alap_id) : null;
  }
  return ki;
}

// Egy mező megjelenített értéke és forrása: { ertek, honnan: 'sablon'|'vilag'|'kampany'|null, sajat: bool, orokolt }
// orokolt: az az érték, ami a saját felülírás nélkül látszana (a visszaállítás eredménye).
export function mezoErtek(e, mezo, ix) {
  const l = lanc(e, ix);
  let talalt = null;
  let orokolt = { ertek: undefined, honnan: null };
  for (let i = 0; i < l.length; i++) {
    const a = adatOf(l[i]);
    if (vanErtek(a, mezo)) {
      if (!talalt) talalt = { ertek: a[mezo], honnan: szint(l[i]), sajat: i === 0 };
      if (i > 0) { orokolt = { ertek: a[mezo], honnan: szint(l[i]) }; break; }
    }
  }
  if (!talalt) return { ertek: undefined, honnan: null, sajat: false, orokolt };
  return { ...talalt, orokolt };
}

// Az elem teljes megjelenített adata (a lánc összefésülve, a saját értékek nyernek).
export function megjelenitett(e, ix) {
  const l = lanc(e, ix);
  const ki = {};
  for (let i = l.length - 1; i >= 0; i--) Object.assign(ki, masol(adatOf(l[i])));
  return ki;
}

// A megjelenített név (adat.nev a láncból, különben az oszlop).
export function nev(e, ix) {
  if (!e) return '';
  const n = mezoErtek(e, 'nev', ix || new Map()).ertek;
  return String(n || e.nev || '').trim() || 'Névtelen ' + ((ELEMTIPUSOK[e.tipus] || {}).nev || 'elem').toLowerCase();
}

// Mező beállítása: ha az új érték megegyezik az örökölttel, a felülírás megszűnik (az elem követi az alapját).
export function mezoBeallit(e, mezo, ertek, ix) {
  const adat = { ...adatOf(e) };
  if (e.alap_id) {
    const o = mezoErtek(e, mezo, ix).orokolt;
    if (o.honnan && egyenlo(o.ertek, ertek)) { delete adat[mezo]; return { ...e, adat }; }
    if (mezo === 'nev' && ures(ertek)) { delete adat[mezo]; return { ...e, adat }; } // üres név: az alapé látszik
    if (!o.honnan && ures(ertek)) { delete adat[mezo]; return { ...e, adat }; }
  } else if (ures(ertek) && mezo !== 'nev') {
    delete adat[mezo];
    return { ...e, adat };
  }
  adat[mezo] = ertek;
  return { ...e, adat };
}

// Visszaállítás az örökölt értékre (a saját felülírás törlése).
export function visszaallit(e, mezo) {
  const adat = { ...adatOf(e) };
  delete adat[mezo];
  return { ...e, adat };
}

// A felülírt mezők listája (alap esetén a saját értékek, amelyek eltérnek az örökölttől).
export function felulirtMezok(e, ix) {
  if (!e.alap_id) return [];
  return Object.keys(adatOf(e)).filter((m) => {
    const o = mezoErtek(e, m, ix).orokolt;
    return !o.honnan || !egyenlo(o.ertek, adatOf(e)[m]);
  });
}

// Leválasztás: a megjelenített érték bemásolódik, az alap megszűnik.
export function levalaszt(e, ix) {
  return { ...e, adat: megjelenitett(e, ix), alap_id: '' };
}

// Új elem egy alapra (sablonra vagy világelemre) hivatkozva, üres felülírásokkal.
export function peldany(alap, cel, id) {
  return {
    id, tipus: alap.tipus, nev: '', vilag_id: cel.vilag_id || '', kampany_id: cel.kampany_id || '',
    alap_id: alap.id, szulo_id: cel.szulo_id || '', sorrend: cel.sorrend || 0, adat: {}, verzio: 0, aktiv: true
  };
}

// Egy kampányhoz kötött mezők (például a jelenet összecsapása a kampány összecsapásai közül): a sablonba nem kerülnek át.
export const KAMPANYHOZ_KOTOTT = ['osszecsapas_id'];

// Sablon bármely elemből: a megjelenített tartalom önálló sablonként (szülő és alap nélkül).
export function sablonbol(e, ix, id) {
  const adat = megjelenitett(e, ix);
  delete adat.dobasok;
  KAMPANYHOZ_KOTOTT.forEach((m) => { delete adat[m]; });
  return { id, tipus: e.tipus, nev: adat.nev || e.nev || '', vilag_id: '', kampany_id: '', alap_id: '', szulo_id: '', sorrend: 0, adat, verzio: 0, aktiv: true };
}

// Új, üres elem.
export function ujElem(tipus, cel, id, nevSzoveg) {
  return {
    id, tipus, nev: nevSzoveg || '', vilag_id: cel.vilag_id || '', kampany_id: cel.kampany_id || '', alap_id: '',
    szulo_id: cel.szulo_id || '', sorrend: cel.sorrend || 0, adat: { nev: nevSzoveg || '', allapot: 'vazlat' }, verzio: 0, aktiv: true
  };
}

// Mire hivatkozhat egy elem alapként: azonos típus, magasabb szint (kampány: világ vagy sablon; világ: sablon).
export function lehetAlap(e, alap) {
  if (!e || !alap || e.id === alap.id || e.tipus !== alap.tipus) return false;
  return SZINT_RANG[szint(alap)] < SZINT_RANG[szint(e)];
}

// Az elérhető alapok (sablonok és a világ elemei) egy elemhez.
export function alapJeloltek(e, elemek) {
  return (elemek || []).filter((a) => a.aktiv !== false && lehetAlap(e, a));
}

// Kik hivatkoznak erre az elemre alapként (példányok).
export function peldanyai(e, elemek) {
  return (elemek || []).filter((x) => x.alap_id === e.id);
}

// Ellenőrzés mentés előtt: hibák listája (üres, ha rendben).
export function ellenoriz(e, ix) {
  const h = [];
  if (!ELEMTIPUSOK[e.tipus]) h.push('Ismeretlen elemtípus.');
  if (e.vilag_id && e.kampany_id) h.push('Egy elem vagy világhoz, vagy kampányhoz tartozik, egyszerre a kettőhöz nem.');
  if (ELEMTIPUSOK[e.tipus] && ELEMTIPUSOK[e.tipus].csakSablon && szint(e) !== 'sablon') h.push('Ez az elemtípus csak sablon lehet.');
  if (e.alap_id) {
    const a = ix.get(e.alap_id);
    if (!a) h.push('Az alap elem nem található.');
    else if (!lehetAlap(e, a)) h.push('Az alap csak azonos típusú, magasabb szintű elem lehet (sablon vagy világelem).');
    else if (lanc(e, ix).length >= LANC_MAX && lanc(e, ix)[LANC_MAX - 1].alap_id) h.push('Túl hosszú öröklési lánc.');
  }
  if (e.szulo_id) {
    const sz = ix.get(e.szulo_id);
    if (!sz) h.push('A szülő elem nem található.');
    else {
      if (!szulohozIllik(e, sz)) h.push('Ez az elem nem kerülhet ez alá: ' + nev(sz, ix) + '.');
      if (korLenne(e.id, e.szulo_id, ix)) h.push('Az elem nem kerülhet a saját leszármazottja alá.');
    }
  }
  return h;
}

// Szülő és gyerek összeillése: a típus szerint, és szint szerint (gyerek szintje nem lehet magasabb a szülőénél:
// sablon csak sablon alá, világelem világelem alá, kampányelem világ- vagy kampányelem alá).
export function szulohozIllik(e, sz) {
  const t = ELEMTIPUSOK[e.tipus];
  if (!t || !t.szulok.includes(sz.tipus)) return false;
  const se = szint(e), ss = szint(sz);
  if (se === 'sablon') return ss === 'sablon';
  if (se === 'vilag') return ss === 'vilag' && sz.vilag_id === e.vilag_id;
  if (ss === 'kampany') return sz.kampany_id === e.kampany_id;
  return ss === 'vilag';
}

// Kör keletkezne-e, ha az id elem a szuloId alá kerülne.
export function korLenne(id, szuloId, ix) {
  let x = szuloId;
  let n = 0;
  while (x && n++ < MAX_FA_MELYSEG) {
    if (x === id) return true;
    const e = ix.get(x);
    x = e ? e.szulo_id : '';
  }
  return n >= MAX_FA_MELYSEG;
}

// Világelemmé emelés: a kampányelem a világ eleme lesz (ugyanazzal az azonosítóval, a kapcsolatai megmaradnak).
// Ha a szülője kampányelem, a fa gyökerébe kerül.
export function emel(e, vilagId, ix) {
  const ki = { ...e, vilag_id: vilagId, kampany_id: '' };
  const sz = e.szulo_id ? ix.get(e.szulo_id) : null;
  if (sz && !szulohozIllik(ki, sz)) ki.szulo_id = '';
  return ki;
}

// Szűrés a listákhoz.
export function szures(elemek, { tipus, szoveg, archivalt, ix } = {}) {
  const s = String(szoveg || '').trim().toLowerCase();
  const index_ = ix || index(elemek);
  return (elemek || []).filter((e) => {
    if (tipus && e.tipus !== tipus) return false;
    if (!archivalt && e.aktiv === false) return false;
    if (!s) return true;
    const m = megjelenitett(e, index_);
    return [nev(e, index_), m.osszefoglalo, (m.cimkek || []).join(' ')].join(' ').toLowerCase().includes(s);
  });
}

// Mentéshez: az oszlopok értékei (a név oszlop a megjelenített név, csak a táblázat olvashatóságáért).
export function mentendo(e, ix) {
  return {
    id: e.id, tipus: e.tipus, nev: nev(e, ix), vilag_id: e.vilag_id || '', kampany_id: e.kampany_id || '',
    alap_id: e.alap_id || '', szulo_id: e.szulo_id || '', sorrend: Number(e.sorrend) || 0, adat: adatOf(e)
  };
}
