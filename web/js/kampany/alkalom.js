// Kampányjátszó 6.4: az élő munkamenet (alkalom) és a kalandnapló. Tiszta függvények, a felület (web/js/app/alkalom.js)
// és a teszt (tools/teszt/alkalom.mjs) is használja. Terv: claude/kampanyjatszo-terv.md, „6.4”.
//
// Az alkalom a könyv „game session”-je (Alapkönyv 7. fejezet, 88–89. oldal): valós és játékbeli dátum, sorszám. A háttérben
// az Alkalmak lap egy sora (backend/Alkalmak.gs); a játék állapota az adat JSON-ban:
//   { v, kaland_id, aktualis, jelenetek: { elemId: allapot }, utemek: { utemId: allapot },
//     naplo: [esemény], gyorsjegyzetek: [{ id, ido, szoveg, jelenet_id }],
//     szereplok: [{ id, tipus: njk|alany|elem|szabad, ref_id, nev, jegyzet, nyilvanos }],
//     szalak: [{ id, cim, allapot: nyitott|lezart, jegyzet }],
//     osszefoglalo: { szoveg, jatekosoknak, itt: [szereplő id], xp: [{ nev, xp }], kincsek } }
// A jelenetek és ütemek állapota, a fontos szereplők és a futó szálak a kampányé: az új alkalom a legutóbbitól örökli
// (a lezárt szálak nélkül), így a legutolsó alkalom mindig a kampány aktuális játékállapota.
// Esemény: { id, kulcs?, ido, fajta, szoveg, jelenet_id, adat? }. A kulcsos események az állapotból jönnek (próba, anyag,
// csata, XP, pénz), kulcs szerint egyszer szerepelnek, és frissülnek (például a próba eredménye).
import { megjelenitett, nev as elemNev } from './elem.js';
import { gyerekek } from './fa.js';
import { kalandJelenetei, jelenetFelold, utemSor, ivSzerint } from './kaland.js';
import { lenyekNorm } from './jelenet.js';
import { penzSzoveg } from '../karakter/varazslo.js';
import { alkalomCim, valosIdoSzoveg, jatekbeliIdoSzoveg } from './alkalom_ido.js';
import { vasarlasEsemenyek } from './vasarlas.js';
import { pihenesEsemenyek } from '../karakter/pihenes.js';

export { alkalomCim, valosIdoSzoveg, jatekbeliIdoSzoveg };

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();
const vag = (x, n) => szoveg(x).slice(0, n);

export const JELENET_ALLAPOTOK = {
  '': { nev: 'nem kezdett', jel: '○' },
  folyamatban: { nev: 'folyamatban', jel: '◐' },
  kesz: { nev: 'kész', jel: '●' },
  kihagyva: { nev: 'kihagyva', jel: '⊘' }
};
export const UTEM_ALLAPOTOK = { '': 'hátravan', kesz: 'megtörtént', kihagyva: 'kimaradt' };
export const SZAL_ALLAPOTOK = { nyitott: 'nyitott', lezart: 'lezárva' };
export const SZEREPLO_TIPUSOK = { njk: 'NJK', alany: 'alany', elem: 'elem', szabad: 'szabad' };
export const ESEMENY_FAJTAK = {
  jelenet: 'Jelenet', proba: 'Próba', csata: 'Csata', anyag: 'Anyag', xp: 'XP', penz: 'Pénz', jutalom: 'Jutalom', pihenes: 'Pihenés', jegyzet: 'Jegyzet', alkalom: 'Alkalom', egyeb: 'Egyéb'
};

export const MAX_NAPLO = 250;
export const MAX_ESEMENY_SZOVEG = 240;
export const MAX_GYORS = 100;
export const MAX_GYORS_SZOVEG = 400;
export const MAX_SZEREPLO = 80;
export const MAX_SZAL = 60;
export const MAX_MERET = 45000; // a táblázat cellája 50 000 karakter
export const FIGYELMEZTETES_MERET = 38000;

const rand = (n) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
export const ujAlkalomId = () => 'a_' + rand(10);
export const ujId = (elotag = 'e') => elotag + rand(8);

// ---------- Normalizálás ----------

function esemenyNorm(e) {
  const o = obj(e);
  const ki = { id: szoveg(o.id) || ujId('e'), ido: szoveg(o.ido), fajta: ESEMENY_FAJTAK[o.fajta] ? o.fajta : 'egyeb',
    szoveg: vag(o.szoveg, MAX_ESEMENY_SZOVEG), jelenet_id: szoveg(o.jelenet_id) };
  if (van(o.kulcs)) ki.kulcs = szoveg(o.kulcs);
  if (o.adat && typeof o.adat === 'object') ki.adat = o.adat;
  return ki;
}

