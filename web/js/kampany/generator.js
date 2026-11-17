// Kampányépítő: a könyvek dobótábláinak generátormotorja. Tiszta függvények (a dobás helyben gurul, szerverhívás
// nélkül). A táblák a Szabályadatbázis „Dobótáblák” lapján vannak: { id, nev_hu, nev_en, forras, oldal, csoport,
// reszletek }, a könyv szövege nélkül (rövid magyar eredmények). Terv: claude/kampanyepito-terv.md, „Generátorok”.
//
// reszletek: {
//   kocka: '1d6' | 'd3' | '2d6' | '3d6' | 'd6d6' | 'd6d6d6'   (a d6d6 oszlopos: oszloponként egy kocka dönt)
//   sorok: [{
//     t: 5 | [3, 4] | [[1, 1], [1, 3]]   (összegnél tartomány; oszloposnál kockánként tartomány)
//     e: 'rövid magyar eredmény', en: 'angol név' (nem kötelező),
//     ertek: tetszőleges szerkezett érték a hívó modulnak (például { szazalek: 110 } vagy { kategoriak: [...] }),
//     szam: { alap: 'sarkany' | '1d6' | ..., oszto: 2 | 3, kerekit: 'fel' | 'le', plusz: −1 }  →  az e szövegben {szam}
//     hivas: [{ tabla: 'id' | '' (ugyanez a tábla), darab: 1 | '1d6' | '2d6' | 'd3' | 'sarkany', darab_plusz: 1, egyedi, sajat_ujra }]
//   }],
//   kovetkezo: [{ tabla, darab }]   minden dobás után (például az üzlettípus után az üzletrészletek a sárkánykocka szerint)
// }
// A „sarkany” darabszám a legközelebbi olyan dobás sárkánykockája, amelynek volt (3d6-nál a harmadik kocka).
// egyedi: egy hívás dobásai között nem lehet két azonos sor (újradob). sajat_ujra: ha a hívó sorát dobja ki
// ugyanazon a táblán, újradob (például „dobj még kétszer, a 18-at dobd újra”).

export const KOCKAFORMAK = {
  '1d6': { nev: '1d6', db: 1, oszlopos: false },
  d6: { nev: '1d6', db: 1, oszlopos: false },
  d3: { nev: 'd3', db: 1, oszlopos: false, d3: true },
  '2d6': { nev: '2d6', db: 2, oszlopos: false },
  '3d6': { nev: '3d6', db: 3, oszlopos: false },
  d6d6: { nev: 'd6 d6', db: 2, oszlopos: true },
  d6d6d6: { nev: 'd6 d6 d6', db: 3, oszlopos: true }
};

const MAX_MELYSEG = 6;
const MAX_CSOMOPONT = 120;
const MAX_UJRA = 30;
const MAX_DARAB = 12;

export const alapRng = () => Math.random();
const d6 = (rng) => 1 + Math.floor(rng() * 6);

// Kockadobás egy formában: { kockak, osszeg, sarkany } (sarkany csak 3d6-nál).
export function kockaDobas(forma, rng = alapRng) {
  const f = KOCKAFORMAK[forma];
  if (!f) throw new Error('Ismeretlen kockaforma: ' + forma);
  if (f.d3) { const k = Math.ceil(d6(rng) / 2); return { kockak: [k], osszeg: k, sarkany: null }; }
  const kockak = Array.from({ length: f.db }, () => d6(rng));
  return { kockak, osszeg: kockak.reduce((a, b) => a + b, 0), sarkany: forma === '3d6' ? kockak[2] : null };
}

const tart = (t) => (Array.isArray(t) ? [Number(t[0]), Number(t.length > 1 ? t[1] : t[0])] : [Number(t), Number(t)]);

// Egy dobás melyik sorra esik (index, vagy −1).
export function sorIndex(tabla, kockak) {
  const r = reszletek(tabla);
  const f = KOCKAFORMAK[r.kocka];
  if (!f) return -1;
  const osszeg = kockak.reduce((a, b) => a + b, 0);
  return (r.sorok || []).findIndex((s) => {
    if (f.oszlopos) {
      const t = Array.isArray(s.t) ? s.t : [];
      return kockak.every((k, i) => { const [a, b] = tart(t[i] === undefined ? [1, 6] : t[i]); return k >= a && k <= b; });
    }
    const [a, b] = tart(s.t);
    return osszeg >= a && osszeg <= b;
  });
}

export function reszletek(tabla) {
  return tabla && tabla.reszletek && typeof tabla.reszletek === 'object' ? tabla.reszletek : {};
}

