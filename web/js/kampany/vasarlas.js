// Kampányjátszó 6.6: vásárlás a boltokban (tiszta függvények).
// A DM a helyszín boltját (5.4, 5.6) megnyitja a csapatnak: a kínálatról pillanatkép készül (boltPillanatkep) a bolt
// áraival (árszorzó, árszint, a csapat kedvezménye), a darabszámmal és a mágikus tételek bejegyzésével; ezt a shop.open
// viszi a háttérbe (backend/Boltok.gs). A játékos a telefonján kosárba gyűjt és vásárol, vagy elad a felvásárlási áron
// (shop.buy); a háttér ellenőrzi a készletet és a pénzt. A pénz mindig rézben (1 ezüst = 10 réz).
import * as B from './bolt.js';
import * as HS from './helyszin.js';
import { bejegyzesJutalombol } from './kioszt.js';
import { penzSzoveg } from '../karakter/varazslo.js';
import { elemAra } from '../karakter/leltar.js';

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const egesz = (x) => Math.round(Number(szoveg(x).replace('−', '-')) || 0);

export const ujVasarlasId = () => 'vb_' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(-12);

// A háttér korlátai (backend/Boltok.gs).
export const NYITOTT_BOLT_MAX = 6;
export const BOLT_TETEL_MAX = 150;
export const KOSAR_DB_MAX = 99;

// ---------- A bolt megnyitása (DM) ----------

// A kínálati tétel mágikus adata (5.6 óta a bolt mágikus kínálatának generálása tölti), vagy null.
export function magikusOf(t) {
  const m = obj(obj(t).magikus);
  return m.alap_id || m.alap_nev || lista(m.elonyok).length ? m : null;
}

// A shop.open bolt adata a megjelenített bolt adatból. elemId, nev: az előkészítő elem; hely: a helyszín útvonala;
// szorzo: az árszorzó százalékban (bolt.js arszorzo). Visszaad: { bolt, arNelkul: [tételnév], kimaradt (a korlát miatt) }.
// Az ár a csapat kedvezményes ára, ha van; a kézi ár nyer. Ár nélküli tétel nem kerül be (a DM a kézi árat megadhatja).
export function boltPillanatkep({ elemId, nev, hely = '', a, lapok, szorzo = 100 }) {
  a = obj(a);
  const h = B.hatasokOf(a);
  const arNelkul = [];
  const tetelek = [];
  lista(a.kinalat).forEach((t) => {
    const ar = B.tetelAr(t, a, szorzo, lapok);
    const egyseg = ar.csapat !== null ? ar.csapat : ar.ar;
    const tnev = B.tetelNev(t, lapok);
    if (egyseg === null || egyseg === undefined) { arNelkul.push(tnev); return; }
    const o = { id: szoveg(t.id), tetel: szoveg(t.tetel), nev: tnev, csoport: B.forrasNev(t.forras || 'egyedi', lapok), ar: egyseg,
      lista: ar.lista, darab: t.darab === null || t.darab === undefined || t.darab === '' ? null : Math.max(0, egesz(t.darab)), megj: szoveg(t.megj) };
    if (ar.csapat !== null && ar.ar !== ar.csapat) o.eredeti = ar.ar;
    const m = magikusOf(t);
    if (m) {
      o.magikus = { alap_id: szoveg(m.alap_id), bejegyzes: bejegyzesJutalombol({ fajta: 'targy', targy_fajta: m.targy_fajta, alap_id: m.alap_id, alap_nev: m.alap_nev,
        kidolgozottsag: m.kidolgozottsag, elonyok: m.elonyok, atok: m.atok, leiras: szoveg(t.megj) }, { nev: tnev }) };
    }
    tetelek.push(o);
  });
  const kimaradt = Math.max(0, tetelek.length - BOLT_TETEL_MAX);
  const kid = B.KIDOLGOZOTTSAGOK[a.kidolgozottsag];
  const megj = [kid && a.kidolgozottsag !== 'atlagos' ? 'Kidolgozottság: ' + kid.nev.toLowerCase() + ' (' + kid.hatas + ')' : '']
    .concat(B.reszletekOf(a).filter((r) => r.hatas === 'alku').map((r) => 'Alku: ' + r.e)).filter(Boolean).join('. ');
  return {
    bolt: {
      elem_id: elemId, nev: szoveg(nev) || 'Bolt', hely: szoveg(hely), tipus: B.tipusFelirat(a),
      felvasarlas: a.felvasarlas === undefined || a.felvasarlas === '' || a.felvasarlas === null ? B.ALAP_FELVASARLAS : egesz(a.felvasarlas),
      visszavasarlas: !h.includes('kiarusitas'), csere: h.includes('csere'), bogo: h.includes('bogo'),
      kedvezmeny: B.csapatKedvezmeny(a), arszint: B.ervenyesArszint(a), megj, tetelek: tetelek.slice(0, BOLT_TETEL_MAX)
    },
    arNelkul, kimaradt
  };
}

