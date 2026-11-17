// Kampányépítő: a szerkezet fája (kaland, rész, jelenet; helyszín a helyszínen belül). Tiszta függvények.
// A fa a szulo_id és a sorrend mezőből áll össze; a kapcsolatok hálózata külön van (kapcsolat.js).
import { index, nev, korLenne, szulohozIllik } from './elem.js';

const rendez = (ix) => (a, b) => (Number(a.sorrend) || 0) - (Number(b.sorrend) || 0) || nev(a, ix).localeCompare(nev(b, ix), 'hu');

// Egy szülő közvetlen gyerekei sorrendben (szuloId üres: a gyökér elemei). Az ismeretlen szülőjű elem is gyökér.
export function gyerekek(elemek, szuloId, ix) {
  const i = ix || index(elemek);
  return (elemek || [])
    .filter((e) => (szuloId ? e.szulo_id === szuloId : !e.szulo_id || !i.has(e.szulo_id)))
    .sort(rendez(i));
}

// A teljes fa: [{ elem, gyerekek: [...] }]. Csak a megadott elemekből (például egy típus vagy szint szűrése után).
export function fa(elemek, ix) {
  const i = ix || index(elemek);
  const sajat = index(elemek);
  const latott = new Set();
  const epit = (szuloId, melyseg) => (elemek || [])
    .filter((e) => (szuloId ? e.szulo_id === szuloId : !e.szulo_id || !sajat.has(e.szulo_id)))
    .sort(rendez(i))
    .filter((e) => !latott.has(e.id) && latott.add(e.id))
    .map((e) => ({ elem: e, gyerekek: melyseg < 30 ? epit(e.id, melyseg + 1) : [] }));
  return epit('', 0);
}

// Az elem ősei a gyökértől (az elem nélkül).
export function osok(e, ix) {
  const ki = [];
  let x = e && e.szulo_id ? ix.get(e.szulo_id) : null;
  const latott = new Set();
  while (x && !latott.has(x.id) && ki.length < 30) {
    ki.unshift(x);
    latott.add(x.id);
    x = x.szulo_id ? ix.get(x.szulo_id) : null;
  }
  return ki;
}

// Az elem összes leszármazottja.
export function leszarmazottak(e, elemek) {
  const ki = [];
  const sor = [e.id];
  const latott = new Set([e.id]);
  while (sor.length) {
    const id = sor.shift();
    (elemek || []).forEach((x) => {
      if (x.szulo_id === id && !latott.has(x.id)) { latott.add(x.id); ki.push(x); sor.push(x.id); }
    });
  }
  return ki;
}

// Áthelyezhető-e az elem az új szülő alá (üres: gyökér). Visszaadja a hiba szövegét, vagy üres szöveget.
export function athelyezesHiba(e, ujSzuloId, ix) {
  if (!ujSzuloId) return '';
  const sz = ix.get(ujSzuloId);
  if (!sz) return 'A szülő nem található.';
  if (sz.id === e.id || korLenne(e.id, ujSzuloId, ix)) return 'Az elem nem kerülhet önmaga vagy a leszármazottja alá.';
  if (!szulohozIllik(e, sz)) return 'Ez az elem nem kerülhet ez alá.';
  return '';
}

// Áthelyezés a testvérek közé, a megadott helyre. Visszaadja a módosuló elemeket (új sorrenddel, szülővel).
export function athelyez(elemek, id, ujSzuloId, hely) {
  const ix = index(elemek);
  const e = ix.get(id);
  if (!e) return [];
  const testverek = gyerekek(elemek.filter((x) => x.id !== id), ujSzuloId || '', ix);
  const h = Math.max(0, Math.min(hely === undefined ? testverek.length : hely, testverek.length));
  const uj = testverek.slice(0, h).concat([{ ...e, szulo_id: ujSzuloId || '' }], testverek.slice(h));
  const ki = [];
  uj.forEach((x, i) => {
    const sorrend = (i + 1) * 10;
    if (x.id === id || Number(x.sorrend) !== sorrend) ki.push({ ...x, sorrend });
  });
  return ki;
}

// Következő sorrendszám a testvérek végére.
export function kovetkezoSorrend(elemek, szuloId) {
  const t = (elemek || []).filter((e) => (szuloId ? e.szulo_id === szuloId : !e.szulo_id));
  return t.reduce((m, e) => Math.max(m, Number(e.sorrend) || 0), 0) + 10;
}

// Útvonal szövegként: „Ős › Szülő › Elem”.
export function utvonal(e, ix) {
  return osok(e, ix).concat([e]).map((x) => nev(x, ix)).join(' › ');
}