// A tábla összes lehetséges dobása (az ellenőrzéshez): kockaértékek listái.
function osszesDobas(forma) {
  const f = KOCKAFORMAK[forma];
  if (!f) return [];
  if (f.d3) return [[1], [2], [3]];
  let ki = [[]];
  for (let i = 0; i < f.db; i++) ki = ki.flatMap((x) => [1, 2, 3, 4, 5, 6].map((k) => x.concat([k])));
  return ki;
}

// A tábla ellenőrzése (importnál): minden dobás pontosan egy sorra essen, a hívott táblák létezzenek.
export function tablaHibak(tabla, tablak) {
  const h = [];
  const r = reszletek(tabla);
  if (!KOCKAFORMAK[r.kocka]) return ['Ismeretlen kockaforma: ' + r.kocka];
  if (!Array.isArray(r.sorok) || !r.sorok.length) return ['Nincsenek sorok.'];
  const lefedetlen = [];
  const atfedes = [];
  osszesDobas(r.kocka).forEach((k) => {
    const talalt = r.sorok.filter((s, i) => sorIndex({ reszletek: { ...r, sorok: [s] } }, k) === 0).length;
    if (!talalt) lefedetlen.push(k.join('+'));
    if (talalt > 1) atfedes.push(k.join('+'));
  });
  if (lefedetlen.length) h.push('Nem fedett dobások: ' + Array.from(new Set(lefedetlen)).slice(0, 6).join(', '));
  if (atfedes.length) h.push('Több sorra eső dobások: ' + Array.from(new Set(atfedes)).slice(0, 6).join(', '));
  const hivasok = r.sorok.flatMap((s) => s.hivas || []).concat(r.kovetkezo || []);
  hivasok.forEach((hv) => {
    if (hv.tabla && tablak && !tablaKeres(tablak, hv.tabla)) h.push('Hiányzó hívott tábla: ' + hv.tabla);
  });
  return h;
}

export function tablaKeres(tablak, id) {
  if (!tablak) return null;
  if (tablak instanceof Map) return tablak.get(id) || null;
  if (Array.isArray(tablak)) return tablak.find((t) => t.id === id) || null;
  return tablak[id] || null;
}

// Egy sor tartományának szövege („3–4”, „5”, „1 / 1–3”).
export function tartomanySzoveg(tabla, sor) {
  const f = KOCKAFORMAK[reszletek(tabla).kocka] || {};
  const egy = (t) => { const [a, b] = tart(t); return a === b ? String(a) : a + '–' + b; };
  if (f.oszlopos) return (Array.isArray(sor.t) ? sor.t : []).map(egy).join(' / ');
  return egy(sor.t);
}

// A darabszám feloldása: szám, kockakifejezés vagy a sárkánykocka.
function darabFeloldas(darab, sarkany, rng) {
  if (darab === undefined || darab === null || darab === '') return { db: 1, dobas: null };
  if (typeof darab === 'number') return { db: Math.max(0, Math.min(MAX_DARAB, Math.round(darab))), dobas: null };
  if (darab === 'sarkany') return { db: Math.max(0, Math.min(MAX_DARAB, sarkany || 0)), dobas: { forma: 'sarkany', kockak: [sarkany || 0], osszeg: sarkany || 0 } };
  const forma = darab === '1d3' ? 'd3' : darab;
  if (KOCKAFORMAK[forma] && !KOCKAFORMAK[forma].oszlopos) {
    return { db: 0, dobas: { forma, ...kockaDobas(forma, rng) }, kesobb: true };
  }
  const n = Number(darab);
  return { db: Number.isFinite(n) ? Math.max(0, Math.min(MAX_DARAB, n)) : 1, dobas: null };
}

function szamSzamol(sz, sarkany, rng) {
  if (!sz) return null;
  let alap;
  if (sz.alap === 'sarkany') alap = sarkany || 0;
  else if (KOCKAFORMAK[sz.alap]) alap = kockaDobas(sz.alap, rng).osszeg;
  else alap = Number(sz.alap) || 0;
  const o = Number(sz.oszto) || 1;
  const nyers = alap / o;
  return (sz.kerekit === 'le' ? Math.floor(nyers) : Math.ceil(nyers)) + (Number(sz.plusz) || 0);
}

function szovegKitolt(e, csomopont) {
  return String(e || '')
    .replace(/\{szam\}/g, csomopont.szam === null || csomopont.szam === undefined ? '?' : String(csomopont.szam))
    .replace(/\{sarkany\}/g, csomopont.sarkany ? String(csomopont.sarkany) : '?');
}