// A bolt helye szövegként: a fölérendelt helyszínek (régió › település › …).
export function helyUtvonal(elem, ix, nevOf) {
  return HS.osok(elem, ix).map((x) => nevOf(x)).join(' › ');
}

// Az előkészítő elemek közül a boltok (fajta: üzlet), név szerint. megj(e): a megjelenített adat.
export function boltElemek(elemek, megj) {
  return lista(elemek).filter((e) => e && e.tipus === 'helyszin' && e.aktiv !== false && HS.fajtaOf(megj(e)) === 'uzlet');
}

// Egy jelenet helyszíneihez tartozó boltok: a helyszín maga, ha üzlet, és a fában alatta lévő üzletek (két szintig).
export function helyszinBoltjai(helyek, elemek, megj) {
  const ki = [];
  const add = (e) => { if (e && !ki.includes(e) && e.aktiv !== false && HS.fajtaOf(megj(e)) === 'uzlet') ki.push(e); };
  const gyerekek = (id) => lista(elemek).filter((e) => e && e.szulo_id === id && e.tipus === 'helyszin');
  lista(helyek).forEach((h) => {
    add(h);
    gyerekek(h.id).forEach((g) => { add(g); gyerekek(g.id).forEach(add); });
  });
  return ki;
}

// ---------- A boltok az állapotban ----------

export function boltNorm(b) {
  const o = obj(b);
  return { ...o, nev: szoveg(o.nev) || 'Bolt', nyitva: !!o.nyitva, tetelek: lista(o.tetelek), naplo: lista(o.naplo).filter((x) => x && x.id),
    felvasarlas: egesz(o.felvasarlas), kedvezmeny: egesz(o.kedvezmeny), visszavasarlas: o.visszavasarlas !== false };
}
export const boltokOf = (allapot) => lista(obj(allapot).boltok).map(boltNorm);
export const nyitottBoltok = (allapot) => boltokOf(allapot).filter((b) => b.nyitva);
// Az előkészítő elem boltja az állapotban (ha valaha megnyitották).
export const elemBoltja = (allapot, elemId) => boltokOf(allapot).find((b) => b.elem_id === elemId) || null;

// A tétel szabad készlete: null, ha korlátlan (a háttér `keszlet` mezője).
export const keszlet = (t) => (t.keszlet === null || t.keszlet === undefined ? null : Math.max(0, egesz(t.keszlet)));

// A napló a legújabb elöl.
export const naploSorok = (b) => boltNorm(b).naplo.slice().reverse();

// ---------- A kosár ----------

// Az egységárak a „két tételből az olcsóbb féláron” részlettel (mint a háttérben: kosarArak_): ár szerint csökkenő
// sorban minden második egység fele áron (lefelé kerekített engedménnyel). sorok: [{ ar, db }] → soronként a fizetendő.
export function kosarArak(sorok, bogo) {
  const egysegek = [];
  lista(sorok).forEach((s, i) => { for (let j = 0; j < egesz(s.db); j++) egysegek.push({ i, ar: egesz(s.ar) }); });
  egysegek.sort((x, y) => y.ar - x.ar || x.i - y.i);
  const ki = lista(sorok).map(() => 0);
  egysegek.forEach((e, n) => { ki[e.i] += bogo && n % 2 === 1 ? e.ar - Math.floor(e.ar / 2) : e.ar; });
  return ki;
}