export function szereploNorm(x, i) {
  const o = obj(x);
  return { id: szoveg(o.id) || 'sz' + ((i || 0) + 1), tipus: SZEREPLO_TIPUSOK[o.tipus] ? o.tipus : 'szabad', ref_id: szoveg(o.ref_id),
    nev: vag(o.nev, 120), jegyzet: vag(o.jegyzet, 600), nyilvanos: vag(o.nyilvanos, 300) };
}
export function szalNorm(x, i) {
  const o = obj(x);
  return { id: szoveg(o.id) || 'sl' + ((i || 0) + 1), cim: vag(o.cim, 160), allapot: SZAL_ALLAPOTOK[o.allapot] ? o.allapot : 'nyitott',
    jegyzet: vag(o.jegyzet, 800) };
}

export function osszefoglaloNorm(x) {
  const o = obj(x);
  return {
    szoveg: vag(o.szoveg, 12000), jatekosoknak: vag(o.jatekosoknak, 6000),
    itt: Array.from(new Set(lista(o.itt).map(szoveg).filter(Boolean))),
    xp: lista(o.xp).map((t) => ({ nev: szoveg(obj(t).nev), xp: Number(obj(t).xp) || 0 })),
    kincsek: vag(o.kincsek, 2000)
  };
}

const allapotTerkep = (x, ervenyes) => {
  const ki = {};
  Object.keys(obj(x)).forEach((k) => { if (ervenyes[x[k]] !== undefined && x[k]) ki[k] = x[k]; });
  return ki;
};

export function adatNorm(x) {
  const o = obj(x);
  return {
    v: 1,
    kaland_id: szoveg(o.kaland_id),
    aktualis: szoveg(o.aktualis),
    jelenetek: allapotTerkep(o.jelenetek, JELENET_ALLAPOTOK),
    utemek: allapotTerkep(o.utemek, UTEM_ALLAPOTOK),
    naplo: lista(o.naplo).map(esemenyNorm),
    gyorsjegyzetek: lista(o.gyorsjegyzetek).map((g) => {
      const x2 = obj(g);
      return { id: szoveg(x2.id) || ujId('g'), ido: szoveg(x2.ido), szoveg: vag(x2.szoveg, MAX_GYORS_SZOVEG), jelenet_id: szoveg(x2.jelenet_id) };
    }),
    szereplok: lista(o.szereplok).map(szereploNorm),
    szalak: lista(o.szalak).map(szalNorm),
    osszefoglalo: osszefoglaloNorm(o.osszefoglalo)
  };
}

export function alkalomNorm(x) {
  const o = obj(x);
  return {
    id: szoveg(o.id), kampany_id: szoveg(o.kampany_id), sorszam: Number(o.sorszam) || 1, cim: vag(o.cim, 160),
    allapot: o.allapot === 'lezart' ? 'lezart' : 'fut', kezdet: szoveg(o.kezdet), veg: szoveg(o.veg),
    jatekbeli_datum: vag(o.jatekbeli_datum, 120), jatekbeli_veg: vag(o.jatekbeli_veg, 120), kozzeteve: o.kozzeteve === true,
    verzio: Number(o.verzio) || 0, adat: adatNorm(o.adat)
  };
}

export const futE = (a) => !!a && a.allapot !== 'lezart';

// ---------- Új alkalom ----------

// Az előző alkalomtól öröklött játékállapot: jelenetek és ütemek állapota, a kiválasztott kaland és jelenet, a fontos
// szereplők, a nyitott szálak. Az eseménynapló, a gyorsjegyzetek és az összefoglaló üresen indul.
export function atvitel(elozoAdat) {
  const e = adatNorm(elozoAdat);
  return {
    ...adatNorm({}),
    kaland_id: e.kaland_id, aktualis: e.aktualis, jelenetek: { ...e.jelenetek }, utemek: { ...e.utemek },
    szereplok: e.szereplok.map((x) => ({ ...x })), szalak: e.szalak.filter((s) => s.allapot !== 'lezart').map((s) => ({ ...s }))
  };
}

// elozo: a kampány legutóbbi alkalma (vagy null). most: ISO idő.
export function ujAlkalom({ kampanyId, elozo = null, jatekbeliDatum = '', cim = '', most, id } = {}) {
  const ido = most || new Date().toISOString();
  const adat = elozo ? atvitel(elozo.adat) : adatNorm({});
  adat.naplo = [esemenyNorm({ id: ujId('e'), ido, fajta: 'alkalom', szoveg: 'Az alkalom elkezdődött.' })];
  return {
    id: id || ujAlkalomId(), kampany_id: kampanyId || '', sorszam: (elozo ? Number(elozo.sorszam) || 0 : 0) + 1, cim: vag(cim, 160),
    allapot: 'fut', kezdet: ido, veg: '', jatekbeli_datum: vag(jatekbeliDatum, 120), jatekbeli_veg: '', kozzeteve: false, verzio: 0, adat
  };
}

// A háttérnek küldött mentés (session.save): az oszlopok és az adat, a verzióval.
export function mentendo(a) {
  const n = alkalomNorm(a);
  const o = { id: n.id, verzio: n.verzio, cim: n.cim, allapot: n.allapot, veg: n.veg, jatekbeli_datum: n.jatekbeli_datum,
    jatekbeli_veg: n.jatekbeli_veg, kozzeteve: n.kozzeteve, adat: n.adat };
  if (!n.verzio) { o.uj = true; o.kampany_id = n.kampany_id; o.kezdet = n.kezdet; }
  return o;
}

