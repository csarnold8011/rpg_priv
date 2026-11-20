// Kampányjátszó 6.3: a kampány jegyzetfüzete (tiszta függvények).
// A jegyzet a Jegyzetek lapon él (háttér: Jegyzetek.gs). Saját jegyzet: csak az írója látja (a DM sem);
// csapatjegyzet: a kampány minden tagja látja és szerkeszti. Köthető egy kiosztott anyaghoz vagy alanyhoz.
// A felület optimistán ment: a helyi (még fel nem ért vagy frissebb) változat a szerver listája fölé kerül.
import { anyagCim, alanyNezet, alanyCel, idorendben, visszavontE } from './anyag.js';

export const LATHATOSAGOK = { sajat: 'Saját', csapat: 'Csapat' };
export const MAX_SZOVEG = 20000;
export const MAX_CIMKE = 12;

const str = (x) => (x === undefined || x === null ? '' : String(x));

export const ujAzon = () => 'j_' + Math.random().toString(36).slice(2, 12).padEnd(10, '0');

export function ujJegyzet({ kampanyId, szerzoId, szerzoNev = '', lathatosag = 'sajat', kapcsolodik = '', karakterId = '', szoveg = '', most } = {}) {
  const ido = most || new Date().toISOString();
  return {
    id: ujAzon(), kampany_id: kampanyId, szerzo_id: szerzoId, szerzo_nev: szerzoNev, karakter_id: karakterId,
    lathatosag: LATHATOSAGOK[lathatosag] ? lathatosag : 'sajat', kapcsolodik, cim: '', szoveg, cimkek: [], rogzitett: false,
    verzio: 0, letrehozva: ido, modositva: ido, modositotta: szerzoNev, aktiv: true
  };
}

// Címkék vesszővel elválasztott szövegből (kis- és nagybetűtől függetlenül egyszer).
export function cimkekSzovegbol(x) {
  const l = (Array.isArray(x) ? x : str(x).split(',')).map((c) => str(c).trim().slice(0, 40)).filter(Boolean);
  return l.filter((c, i) => l.findIndex((y) => y.toLowerCase() === c.toLowerCase()) === i).slice(0, MAX_CIMKE);
}
export const cimkekSzovegge = (l) => (Array.isArray(l) ? l.join(', ') : '');

export const uresE = (j) => !str(j && j.cim).trim() && !str(j && j.szoveg).trim();

// A note.save hívás adata. Új jegyzetnél (verzio 0) a kampány és az „uj” jel megy, a verzió nem.
export function mentendo(j) {
  const o = {
    id: j.id, lathatosag: j.lathatosag, karakter_id: str(j.karakter_id), kapcsolodik: str(j.kapcsolodik),
    cim: str(j.cim).slice(0, 200), szoveg: str(j.szoveg).slice(0, MAX_SZOVEG), cimkek: cimkekSzovegbol(j.cimkek), rogzitett: !!j.rogzitett
  };
  if (!Number(j.verzio)) { o.uj = true; o.kampany_id = j.kampany_id; } else o.verzio = Number(j.verzio);
  return o;
}

// ---- Optimista nézet ----

// helyi: Map(id → { jegyzet, fuggo }). A függő vagy legalább olyan friss helyi változat a szerveré fölé kerül;
// a törölt (aktiv: hamis) jegyzet kimarad.
export function osszefesul(szerver, helyi) {
  const ki = new Map();
  (szerver || []).forEach((j) => ki.set(j.id, j));
  (helyi || new Map()).forEach((h, id) => {
    const sz = ki.get(id);
    if (!sz || h.fuggo || (Number(h.jegyzet.verzio) || 0) >= (Number(sz.verzio) || 0)) ki.set(id, h.jegyzet);
  });
  return [...ki.values()].filter((j) => j.aktiv !== false);
}

// A helyi bejegyzések közül azok, amelyeket a szerver állapota már utolért (törölhetők a helyiek közül).
export function utolertHelyiek(szerver, helyi) {
  const ix = new Map((szerver || []).map((j) => [j.id, j]));
  const ki = [];
  (helyi || new Map()).forEach((h, id) => {
    if (h.fuggo) return;
    const sz = ix.get(id);
    if (sz ? (Number(sz.verzio) || 0) >= (Number(h.jegyzet.verzio) || 0) : h.jegyzet.aktiv === false) ki.push(id);
  });
  return ki;
}

// Rögzítettek elöl, azon belül a legutóbb módosított elöl.
export function sorrend(lista) {
  return (lista || []).slice().sort((a, b) => (b.rogzitett ? 1 : 0) - (a.rogzitett ? 1 : 0)
    || str(b.modositva || b.letrehozva).localeCompare(str(a.modositva || a.letrehozva)));
}

// Ékezet és kisbetű nélkül (a kereséshez).
export const normal = (s) => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Szűrés. sz: { nezet: '' | 'sajat' | 'csapat', kereses, cimke }. kapcsolatNev(j): a kapcsolódó anyag vagy alany neve
// (a keresés arra is talál).
export function szur(lista, sz = {}, kapcsolatNev = () => '') {
  const szavak = normal(sz.kereses).split(/\s+/).filter(Boolean);
  const cimke = normal(sz.cimke);
  return sorrend((lista || []).filter((j) => {
    if (sz.nezet && j.lathatosag !== sz.nezet) return false;
    if (cimke && !(j.cimkek || []).some((c) => normal(c) === cimke)) return false;
    if (!szavak.length) return true;
    const hol = normal([j.cim, j.szoveg, (j.cimkek || []).join(' '), j.szerzo_nev, kapcsolatNev(j)].join(' '));
    return szavak.every((w) => hol.includes(w));
  }));
}