// Generálás. korny: { tablak (tömb, Map vagy objektum), rng, kikapcsolt: { tablaId: [sorindex] } }
// Eredmény egy csomópont: { tabla, nev, kocka, kockak, osszeg, sarkany, sor, eredmeny, en, ertek, szam, kezi,
//   kikapcsoltUjra, hivasok: [{ tabla, nev, darab, darabDobas, gyerekek: [csomópont] }], hiba }
export function general(tablaId, korny, opciok = {}) {
  const szamlalo = { n: 0 };
  return csomopontKeszit(tablaId, { ...korny, rng: korny.rng || alapRng }, { melyseg: 0, osSarkany: null, szamlalo, ...opciok });
}

function csomopontKeszit(tablaId, korny, ctx) {
  const tabla = tablaKeres(korny.tablak, tablaId);
  ctx.szamlalo.n++;
  if (!tabla) return { tabla: tablaId, nev: tablaId, hiba: 'Nincs ilyen dobótábla: ' + tablaId, hivasok: [] };
  const r = reszletek(tabla);
  const kikapcsolt = new Set(((korny.kikapcsolt || {})[tablaId] || []).map(Number));
  const tiltott = new Set(ctx.tiltottSorok || []);
  let dobas, sor, ujra = 0;
  if (ctx.kezi !== undefined && ctx.kezi !== null) {
    sor = ctx.kezi;
    dobas = { kockak: null, osszeg: null, sarkany: null };
  } else {
    for (;;) {
      dobas = kockaDobas(r.kocka, korny.rng);
      sor = sorIndex(tabla, dobas.kockak);
      const rossz = sor < 0 || kikapcsolt.has(sor) || tiltott.has(sor);
      if (!rossz || ujra >= MAX_UJRA) break;
      ujra++;
    }
  }
  const s = (r.sorok || [])[sor];
  const cs = {
    tabla: tablaId, nev: tabla.nev_hu || tablaId, en: '', kocka: r.kocka, kockak: dobas.kockak, osszeg: dobas.osszeg,
    sarkany: dobas.sarkany, sor, eredmeny: '', ertek: undefined, szam: null, kezi: ctx.kezi !== undefined && ctx.kezi !== null,
    kikapcsoltUjra: ujra, forras: tabla.forras || '', oldal: tabla.oldal || '', hivasok: []
  };
  if (!s) { cs.hiba = 'A dobás egy sorra sem esik (' + (dobas.kockak || []).join('+') + ').'; return cs; }
  const sarkany = cs.sarkany || ctx.osSarkany;
  cs.szam = szamSzamol(s.szam, sarkany, korny.rng);
  cs.eredmeny = szovegKitolt(s.e, { szam: cs.szam, sarkany });
  cs.en = s.en || '';
  if (s.ertek !== undefined) cs.ertek = JSON.parse(JSON.stringify(s.ertek));
  if (ujra >= MAX_UJRA && (kikapcsolt.has(sor) || tiltott.has(sor))) cs.figyelmeztetes = 'Minden alkalmas sor ki van kapcsolva, ezért ez maradt.';
  if (ctx.melyseg >= MAX_MELYSEG) { if ((s.hivas || []).length || (r.kovetkezo || []).length) cs.figyelmeztetes = 'Túl mély láncolás, a további dobások elmaradtak.'; return cs; }
  const hivasok = (s.hivas || []).concat(r.kovetkezo || []);
  cs.hivasok = hivasok.map((hv) => hivasVegrehajt(hv, tablaId, sor, sarkany, korny, ctx));
  return cs;
}

function hivasVegrehajt(hv, tablaId, sor, sarkany, korny, ctx) {
  const celId = hv.tabla || tablaId;
  const cel = tablaKeres(korny.tablak, celId);
  const d = darabFeloldas(hv.darab, sarkany, korny.rng);
  const db = Math.max(0, Math.min(MAX_DARAB, (d.kesobb ? d.dobas.osszeg : d.db) + (Number(hv.darab_plusz) || 0)));
  const gyerekek = [];
  for (let i = 0; i < db && ctx.szamlalo.n < MAX_CSOMOPONT; i++) {
    const tiltottSorok = [];
    if (hv.egyedi) gyerekek.forEach((g) => { if (g.sor >= 0) tiltottSorok.push(g.sor); });
    if (hv.sajat_ujra && celId === tablaId) tiltottSorok.push(sor);
    gyerekek.push(csomopontKeszit(celId, korny, { melyseg: ctx.melyseg + 1, osSarkany: sarkany, szamlalo: ctx.szamlalo, tiltottSorok }));
  }
  return { tabla: celId, nev: cel ? cel.nev_hu : celId, darab: hv.darab === undefined ? 1 : hv.darab, darabDobas: d.dobas,
    darab_plusz: Number(hv.darab_plusz) || 0, egyedi: !!hv.egyedi, sajat_ujra: !!hv.sajat_ujra, gyerekek };
}