// A mentés mérete (karakter) és a korlát.
export function meret(a) { return JSON.stringify(adatNorm(obj(a).adat)).length; }
export function meretAllapot(a) {
  const m = meret(a);
  return { meret: m, tul: m > MAX_MERET, figyelmeztet: m > FIGYELMEZTETES_MERET };
}

// Túl nagy adatnál a legrégebbi események és gyorsjegyzetek kiesnek (a szereplők, szálak és az összefoglaló maradnak).
export function karcsusit(adat) {
  const a = adatNorm(adat);
  if (a.naplo.length > MAX_NAPLO) a.naplo = a.naplo.slice(-MAX_NAPLO);
  if (a.gyorsjegyzetek.length > MAX_GYORS) a.gyorsjegyzetek = a.gyorsjegyzetek.slice(-MAX_GYORS);
  while (JSON.stringify(a).length > MAX_MERET && a.naplo.length > 20) a.naplo = a.naplo.slice(Math.ceil(a.naplo.length / 10));
  return a;
}

// ---------- Jelenetek, ütemek, aktuális jelenet ----------

export const jelenetAllapot = (adat, id) => (obj(obj(adat).jelenetek)[id] || '');
export const utemAllapot = (adat, id) => (obj(obj(adat).utemek)[id] || '');

const esemenyHozza = (a, e) => { a.naplo = a.naplo.concat([esemenyNorm(e)]); if (a.naplo.length > MAX_NAPLO) a.naplo = a.naplo.slice(-MAX_NAPLO); };

// A jelenet állapota. opciok: { ido, nev (a napló szövegéhez) }. Új adatot ad.
export function jelenetBeallit(adat, id, allapot, { ido, nev = '' } = {}) {
  const a = adatNorm(adat);
  if (!id || JELENET_ALLAPOTOK[allapot || ''] === undefined) return a;
  if ((a.jelenetek[id] || '') === (allapot || '')) return a;
  if (allapot) a.jelenetek[id] = allapot; else delete a.jelenetek[id];
  if (!allapot && a.aktualis === id) a.aktualis = '';
  const t = { folyamatban: 'elkezdődött', kesz: 'kész', kihagyva: 'kimaradt', '': 'visszaállítva (nem kezdett)' }[allapot || ''];
  esemenyHozza(a, { ido: ido || new Date().toISOString(), fajta: 'jelenet', szoveg: (nev || 'Jelenet') + ': ' + t,
    jelenet_id: id, adat: { jelenet_id: id, allapot: allapot || '' } });
  return a;
}

// Az aktuális jelenet: ha még nem kezdődött el, folyamatban lesz. Az előző aktuális állapota nem változik.
export function aktualisBeallit(adat, id, { ido, nev = '', kalandId = '' } = {}) {
  let a = adatNorm(adat);
  if (a.aktualis === id && (!id || a.jelenetek[id])) return a;
  if (id && !a.jelenetek[id]) a = jelenetBeallit(a, id, 'folyamatban', { ido, nev });
  else if (id) esemenyHozza(a, { ido: ido || new Date().toISOString(), fajta: 'jelenet', szoveg: (nev || 'Jelenet') + ': aktuális', jelenet_id: id, adat: { jelenet_id: id, aktualis: true } });
  a.aktualis = id || '';
  if (kalandId) a.kaland_id = kalandId;
  return a;
}

export function utemBeallit(adat, id, allapot) {
  const a = adatNorm(adat);
  if (!id || UTEM_ALLAPOTOK[allapot || ''] === undefined) return a;
  if (allapot) a.utemek[id] = allapot; else delete a.utemek[id];
  return a;
}

// Melyik jelenet volt az aktuális egy időpontban (a jelenet eseményei szerint).
export function jelenetIdoben(adat, ido) {
  const a = obj(adat);
  let ki = '';
  lista(a.naplo).forEach((e) => {
    if (e.fajta !== 'jelenet' || !e.adat || !e.adat.jelenet_id) return;
    if (szoveg(e.ido) > szoveg(ido)) return;
    if (e.adat.allapot === 'folyamatban' || e.adat.aktualis) ki = e.adat.jelenet_id;
    else if ((e.adat.allapot === 'kesz' || e.adat.allapot === 'kihagyva' || e.adat.allapot === '') && ki === e.adat.jelenet_id) ki = '';
  });
  return ki;
}

// ---------- Gyorsjegyzet (a könyv „game notes”-a) ----------

export function gyorsjegyzetHozzaad(adat, { id, ido, szoveg: sz, jelenet_id } = {}) {
  const a = adatNorm(adat);
  const t = szoveg(sz).trim();
  if (!t) return a;
  a.gyorsjegyzetek = a.gyorsjegyzetek.concat([{ id: id || ujId('g'), ido: ido || new Date().toISOString(), szoveg: vag(t, MAX_GYORS_SZOVEG),
    jelenet_id: jelenet_id === undefined ? a.aktualis : szoveg(jelenet_id) }]);
  if (a.gyorsjegyzetek.length > MAX_GYORS) a.gyorsjegyzetek = a.gyorsjegyzetek.slice(-MAX_GYORS);
  return a;
}
export function gyorsjegyzetTorol(adat, id) {
  const a = adatNorm(adat);
  a.gyorsjegyzetek = a.gyorsjegyzetek.filter((g) => g.id !== id);
  return a;
}

