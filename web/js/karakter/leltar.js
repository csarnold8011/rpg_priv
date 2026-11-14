// Játék közbeni felszerelés és pénz: vétel, eladás, pénzmozgás, talált vagy elvesztett tárgy.
// A tételek a felszereles.jatek listában vannak, a varazslo.js felszerelesFrissit függvénye számolja
// bele őket a tárgyakba és a pénzbe (a kezdőpénzből vett dolgok a felszereles.vasarolt listában maradnak).
// Egy tétel: { tipus: vetel | eladas | penz | targy | elvesz | osszevont, targy?, nev?, db?, penz?, megjegyzes?, hol?, idopont }
//   targy: a tárgy azonosítója (fgy_…, pan_…, fel_… vagy saját: „sajat:…”), db: előjeles darabváltozás,
//   penz: előjeles pénzváltozás rézben (kiadás negatív).
import { felszerelesFrissit, arRez, targyLap } from './varazslo.js';
import { index } from './szabalyindex.js';

const MAX_TETEL = 200;

function hozzaad(adat, lapok, tetel) {
  const f = adat.felszereles;
  f.jatek = Array.isArray(f.jatek) ? f.jatek.slice() : [];
  f.jatek.push({ ...tetel, idopont: new Date().toISOString() });
  if (f.jatek.length > MAX_TETEL) osszevon(f);
  felszerelesFrissit(adat, lapok);
}

// A legrégebbi tételek egy összevont tételbe kerülnek (a pénz és a darabszámok összege nem változik).
function osszevon(f) {
  const regi = f.jatek.splice(0, f.jatek.length - MAX_TETEL / 2);
  const o = { tipus: 'osszevont', penz: 0, targyak: [], megjegyzes: `${regi.length} korábbi tétel összevonva`, idopont: regi[regi.length - 1].idopont };
  regi.forEach((t) => {
    o.penz += Number(t.penz) || 0;
    tetelTargyai(t).forEach((x) => {
      const m = o.targyak.find((y) => y.id === x.id);
      if (m) m.db += x.db; else o.targyak.push({ ...x });
    });
  });
  o.targyak = o.targyak.filter((x) => x.db !== 0);
  f.jatek.unshift(o);
}

// Egy tétel tárgyváltozásai: [{ id, nev, db }].
export function tetelTargyai(t) {
  if (Array.isArray(t.targyak)) return t.targyak;
  return t.targy && t.db ? [{ id: t.targy, nev: t.nev, db: Number(t.db) || 0 }] : [];
}

export const elemAra = (lapok, id) => arRez(index(lapok).elem(targyLap(id), id));

export function vetel(adat, lapok, id, db = 1, egysegar = null, hol = '') {
  const ar = egysegar === null ? (elemAra(lapok, id) || 0) : egysegar;
  hozzaad(adat, lapok, { tipus: 'vetel', targy: id, db, penz: -ar * db, hol: hol || undefined });
}
// Eladás: alapból a listaár negyede (Kampányépítő: a kereskedők általában ennyit adnak).
export const ELADASI_ARANY = 0.25;
export function eladas(adat, lapok, id, db = 1, egysegar = null, nev) {
  const ar = egysegar === null ? Math.floor((elemAra(lapok, id) || 0) * ELADASI_ARANY) : egysegar;
  hozzaad(adat, lapok, { tipus: 'eladas', targy: id, nev, db: -db, penz: ar * db });
}
export function penzValtozas(adat, lapok, rez, megjegyzes = '') {
  if (!rez) return;
  hozzaad(adat, lapok, { tipus: 'penz', penz: rez, megjegyzes });
}
// Talált, kapott tárgy (a szabályadatból vagy saját névvel).
export function targyHozzaad(adat, lapok, { id, nev }, db = 1, megjegyzes = '') {
  const azon = id || 'sajat:' + String(nev || 'tárgy').trim().toLowerCase().replace(/\s+/g, '_').slice(0, 40);
  hozzaad(adat, lapok, { tipus: 'targy', targy: azon, nev: id ? undefined : String(nev || '').trim(), db, megjegyzes });
}
// Elhasznált, elvesztett, eldobott tárgy.
export function targyElvesz(adat, lapok, id, db = 1, megjegyzes = '', nev) {
  hozzaad(adat, lapok, { tipus: 'elvesz', targy: id, nev, db: -db, megjegyzes });
}
// Egy tétel visszavonása (a sorszáma szerint).
export function tetelTorol(adat, lapok, i) {
  const f = adat.felszereles;
  f.jatek = (f.jatek || []).filter((_, j) => j !== i);
  felszerelesFrissit(adat, lapok);
}

export const TETEL_NEV = { vetel: 'Vétel', eladas: 'Eladás', penz: 'Pénz', targy: 'Tárgy', elvesz: 'Elhasznált, elvesztett', osszevont: 'Összevont' };