// ---- Módosítás útvonal szerint: ut = [hivasIndex, gyerekIndex, hivasIndex, gyerekIndex, ...] ----

export function csomopont(fa, ut) {
  let x = fa;
  for (let i = 0; i < ut.length; i += 2) {
    const h = x && x.hivasok && x.hivasok[ut[i]];
    x = h && h.gyerekek[ut[i + 1]];
  }
  return x || null;
}

// A csomópont fölötti legközelebbi sárkánykocka (a „sarkany” darabszámokhoz és a {szam} értékekhez).
function osSarkany(fa, ut) {
  let ki = null;
  let x = fa;
  for (let i = 0; i < ut.length; i += 2) {
    if (x.sarkany) ki = x.sarkany;
    x = x.hivasok[ut[i]].gyerekek[ut[i + 1]];
  }
  return ki;
}

function csere(fa, ut, uj) {
  if (!ut.length) return uj;
  const masolat = { ...fa, hivasok: fa.hivasok.slice() };
  const h = { ...masolat.hivasok[ut[0]], gyerekek: masolat.hivasok[ut[0]].gyerekek.slice() };
  h.gyerekek[ut[1]] = csere(h.gyerekek[ut[1]], ut.slice(2), uj);
  masolat.hivasok[ut[0]] = h;
  return masolat;
}

function testverTiltas(fa, ut) {
  if (!ut.length) return [];
  const szulo = csomopont(fa, ut.slice(0, -2));
  const h = szulo.hivasok[ut[ut.length - 2]];
  const ki = [];
  if (h.egyedi) h.gyerekek.forEach((g, i) => { if (i !== ut[ut.length - 1] && g.sor >= 0) ki.push(g.sor); });
  if (h.sajat_ujra && h.tabla === szulo.tabla) ki.push(szulo.sor);
  return ki;
}

// Egy sor (csomópont) újradobása a láncolt dobásaival együtt.
export function ujradob(fa, ut, korny) {
  const regi = csomopont(fa, ut);
  if (!regi) return fa;
  const uj = csomopontKeszit(regi.tabla, { ...korny, rng: korny.rng || alapRng },
    { melyseg: ut.length / 2, osSarkany: osSarkany(fa, ut), szamlalo: { n: 0 }, tiltottSorok: testverTiltas(fa, ut) });
  return csere(fa, ut, uj);
}

// A DM maga választ sort a táblából (Beírom): a láncolt dobások az új sor szerint készülnek.
export function valaszt(fa, ut, sorIdx, korny) {
  const regi = csomopont(fa, ut);
  if (!regi) return fa;
  const uj = csomopontKeszit(regi.tabla, { ...korny, rng: korny.rng || alapRng },
    { melyseg: ut.length / 2, osSarkany: osSarkany(fa, ut), szamlalo: { n: 0 }, kezi: sorIdx });
  return csere(fa, ut, uj);
}

// Egy sor elhagyása (a DM nem kéri): a csomópont kikerül a hívás gyerekei közül.
export function elhagy(fa, ut) {
  if (ut.length < 2) return fa;
  const szuloUt = ut.slice(0, -2);
  const szulo = csomopont(fa, szuloUt);
  const hivasok = szulo.hivasok.slice();
  const h = { ...hivasok[ut[ut.length - 2]], gyerekek: hivasok[ut[ut.length - 2]].gyerekek.filter((_, i) => i !== ut[ut.length - 1]) };
  hivasok[ut[ut.length - 2]] = h;
  return csere(fa, szuloUt, { ...szulo, hivasok });
}

// Bejárás: minden csomópont a mélységével és útvonalával.
export function bejar(fa, fn, ut = [], melyseg = 0) {
  if (!fa) return;
  fn(fa, ut, melyseg);
  (fa.hivasok || []).forEach((h, i) => h.gyerekek.forEach((g, j) => bejar(g, fn, ut.concat([i, j]), melyseg + 1)));
}