// ---------- Eseménynapló az állapotból ----------

const nevOf = (karakterek, id) => ((lista(karakterek).find((c) => c.id === id) || {}).nev) || 'ismeretlen';
const benne = (ido, kezdet, veg) => !!ido && szoveg(ido) >= szoveg(kezdet) && (!veg || szoveg(ido) <= szoveg(veg));

// A kampány állapotából (state.get, DM) az alkalom ideje alatt történt dolgok, kulcsos eseményként.
// Próbakérés (eredménnyel), kiosztott anyag, csata (indult, lezárult), XP-kiosztás (karakterenként összevonva), pénz.
export function esemenyekAllapotbol(allapot, alkalom) {
  const st = obj(allapot);
  const al = obj(alkalom);
  const kezdet = szoveg(al.kezdet);
  if (!kezdet) return [];
  const veg = al.allapot === 'lezart' ? szoveg(al.veg) : '';
  const karakterek = lista(st.karakterek);
  const ki = [];
  lista(st.probak).forEach((p) => {
    if (!benne(p.letrehozva, kezdet, veg)) return;
    const allas = obj(p.allas);
    const eredmenyek = Object.keys(allas).filter((k) => k[0] !== '_' && allas[k] && allas[k].utolso).map((k) => ({
      nev: nevOf(karakterek, k), eredmeny: szoveg(allas[k].utolso.eredmeny), osszeg: Number(allas[k].utolso.osszeg) || 0
    }));
    ki.push({ kulcs: 'proba:' + p.id, ido: p.letrehozva, fajta: 'proba', szoveg: szoveg(p.cim) || 'Próba',
      adat: { tipus: szoveg(p.tipus), lezart: p.allapot === 'lezart', eredmenyek } });
  });
  lista(st.megosztasok).forEach((m) => {
    if (m.tipus !== 'anyag' || !benne(m.idopont, kezdet, veg)) return;
    const c = Array.isArray(m.cimzettek) && m.cimzettek.length ? m.cimzettek : [m.cimzett || 'mindenki'];
    ki.push({ kulcs: 'anyag:' + m.id, ido: m.idopont, fajta: 'anyag', szoveg: szoveg(m.cim) || 'Anyag',
      adat: { mindenki: c.includes('mindenki'), cimzettek: c.includes('mindenki') ? [] : c.map((id) => nevOf(karakterek, id)),
        alany_id: szoveg(m.alany_id), visszavont: m.allapot === 'visszavont', fajta: szoveg(obj(m.adat).fajta) } });
  });
  lista(st.csatak).forEach((c) => {
    const indult = benne(c.letrehozva, kezdet, veg);
    const lezarult = c.allapot === 'lezart' && benne(c.lezarva, kezdet, veg);
    if (!indult && !lezarult) return;
    ki.push({ kulcs: 'csata:' + c.id, ido: indult ? c.letrehozva : c.lezarva, fajta: 'csata', szoveg: szoveg(c.cim) || 'Csata',
      adat: { lezart: c.allapot === 'lezart', osszecsapas_id: szoveg(c.osszecsapas_id) } });
  });
  const xpCsoport = new Map();
  karakterek.forEach((c) => {
    const d = obj(c.adat);
    lista(d.xp_naplo).forEach((x) => {
      if (x.kampany_id && x.kampany_id !== obj(st.kampany).id) return;
      if (!benne(x.idopont, kezdet, veg)) return;
      const k = 'xp:' + x.idopont + ':' + szoveg(x.ok);
      if (!xpCsoport.has(k)) xpCsoport.set(k, { kulcs: k, ido: x.idopont, fajta: 'xp', szoveg: szoveg(x.ok) || 'XP', adat: { tetelek: [] } });
      xpCsoport.get(k).adat.tetelek.push({ nev: c.nev, xp: Number(x.xp) || 0 });
    });
    lista(obj(d.felszereles).jatek).forEach((t) => {
      if (!benne(t.idopont, kezdet, veg) || !Number(t.penz) || t.kiosztas_id || t.vasarlas_id) return; // a kiosztásoké és a vásárlásoké lent
      ki.push({ kulcs: 'penz:' + c.id + ':' + t.idopont, ido: t.idopont, fajta: 'penz', szoveg: szoveg(t.megjegyzes) || szoveg(t.nev) || '',
        adat: { nev: c.nev, penz: Number(t.penz) || 0, tipus: szoveg(t.tipus) } });
    });
  });
  xpCsoport.forEach((e) => ki.push(e));
  // 6.5: a kiosztások (jutalom, kincs, zsákmány, kassza) a kassza naplójából. A karakterek pénze karakterenként „pénz”
  // esemény (a karakter pénztételével azonos kulccsal), a többi (cím, tárgy, társ, a kassza mozgása) egy „jutalom” esemény.
  // A visszavont kiosztás eseményei „visszavonva” jelet kapnak.
  lista(obj(obj(st.kampany).kassza).naplo).forEach((x) => {
    if (!x || !benne(x.idopont, kezdet, veg)) return;
    const vissza = !!x.visszavonva;
    const tetelek = [];
    lista(x.karakterek).forEach((t) => {
      const nev = szoveg(t.nev) || nevOf(karakterek, t.id);
      if (Number(t.penz)) {
        ki.push({ kulcs: 'penz:' + t.id + ':' + x.idopont, ido: x.idopont, fajta: 'penz', szoveg: szoveg(x.ok),
          adat: { nev, penz: Number(t.penz) || 0, tipus: 'penz', kiosztas_id: x.id, ...(vissza ? { visszavont: true } : {}) } });
      }
      if (t.targy || t.jutalom) tetelek.push({ nev, mit: szoveg((t.targy && t.targy.nev) || (t.jutalom && t.jutalom.nev)), fajta: szoveg(t.jutalom ? t.jutalom.fajta : 'targy') });
    });
    const kassza = Number(x.kassza) || 0;
    if (!tetelek.length && !kassza && !x.tars) return;
    ki.push({ kulcs: 'kiosztas:' + x.id, ido: x.idopont, fajta: 'jutalom', szoveg: szoveg(x.ok) || szoveg(x.kassza_megjegyzes) || 'Kiosztás',
      adat: { kiosztas_id: x.id, fajta: szoveg(x.fajta), tetelek, kassza, tars: x.tars ? { nev: szoveg(x.tars.nev), csapat: x.tars.kotodes === 'csapat' } : null,
        ...(vissza ? { visszavont: true } : {}) } });
  });
  // 6.6: a boltok vásárlásai és eladásai (a bolt naplójából) karakterenként „pénz” esemény.
  vasarlasEsemenyek(st, (ido) => benne(ido, kezdet, veg)).forEach((e) => ki.push(e));
  // 6.7: a pihenések (a csapat egyszerre adott pihenése egy esemény)
  pihenesEsemenyek(karakterek, obj(st.kampany).id, (ido) => benne(ido, kezdet, veg)).forEach((e) => ki.push(e));
  return ki.sort((a, b) => szoveg(a.ido).localeCompare(szoveg(b.ido)));
}