// A kosár ({ tetel_id: db }) összesítése: { sorok: [{ t, db, fizet }], osszeg, engedmeny, hibak }.
export function kosarOsszesites(bolt, kosar) {
  const b = boltNorm(bolt);
  const hibak = [];
  const sorok = Object.keys(obj(kosar)).map((id) => ({ t: b.tetelek.find((x) => x.id === id), db: egesz(kosar[id]) }))
    .filter((s) => s.t && s.db > 0);
  sorok.forEach((s) => {
    const k = keszlet(s.t);
    if (k !== null && s.db > k) hibak.push(k ? s.t.nev + ': csak ' + k + ' darab van.' : s.t.nev + ': elfogyott.');
    if (magikusOf(s.t) && s.db > 1) hibak.push(s.t.nev + ': egyszerre egy vehető.');
  });
  const fizet = kosarArak(sorok.map((s) => ({ ar: s.t.ar, db: s.db })), b.bogo);
  const teljes = sorok.reduce((n, s) => n + egesz(s.t.ar) * s.db, 0);
  const osszeg = fizet.reduce((n, x) => n + x, 0);
  return { sorok: sorok.map((s, i) => ({ ...s, fizet: fizet[i] })), osszeg, engedmeny: teljes - osszeg, darab: sorok.reduce((n, s) => n + s.db, 0), hibak };
}

// Egy tétel hozzáadása vagy elvétele a kosárból (a készlet és a mágikus tárgy korlátjával).
export function kosarValt(kosar, t, valtozas) {
  const k = { ...obj(kosar) };
  const most = egesz(k[t.id]);
  let uj = Math.max(0, most + valtozas);
  const kesz = keszlet(t);
  if (kesz !== null) uj = Math.min(uj, kesz);
  if (magikusOf(t)) uj = Math.min(uj, 1);
  uj = Math.min(uj, KOSAR_DB_MAX);
  if (uj) k[t.id] = uj; else delete k[t.id];
  return k;
}

// ---------- Eladás ----------

// A karakter eladható tárgyai a bolt felvásárlási árával: a szabályadat elemei listaárral (az egyedi és a mágikus tárgyat
// a bolt nem veszi fel, azt a DM-mel kell megbeszélni). Visszaad: { targyak: [{ id, nev, db, lista, ar, felszerelve }], egyeb }.
export function eladhatoTargyak(adat, lapok, bolt, nevOf = (id) => id) {
  const b = boltNorm(bolt);
  const ki = [];
  let egyeb = 0;
  lista(obj(obj(adat).felszereles).targyak).forEach((t) => {
    if (!t || !(egesz(t.db) > 0)) return;
    const id = szoveg(t.id);
    const listaAr = /^(fgy|pan|fel)_[a-z0-9_]+$/.test(id) ? elemAra(lapok, id) : null;
    if (listaAr === null || listaAr === undefined) { egyeb++; return; }
    ki.push({ id, nev: t.nev || nevOf(id), db: egesz(t.db), lista: listaAr, ar: Math.round(listaAr * b.felvasarlas / 100), felszerelve: !!t.felszerelve });
  });
  return { targyak: ki.sort((x, y) => x.nev.localeCompare(y.nev, 'hu')), egyeb };
}

// Az eladás ({ targy_id: db }) összesítése: { sorok: [{ t, db, fizet }], osszeg }.
export function eladasOsszesites(targyak, eladando) {
  const sorok = Object.keys(obj(eladando)).map((id) => ({ t: lista(targyak).find((x) => x.id === id), db: egesz(eladando[id]) }))
    .filter((s) => s.t && s.db > 0).map((s) => ({ ...s, db: Math.min(s.db, s.t.db), fizet: s.t.ar * Math.min(s.db, s.t.db) }));
  return { sorok, osszeg: sorok.reduce((n, s) => n + s.fizet, 0) };
}