// Az eredmények egyszerű listája: [{ tabla, nev, eredmeny, en, ertek, melyseg, ut }].
export function eredmenyek(fa) {
  const ki = [];
  bejar(fa, (cs, ut, melyseg) => { if (!cs.hiba) ki.push({ tabla: cs.tabla, nev: cs.nev, eredmeny: cs.eredmeny, en: cs.en, ertek: cs.ertek, melyseg, ut }); });
  return ki;
}

export function dobasSzoveg(cs) {
  if (cs.kezi) return 'választva';
  if (!cs.kockak) return '';
  const f = KOCKAFORMAK[cs.kocka] || {};
  if (f.oszlopos) return f.nev + ': ' + cs.kockak.join(' / ');
  if (cs.kockak.length === 1) return f.nev + ': ' + cs.kockak[0];
  return f.nev + ': ' + cs.kockak.join('+') + ' = ' + cs.osszeg + (cs.sarkany ? ' (sárkánykocka ' + cs.sarkany + ')' : '');
}

function darabSzoveg(h) {
  if (h.darab === 'sarkany') return 'a sárkánykocka szerint ' + h.gyerekek.length + '×';
  if (h.darabDobas && h.darabDobas.forma !== 'sarkany') return h.darabDobas.forma + (h.darab_plusz ? '+' + h.darab_plusz : '') + ' = ' + (h.darabDobas.osszeg + (h.darab_plusz || 0)) + '×';
  return h.gyerekek.length === 1 ? '' : h.gyerekek.length + '×';
}

// A dobás menete jegyzetként (behúzott sorok), az elem dobásnaplójába.
export function jegyzet(fa) {
  const sorok = [];
  const ir = (cs, beh) => {
    const d = dobasSzoveg(cs);
    sorok.push('  '.repeat(beh) + cs.nev + (d ? ' (' + d + ')' : '') + ': ' + (cs.hiba || cs.eredmeny) + (cs.figyelmeztetes ? ' [' + cs.figyelmeztetes + ']' : ''));
    (cs.hivasok || []).forEach((h) => {
      if (!h.gyerekek.length) { sorok.push('  '.repeat(beh + 1) + h.nev + ': ' + (h.darab === 'sarkany' || h.darabDobas ? 'nincs dobás (' + darabSzoveg(h).replace('×', '') + '0)' : 'nincs dobás')); return; }
      const ds = darabSzoveg(h);
      if (ds) sorok.push('  '.repeat(beh + 1) + h.nev + ' ' + ds);
      h.gyerekek.forEach((g) => ir(g, beh + (ds ? 2 : 1)));
    });
  };
  if (fa) ir(fa, 0);
  return sorok.join('\n');
}

// Az eredmény szövegként egy elem mezőjébe (felsorolás, a táblanév nélkül a gyökérnél).
export function eredmenySzoveg(fa) {
  return eredmenyek(fa).map((x) => (x.melyseg ? '  '.repeat(x.melyseg - 1) + '• ' + x.nev + ': ' : '') + x.eredmeny).join('\n');
}

// A tábla sorai a választáshoz és a kikapcsoláshoz: [{ index, tartomany, eredmeny, en, kikapcsolt }].
export function sorLista(tabla, kikapcsolt) {
  const k = new Set((kikapcsolt || []).map(Number));
  return (reszletek(tabla).sorok || []).map((s, i) => ({ index: i, tartomany: tartomanySzoveg(tabla, s), eredmeny: String(s.e || '').replace(/\{szam\}|\{sarkany\}/g, 'X'), en: s.en || '', kikapcsolt: k.has(i) }));
}

// Egy sor be- vagy kikapcsolása a kampányban (a keret generator_kikapcsolt mezőjéhez).
export function kikapcsolValt(kikapcsolt, tablaId, sorIdx) {
  const ki = { ...(kikapcsolt || {}) };
  const s = new Set((ki[tablaId] || []).map(Number));
  if (s.has(sorIdx)) s.delete(sorIdx); else s.add(sorIdx);
  if (s.size) ki[tablaId] = Array.from(s).sort((a, b) => a - b); else delete ki[tablaId];
  return ki;
}

// Az esély százalékban, hogy egy sor kijön (egy dobásnál, kikapcsolások nélkül).
export function sorEsely(tabla, sorIdx) {
  const r = reszletek(tabla);
  const mind = osszesDobas(r.kocka);
  if (!mind.length) return 0;
  return Math.round((mind.filter((k) => sorIndex(tabla, k) === sorIdx).length / mind.length) * 1000) / 10;
}