// Rövid, stabil azonosító egy kulcsból (FNV-1a, 32 bit, 36-os számrendszerben).
function hash(x) {
  let h = 0x811c9dc5;
  for (let i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36) + x.length.toString(36);
}

// A jelöltek beolvasztása a naplóba: az új kulcsok bekerülnek (az akkori jelenethez kötve), a meglévők tartalma frissül.
// Visszaad: { adat, valtozott }.
export function esemenyekBeolvasztasa(adat, jeloltek) {
  const a = adatNorm(adat);
  let valtozott = false;
  const kulcsok = new Map(a.naplo.map((e, i) => [e.kulcs, i]));
  lista(jeloltek).forEach((j) => {
    const n = esemenyNorm({ ...j, id: j.id || 'k' + hash(szoveg(j.kulcs)) });
    if (kulcsok.has(n.kulcs)) {
      const i = kulcsok.get(n.kulcs);
      const regi = a.naplo[i];
      if (regi.szoveg !== n.szoveg || JSON.stringify(regi.adat || null) !== JSON.stringify(n.adat || null)) {
        a.naplo[i] = { ...regi, szoveg: n.szoveg, adat: n.adat };
        valtozott = true;
      }
      return;
    }
    n.jelenet_id = jelenetIdoben(a, n.ido);
    a.naplo.push(n);
    kulcsok.set(n.kulcs, a.naplo.length - 1);
    valtozott = true;
  });
  if (valtozott) {
    a.naplo.sort((x, y) => szoveg(x.ido).localeCompare(szoveg(y.ido)));
    if (a.naplo.length > MAX_NAPLO) a.naplo = a.naplo.slice(-MAX_NAPLO);
  }
  return { adat: a, valtozott };
}