// A használt címkék gyakoriság, majd ábécé szerint: [{ cimke, db }].
export function cimkek(lista) {
  const m = new Map();
  (lista || []).forEach((j) => (j.cimkek || []).forEach((c) => {
    const k = normal(c);
    const e = m.get(k) || { cimke: c, db: 0 };
    e.db++;
    m.set(k, e);
  }));
  return [...m.values()].sort((a, b) => b.db - a.db || a.cimke.localeCompare(b.cimke, 'hu'));
}

export const darab = (lista, nezet) => (lista || []).filter((j) => !nezet || j.lathatosag === nezet).length;

// ---- Kapcsolat anyaghoz vagy alanyhoz ----

// A kapcsolódó anyag vagy alany: { tipus: 'anyag' | 'alany', id, nev, m? } vagy null (ha a kérő nem látja).
export function kapcsolat(j, megosztasok, alanyok) {
  const id = str(j && j.kapcsolodik);
  if (!id) return null;
  const m = (megosztasok || []).find((x) => x.id === id && x.tipus === 'anyag');
  if (m) return visszavontE(m) ? null : { tipus: 'anyag', id, nev: anyagCim(m), m };
  const a = (alanyok || []).find((x) => x.id === id);
  if (!a) return null;
  const cel = alanyNezet((alanyok || []).find((x) => x.id === alanyCel(alanyok, id)) || a);
  return { tipus: 'alany', id, nev: cel.nev };
}

// Választható kapcsolódás: a látható anyagok (időrendben) és az ismert alanyok. dmNev(a): a DM listájába szánt név.
export function kapcsolatOpciok(megosztasok, alanyok, dmNev) {
  const anyagok = idorendben(megosztasok).filter((m) => !visszavontE(m)).map((m) => ({ value: m.id, label: 'Anyag: ' + anyagCim(m) }));
  const al = (alanyok || []).map((a) => ({ value: a.id, label: 'Alany: ' + (dmNev ? dmNev(a) : alanyNezet(a).nev) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'hu'));
  return al.concat(anyagok);
}

// A jegyzetek, amelyek a megadott anyagok vagy alanyok valamelyikéhez kötődnek.
export function kapcsolodok(lista, idk) {
  const s = new Set(idk || []);
  return sorrend((lista || []).filter((j) => j.kapcsolodik && s.has(j.kapcsolodik)));
}

// ---- Ütközés: háromutas összefésülés ----

const MEZOK = ['cim', 'szoveg', 'lathatosag', 'kapcsolodik', 'karakter_id', 'rogzitett'];
const egyenlo = (a, b) => str(a) === str(b);

// alap: amire a saját módosítás épült; enyem: a saját változat; ovek: a szerveren lévő (újabb) változat.
// A csak az egyik oldalon változott mezők átjönnek; a címkék halmazként fésülődnek; a szövegnél, ha mindkét fél csak
// a végére írt, a két hozzáírás egymás után kerül. Ami így sem megy, az az „utkozo” listába kerül (ott a saját marad).
export function haromUtas(alap, enyem, ovek) {
  const a = alap || {};
  const ki = { ...ovek };
  const utkozo = [];
  MEZOK.forEach((f) => {
    const x = a[f], m = enyem[f], o = ovek[f];
    if (egyenlo(m, x) || egyenlo(m, o)) return;          // nálam nem változott, vagy ugyanaz lett
    if (egyenlo(o, x)) { ki[f] = m; return; }             // csak nálam változott
    if (f === 'szoveg' && str(m).startsWith(str(x)) && str(o).startsWith(str(x))) {
      ki[f] = str(o) + str(m).slice(str(x).length);       // mindketten a végére írtak
      return;
    }
    ki[f] = m;
    utkozo.push(f);
  });
  const ac = new Set((a.cimkek || []).map(normal));
  const mc = (enyem.cimkek || []);
  const torolt = new Set([...ac].filter((c) => !mc.some((y) => normal(y) === c)));
  ki.cimkek = cimkekSzovegbol((ovek.cimkek || []).filter((c) => !torolt.has(normal(c))).concat(mc.filter((c) => !ac.has(normal(c)))));
  ki.verzio = ovek.verzio;
  return { jegyzet: ki, utkozo };
}

// „Mindkettő”: a másik változat szövege marad, alá a saját.
export function egymasAla(enyem, ovek) {
  const o = str(ovek.szoveg), m = str(enyem.szoveg);
  return { ...ovek, cim: str(ovek.cim) || str(enyem.cim), szoveg: o === m || !m ? o : !o ? m : o + '\n\n' + m,
    cimkek: cimkekSzovegbol((ovek.cimkek || []).concat(enyem.cimkek || [])), verzio: ovek.verzio };
}

// ---- Megjelenítés ----

// „Bence (Morg)”, a saját jegyzeten „te”.
export function szerzoSzoveg(j, karakterek, felhasznaloId) {
  const ki = j.szerzo_id && j.szerzo_id === felhasznaloId ? 'te' : str(j.szerzo_nev) || 'ismeretlen';
  const kar = j.karakter_id && (karakterek || []).find((c) => c.id === j.karakter_id);
  return kar ? `${ki} (${kar.nev})` : ki;
}

// A mások által a megadott időpont óta módosított csapatjegyzetek száma (a fül jelvényéhez).
export function ujCsapatjegyzetek(lista, ota, felhasznaloNev) {
  if (!ota) return 0;
  return (lista || []).filter((j) => j.lathatosag === 'csapat' && str(j.modositva) > str(ota) && str(j.modositotta) !== str(felhasznaloNev)).length;
}