// ---------- Kérések ----------

export function vetelKeres({ kampanyId, bolt, karakterId, kosar, id = ujVasarlasId() }) {
  return { kampany_id: kampanyId, bolt_id: obj(bolt).id, id, karakter_id: karakterId, fajta: 'vetel',
    tetelek: Object.keys(obj(kosar)).filter((k) => egesz(kosar[k]) > 0).map((k) => ({ tetel_id: k, db: egesz(kosar[k]) })) };
}

export function eladasKeres({ kampanyId, bolt, karakterId, eladando, id = ujVasarlasId() }) {
  return { kampany_id: kampanyId, bolt_id: obj(bolt).id, id, karakter_id: karakterId, fajta: 'eladas',
    targyak: Object.keys(obj(eladando)).filter((k) => egesz(eladando[k]) > 0).map((k) => ({ targy: k, db: egesz(eladando[k]) })) };
}

// A háttér válaszának beírása a tárolt kampányállapotba: a bolt (vagy a törölt bolt) és a karakter új adata.
export function allapotraAlkalmaz(allapot, valasz) {
  const st = obj(allapot);
  const v = obj(valasz);
  let boltok = lista(st.boltok);
  if (v.torolve) boltok = boltok.filter((b) => b.id !== v.torolve);
  if (v.bolt && v.bolt.id) boltok = boltok.some((b) => b.id === v.bolt.id) ? boltok.map((b) => (b.id === v.bolt.id ? v.bolt : b)) : boltok.concat([v.bolt]);
  const kar = v.karakter && v.karakter.id ? v.karakter : null;
  const karakterek = kar ? lista(st.karakterek).map((c) => (c.id === kar.id ? { ...c, verzio: kar.verzio, adat: kar.adat } : c)) : st.karakterek;
  return { ...st, boltok, karakterek };
}

// ---------- Szövegek ----------

// A vásárlás tételei egy sorban: „Hosszú kard, 3 × Gyógyír”.
export const tetelekSzoveg = (x) => lista(obj(x).tetelek).map((t) => (egesz(t.db) > 1 ? egesz(t.db) + ' × ' : '') + szoveg(t.nev || t.targy)).join(', ');

// A napló sora: „Vilma vett: Hosszú kard, 3 × Gyógyír (−21 ezüst)”.
export function vasarlasSzoveg(x) {
  const o = obj(x);
  const ige = o.fajta === 'eladas' ? 'eladott' : 'vett';
  const osszeg = egesz(o.osszeg);
  return (szoveg(o.karakter_nev) || 'Valaki') + ' ' + ige + ': ' + tetelekSzoveg(o) + ' (' + (osszeg > 0 ? '+' : osszeg < 0 ? '−' : '') + penzSzoveg(Math.abs(osszeg)) + ')';
}

// A boltok vásárlásai az alkalom eseménynaplójába (alkalom.js esemenyekAllapotbol): karakterenként „pénz” esemény.
export function vasarlasEsemenyek(allapot, benne) {
  const ki = [];
  boltokOf(allapot).forEach((b) => b.naplo.forEach((x) => {
    if (!benne(x.idopont)) return;
    ki.push({ kulcs: 'vasarlas:' + x.id, ido: x.idopont, fajta: 'penz',
      szoveg: (x.fajta === 'eladas' ? 'Eladás: ' : 'Vásárlás: ') + tetelekSzoveg(x) + ', ' + b.nev,
      adat: { nev: szoveg(x.karakter_nev), penz: egesz(x.osszeg), tipus: x.fajta === 'eladas' ? 'eladas' : 'vetel', vasarlas_id: x.id, bolt: b.nev,
        ...(x.visszavonva ? { visszavont: true } : {}) } });
  }));
  return ki;
}