// Egy esemény egysoros szövege (a napló listájához és az összefoglalóhoz).
export function esemenySzoveg(e) {
  const d = obj(e.adat);
  if (e.fajta === 'proba') {
    const er = lista(d.eredmenyek).map((x) => x.nev + (x.eredmeny ? ' ' + x.eredmeny : ' ' + x.osszeg)).join(', ');
    return 'Próba: ' + e.szoveg + (er ? ' (' + er + ')' : d.lezart ? ' (lezárva)' : ' (kiküldve)');
  }
  if (e.fajta === 'anyag') return 'Anyag: ' + e.szoveg + ' (' + (d.mindenki ? 'mindenkinek' : lista(d.cimzettek).join(', ')) + (d.visszavont ? ', visszavonva' : '') + ')';
  if (e.fajta === 'csata') return 'Csata: ' + e.szoveg + (d.lezart ? ' (lezárva)' : ' (elkezdődött)');
  if (e.fajta === 'xp') return 'XP: ' + e.szoveg + ' (' + lista(d.tetelek).map((t) => t.nev + ' ' + t.xp).join(', ') + ')';
  if (e.fajta === 'penz') return 'Pénz: ' + d.nev + ' ' + (d.penz > 0 ? '+' : '') + penzSzoveg(d.penz) + (van(e.szoveg) ? ' (' + e.szoveg + ')' : '') + (d.visszavont ? ', visszavonva' : '');
  if (e.fajta === 'jutalom') {
    const r = lista(d.tetelek).map((t) => t.nev + (t.mit ? ': ' + t.mit : ''));
    if (d.tars) r.push('társ: ' + (d.tars.nev || 'NJK') + (d.tars.csapat ? ' (a csapaté)' : ''));
    if (Number(d.kassza)) r.push('kassza ' + (d.kassza > 0 ? '+' : '') + penzSzoveg(d.kassza));
    return 'Jutalom: ' + e.szoveg + (r.length ? ' (' + r.join(', ') + ')' : '') + (d.visszavont ? ', visszavonva' : '');
  }
  if (e.fajta === 'pihenes') {
    const r = lista(d.tetelek).map((t) => t.nev + ' ' + [Number(t.eg) ? (t.eg > 0 ? '+' : '−') + Math.abs(t.eg) + ' Egészség' : '', Number(t.mp) ? (t.mp > 0 ? '+' : '−') + Math.abs(t.mp) + ' MP' : ''].filter(Boolean).join(', ')
      .replace(/^$/, 'változatlan'));
    return 'Pihenés: ' + e.szoveg + (r.length ? ' (' + r.join('; ') + ')' : '') + (d.visszavont ? ', visszavonva' : '');
  }
  return e.szoveg;
}

// ---------- A kaland fája és az ütemsor a Játék nézethez ----------

// A kampány kalandjai a játékhoz (az aktív kalandok, ív szerint).
export function kampanyKalandjai(elemek, ix, kampanyId) {
  const k = lista(elemek).filter((e) => e.tipus === 'kaland' && e.kampany_id === kampanyId && e.aktiv !== false);
  return ivSzerint(k, ix).flatMap((c) => c.kalandok);
}

// A kaland fájának sorai (mélységi bejárás): [{ elem, melyseg }]. Csak a részek és a jelenetek, az aktívak.
export function kalandSorok(kaland, elemek, ix) {
  const ki = [];
  const latott = new Set();
  const bejar = (e, m) => {
    if (!e || latott.has(e.id) || m > 30) return;
    latott.add(e.id);
    ki.push({ elem: e, melyseg: m });
    gyerekek(elemek, e.id, ix).filter((g) => (g.tipus === 'resz' || g.tipus === 'jelenet') && g.aktiv !== false).forEach((g) => bejar(g, m + 1));
  };
  bejar(kaland, 0);
  return ki;
}

// A kaland ütemsora a jelenetek feloldásával: [{ utem, gazda, jelenet }].
export function kalandUtemei(kaland, elemek, ix) {
  return utemSor(kaland, elemek, ix).map((x) => ({ ...x, jelenet: jelenetFelold(x.utem.jelenet_id, kaland, elemek, ix) }));
}

// Melyik kalandé az elem (a fa szerint).
export function kalandjaId(id, ix) {
  let x = ix.get(id);
  const latott = new Set();
  while (x && !latott.has(x.id)) {
    if (x.tipus === 'kaland') return x.id;
    latott.add(x.id);
    x = x.szulo_id ? ix.get(x.szulo_id) : null;
  }
  return '';
}

// A következő jelenet a kaland sorrendjében: az aktuális utáni első, ami nincs kész és nem maradt ki; ha ilyen nincs, az
// elejéről az első ilyen. Nincs: null.
export function kovetkezoJelenet(kaland, elemek, ix, adat, tolId) {
  const j = kalandJelenetei(kaland, elemek, ix);
  const nyitott = (x) => !['kesz', 'kihagyva'].includes(jelenetAllapot(adat, x.id)) && x.id !== tolId;
  const i = j.findIndex((x) => x.id === tolId);
  return j.slice(i + 1).find(nyitott) || j.slice(0, Math.max(0, i)).find(nyitott) || null;
}

// A kaland haladása: { osszes, kesz, kihagyva, folyamatban }.
export function kalandHaladas(kaland, elemek, ix, adat) {
  const j = kalandJelenetei(kaland, elemek, ix);
  const db = (a) => j.filter((x) => jelenetAllapot(adat, x.id) === a).length;
  return { osszes: j.length, kesz: db('kesz'), kihagyva: db('kihagyva'), folyamatban: db('folyamatban') };
}

// ---------- Fontos szereplők ----------

// A szerepelt NJK-k és alanyok jelöltjei ebből az alkalomból: a lejátszott jelenetek lényei (NJK-tárból), a kiosztott
// anyagok alanyai. allapot: state.get (DM). Visszaad: [{ tipus, ref_id, nev }].
export function szereploJeloltek(alkalom, { allapot, elemek, ix } = {}) {
  const a = adatNorm(obj(alkalom).adat);
  const ki = [];
  const hozza = (tipus, ref, nev) => { if (ref && !ki.some((x) => x.tipus === tipus && x.ref_id === ref)) ki.push({ tipus, ref_id: ref, nev }); };
  const njkk = lista(obj(allapot).njkk);
  const jelenetek = new Set(a.naplo.filter((e) => e.fajta === 'jelenet' && e.jelenet_id).map((e) => e.jelenet_id));
  if (ix) jelenetek.forEach((id) => {
    const j = ix.get(id);
    if (!j) return;
    lenyekNorm(megjelenitett(j, ix).lenyek).filter((l) => l.forras === 'njk' && l.ref_id).forEach((l) => {
      const n = njkk.find((x) => x.id === l.ref_id);
      hozza('njk', l.ref_id, n ? n.nev : l.nev || 'NJK');
    });
  });
  const alanyok = lista(obj(allapot).alanyok);
  a.naplo.filter((e) => e.fajta === 'anyag' && e.adat && e.adat.alany_id).forEach((e) => {
    const al = alanyok.find((x) => x.id === e.adat.alany_id);
    if (al) hozza('alany', al.id, szoveg(al.cim) || 'alany');
  });
  return ki;
}

// A jelöltek a szereplőlistába (ami még nincs benne), és az alkalom „itt” listája. Visszaad: új adatot.
export function szereplokFelvetele(adat, jeloltek, ujIdFn = () => ujId('sz')) {
  const a = adatNorm(adat);
  const itt = new Set(a.osszefoglalo.itt);
  lista(jeloltek).forEach((j) => {
    let sz = a.szereplok.find((x) => x.tipus === j.tipus && x.ref_id && x.ref_id === j.ref_id);
    if (!sz) {
      if (a.szereplok.length >= MAX_SZEREPLO) return;
      sz = szereploNorm({ id: ujIdFn(), tipus: j.tipus, ref_id: j.ref_id, nev: j.nev });
      a.szereplok.push(sz);
    }
    itt.add(sz.id);
  });
  a.osszefoglalo.itt = Array.from(itt);
  return a;
}

// ---------- Az összefoglaló vázlata (AI nélkül, az eseménynaplóból és a gyorsjegyzetekből) ----------

// XP összesítés karakterenként és a pénzmozgás az eseményekből.
export function xpOsszesites(naplo) {
  const m = new Map();
  lista(naplo).filter((e) => e.fajta === 'xp').forEach((e) => lista(obj(e.adat).tetelek).forEach((t) => m.set(t.nev, (m.get(t.nev) || 0) + (Number(t.xp) || 0))));
  return Array.from(m, ([nev, xp]) => ({ nev, xp }));
}
export function penzOsszesites(naplo) {
  const m = new Map();
  lista(naplo).filter((e) => e.fajta === 'penz' && !obj(e.adat).visszavont).forEach((e) => { const d = obj(e.adat); m.set(d.nev, (m.get(d.nev) || 0) + (Number(d.penz) || 0)); });
  lista(naplo).filter((e) => e.fajta === 'jutalom' && !obj(e.adat).visszavont && Number(obj(e.adat).kassza))
    .forEach((e) => m.set('Csapatkassza', (m.get('Csapatkassza') || 0) + Number(e.adat.kassza)));
  return Array.from(m, ([nev, penz]) => ({ nev, penz })).filter((x) => x.penz);
}

// Mondatvég: pont, ha a szöveg nem írásjellel végződik („Aratás hava 4.” után nem kerül még egy).
const pont = (x) => (/[.!?…]$/.test(szoveg(x).trim()) ? szoveg(x).trim() : szoveg(x).trim() + '.');

// ctx: { jelenetNev(id), helyszinek(jelenetId) → [név] }. Visszaad: { szoveg, jatekosoknak, xp, kincsek }.
export function vazlat(alkalom, ctx = {}) {
  const al = alkalomNorm(alkalom);
  const a = al.adat;
  const jNev = ctx.jelenetNev || ((id) => id);
  const sorok = [];
  const ido = valosIdoSzoveg(al);
  if (ido) sorok.push(pont('Valós idő: ' + ido));
  const jb = jatekbeliIdoSzoveg(al);
  if (jb) sorok.push(pont('Játékbeli idő: ' + jb));
  // a lejátszott jelenetek sorrendje: ahogy először előkerültek
  const sorrend = [];
  a.naplo.forEach((e) => { if (e.jelenet_id && !sorrend.includes(e.jelenet_id)) sorrend.push(e.jelenet_id); });
  a.gyorsjegyzetek.forEach((g) => { if (g.jelenet_id && !sorrend.includes(g.jelenet_id)) sorrend.push(g.jelenet_id); });
  const helyek = [];
  if (ctx.helyszinek) sorrend.forEach((id) => lista(ctx.helyszinek(id)).forEach((h) => { if (!helyek.includes(h)) helyek.push(h); }));
  if (helyek.length) sorok.push(pont('Helyszínek: ' + helyek.join(', ')));
  const tetelek = (jid) => a.naplo.filter((e) => e.jelenet_id === jid && e.fajta !== 'jelenet' && e.fajta !== 'alkalom').map((e) => ({ ido: e.ido, sz: esemenySzoveg(e) }))
    .concat(a.gyorsjegyzetek.filter((g) => g.jelenet_id === jid).map((g) => ({ ido: g.ido, sz: 'Jegyzet: ' + g.szoveg })))
    .sort((x, y) => szoveg(x.ido).localeCompare(szoveg(y.ido)));
  if (sorrend.length) {
    sorok.push('', 'Jelenetek:');
    sorrend.forEach((id) => {
      const all = JELENET_ALLAPOTOK[a.jelenetek[id] || ''].nev;
      sorok.push('• ' + jNev(id) + ' (' + all + ')');
      tetelek(id).forEach((t) => sorok.push('   ◦ ' + t.sz));
    });
  }
  const egyeb = tetelek('');
  if (egyeb.length) {
    sorok.push('', sorrend.length ? 'Jeleneten kívül:' : 'Események:');
    egyeb.forEach((t) => sorok.push('• ' + t.sz));
  }
  const xp = xpOsszesites(a.naplo);
  const penz = penzOsszesites(a.naplo);
  if (xp.length) sorok.push('', 'XP összesen: ' + xp.map((x) => x.nev + ' ' + x.xp).join(', ') + '.');
  const kincsek = penz.map((p) => p.nev + ' ' + (p.penz > 0 ? '+' : '') + penzSzoveg(p.penz)).join(', ');
  if (kincsek) sorok.push('Pénz: ' + kincsek + '.');
  // a játékosoknak szóló rész: csak ami nekik is látszott (a mindenkinek kiosztott anyagok, a csaták, az XP)
  const jt = [];
  if (jb) jt.push(pont('Játékbeli idő: ' + jb));
  const anyagok = a.naplo.filter((e) => e.fajta === 'anyag' && e.adat && e.adat.mindenki && !e.adat.visszavont).map((e) => e.szoveg);
  if (anyagok.length) jt.push(pont('Amit kaptatok: ' + anyagok.join(', ')));
  const csatak = a.naplo.filter((e) => e.fajta === 'csata').map((e) => e.szoveg);
  if (csatak.length) jt.push(pont('Csaták: ' + csatak.join(', ')));
  if (xp.length) jt.push('XP: ' + xp.map((x) => x.nev + ' ' + x.xp).join(', ') + '.');
  const jutalmak = a.naplo.filter((e) => e.fajta === 'jutalom' && !obj(e.adat).visszavont && lista(obj(e.adat).tetelek).length)
    .flatMap((e) => lista(e.adat.tetelek).map((t) => t.nev + (t.mit ? ': ' + t.mit : '')));
  if (jutalmak.length) jt.push(pont('Jutalmak: ' + jutalmak.join(', ')));
  return { szoveg: sorok.join('\n').trim(), jatekosoknak: jt.join('\n'), xp, kincsek };
}

// Lezárás: az összefoglaló vázlata (ha még üres), a jelöltek a szereplők közé, a vég ideje és a játékbeli vég.
export function lezar(alkalom, { most, jatekbeliVeg, jeloltek = [], ctx = {} } = {}) {
  const al = alkalomNorm(alkalom);
  al.allapot = 'lezart';
  al.veg = most || new Date().toISOString();
  al.jatekbeli_veg = vag(jatekbeliVeg === undefined ? al.jatekbeli_datum : jatekbeliVeg, 120);
  let a = al.adat;
  a.naplo = a.naplo.concat([esemenyNorm({ ido: al.veg, fajta: 'alkalom', szoveg: 'Az alkalom lezárult.' })]);
  a = szereplokFelvetele(a, jeloltek);
  const v = vazlat({ ...al, adat: a }, ctx);
  a.osszefoglalo = { ...a.osszefoglalo, szoveg: van(a.osszefoglalo.szoveg) ? a.osszefoglalo.szoveg : v.szoveg,
    jatekosoknak: van(a.osszefoglalo.jatekosoknak) ? a.osszefoglalo.jatekosoknak : v.jatekosoknak, xp: v.xp, kincsek: v.kincsek };
  al.adat = karcsusit(a);
  return al;
}

// Újranyitás (például véletlen lezárás után): újra fut, a vég törlődik.
export function ujranyit(alkalom) {
  const al = alkalomNorm(alkalom);
  al.allapot = 'fut';
  al.veg = '';
  al.kozzeteve = false;
  return al;
}

// ---------- A játékosoknak szóló rész (a háttér is így szűr, lásd backend/Alkalmak.gs) ----------

// A szereplő megfelelő alanya a játékos ismeretei közt: az alany maga, vagy az NJK-ra, elemre mutató alany.
// alanyokDm: a DM alanysorai (valódi kötéssel), lathato: a játékos által látott alanyok azonosítói.
export function szereploAlanya(sz, alanyokDm, lathato) {
  const l = new Set(lista(lathato));
  if (sz.tipus === 'alany') return l.has(sz.ref_id) ? sz.ref_id : '';
  if (!sz.ref_id) return '';
  const x = lista(alanyokDm).find((a) => l.has(a.id) && obj(obj(a.adat).valodi).id === sz.ref_id);
  return x ? x.id : '';
}
