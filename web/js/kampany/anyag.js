// Kampányjátszó 6.2: kiosztható anyagok tiszta függvényei (a felület és a tesztek közösen használják).
// Az anyag fajtái a terv szerint: levél vagy irat, nyom, kép vagy térkép, képrészlet, részlet (egy személy, hely vagy
// tárgy egy darabja). Az előkészített anyag az előkészítő elem `adat.anyagok` listájában él (öröklődik, mint a többi
// mező); kiosztáskor pillanatkép készül belőle (share.send, tipus 'anyag'), a kivágott kép másolatként.
// Az alany (akiről a részlet szól) a Megosztások lapon tipus 'alany' sor: ismert név, valódi kötés, felfedés,
// összekapcsolás. A háttér a játékosnak csak az ismert nevet adja (felfedés után a valódit).

export const FAJTAK = {
  level: { nev: 'Levél, irat', egyes: 'levél', szoveg: true, kep: false },
  nyom: { nev: 'Nyom', egyes: 'nyom', szoveg: true, kep: false },
  kep: { nev: 'Kép, térkép', egyes: 'kép', szoveg: false, kep: true },
  kepreszlet: { nev: 'Képrészlet', egyes: 'képrészlet', szoveg: false, kep: true, vagas: true },
  reszlet: { nev: 'Részlet', egyes: 'részlet', szoveg: true, kep: false }
};
export const FAJTA_SORREND = ['level', 'nyom', 'kep', 'kepreszlet', 'reszlet'];

export const KEZIRASOK = { gondos: 'gondos', diszes: 'díszes', kapkodo: 'kapkodó', gyerekes: 'gyerekes' };
export const LEVEL_ALLAPOTOK = { ep: 'ép', szakadt: 'szakadt', elazott: 'elázott' };
export const ALANY_KATEGORIAK = { szemely: 'Személyek', hely: 'Helyek', targy: 'Tárgyak', egyeb: 'Egyéb' };
export const KATEGORIA_EGYES = { szemely: 'személy', hely: 'hely', targy: 'tárgy', egyeb: 'egyéb' };
const KATEGORIA_SORREND = ['szemely', 'hely', 'targy', 'egyeb'];

export const MAX_SZOVEG = 20000;
export const MAX_KEP = 6;
export const MEGMUTATAS_ABLAK_MS = 10 * 60 * 1000; // ennél régebbi megmutatás új eszközön már nem ugrik fel

const str = (x) => (x === undefined || x === null ? '' : String(x));

// ---- Olvashatatlan részek: a DM [[...]] jelöléssel jelöli a levél szövegében ----

// A szöveg darabjai: [{ szoveg, olvashatatlan }]. A lezáratlan [[ a végéig olvashatatlan.
export function szovegReszek(szoveg) {
  const s = str(szoveg);
  const ki = [];
  let i = 0;
  while (i < s.length) {
    const kezd = s.indexOf('[[', i);
    if (kezd < 0) { ki.push({ szoveg: s.slice(i), olvashatatlan: false }); break; }
    if (kezd > i) ki.push({ szoveg: s.slice(i, kezd), olvashatatlan: false });
    const veg = s.indexOf(']]', kezd + 2);
    const belso = s.slice(kezd + 2, veg < 0 ? s.length : veg);
    if (belso) ki.push({ szoveg: belso, olvashatatlan: true });
    i = veg < 0 ? s.length : veg + 2;
  }
  return ki;
}

// A szöveg az olvashatatlan részek nélkül (előnézethez, kereséshez): azok helyén „…”.
export function olvashatoSzoveg(szoveg) {
  return szovegReszek(szoveg).map((r) => (r.olvashatatlan ? '…' : r.szoveg)).join('');
}

// Rövid előnézet a listákba.
export function elonezet(szoveg, hossz = 90) {
  const s = olvashatoSzoveg(szoveg).replace(/\s+/g, ' ').trim();
  return s.length > hossz ? s.slice(0, hossz - 1).trimEnd() + '…' : s;
}

// ---- Kivágás (képrészlet): a kép méretéhez viszonyított téglalap, 0 és 1 között ----

const korlat = (x, a, b) => Math.min(b, Math.max(a, x));
export const MIN_VAGAS = 0.03;

export function vagasNorm(v) {
  if (!v || typeof v !== 'object') return null;
  let x = korlat(Number(v.x) || 0, 0, 1);
  let y = korlat(Number(v.y) || 0, 0, 1);
  let w = korlat(Number(v.w) || 0, 0, 1);
  let h = korlat(Number(v.h) || 0, 0, 1);
  if (w < MIN_VAGAS || h < MIN_VAGAS) return null;
  if (x + w > 1) x = 1 - w;
  if (y + h > 1) y = 1 - h;
  const k = (n) => Math.round(n * 10000) / 10000;
  return { x: k(x), y: k(y), w: k(w), h: k(h) };
}

// Két húzási pontból (0..1) téglalap.
export function vagasPontokbol(a, b) {
  return vagasNorm({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
}

// A kivágás pixelben egy adott méretű képen, és a kimenet mérete (a hosszabb oldal legfeljebb max).
export function vagasPixel(v, szel, mag, max = 768) {
  const t = vagasNorm(v) || { x: 0, y: 0, w: 1, h: 1 };
  const sx = Math.round(t.x * szel);
  const sy = Math.round(t.y * mag);
  const sw = Math.max(1, Math.round(t.w * szel));
  const sh = Math.max(1, Math.round(t.h * mag));
  const arany = Math.min(1, max / Math.max(sw, sh));
  return { sx, sy, sw, sh, szel: Math.max(1, Math.round(sw * arany)), mag: Math.max(1, Math.round(sh * arany)) };
}

// ---- Előkészített anyag (az elem adat.anyagok listájában) ----

export function ujAnyag(fajta = 'nyom', id) {
  return { id: id || 'a' + Math.random().toString(36).slice(2, 9), fajta, cim: '', szoveg: '', level: fajta === 'level' ? ures_level() : undefined, kepek: [], alany: null };
}
function ures_level() { return { felado: '', cimzett: '', alairas: '', pecset: '', kezires: 'gondos', allapot: 'ep' }; }

export function anyagNorm(a) {
  const x = a && typeof a === 'object' ? a : {};
  const fajta = FAJTAK[x.fajta] ? x.fajta : 'nyom';
  const o = {
    id: str(x.id) || 'a' + Math.random().toString(36).slice(2, 9),
    fajta, cim: str(x.cim), szoveg: str(x.szoveg).slice(0, MAX_SZOVEG),
    kepek: (Array.isArray(x.kepek) ? x.kepek : []).filter((k) => k && k.kep).slice(0, MAX_KEP).map((k) => ({
      kep: str(k.kep), belyeg: str(k.belyeg || k.kep), cim: str(k.cim), szel: Number(k.szel) || 0, mag: Number(k.mag) || 0,
      terkep: k.terkep === true, vagas: vagasNorm(k.vagas), ...(k.kesz === true ? { kesz: true } : {})
    })),
    alany: x.alany && typeof x.alany === 'object' ? {
      ismert_nev: str(x.alany.ismert_nev), kategoria: ALANY_KATEGORIAK[x.alany.kategoria] ? x.alany.kategoria : 'egyeb'
    } : null
  };
  if (fajta === 'level') o.level = { ...ures_level(), ...(x.level && typeof x.level === 'object' ? x.level : {}) };
  return o;
}

export function anyagokNorm(lista) {
  return (Array.isArray(lista) ? lista : []).map(anyagNorm);
}

// Mi hiányzik a kiosztáshoz (üres lista: kiosztható).
export function anyagHibak(a) {
  const n = anyagNorm(a);
  const h = [];
  const f = FAJTAK[n.fajta];
  if (f.kep && !n.kepek.length) h.push('Válassz képet.');
  if (n.fajta === 'kepreszlet' && n.kepek.length && !n.kepek.every((k) => k.vagas)) h.push('Jelöld ki a kivágandó részt.');
  if (n.fajta === 'level' && !n.szoveg.trim()) h.push('Írd meg a levél szövegét.');
  if ((n.fajta === 'nyom' || n.fajta === 'reszlet') && !n.szoveg.trim() && !n.kepek.length) h.push('Írj szöveget, vagy válassz képet.');
  return h;
}

// Az anyag címe a listákban: a megadott cím, vagy a fajta és a szöveg eleje.
export function anyagCim(a) {
  const n = a && a.adat ? { ...a.adat, cim: a.cim } : (a || {});
  if (str(n.cim).trim()) return str(n.cim).trim();
  const f = FAJTAK[n.fajta] || FAJTAK.nyom;
  const e = elonezet(n.szoveg, 40);
  return e ? f.egyes.charAt(0).toUpperCase() + f.egyes.slice(1) + ': ' + e : f.nev;
}

// Az elemtípusból az alany kategóriája (új alany javaslatához).
export function alanyKategoriaElemhez(tipus) {
  if (tipus === 'helyszin') return 'hely';
  if (tipus === 'jutalom') return 'targy';
  if (tipus === 'njk' || tipus === 'szereplo') return 'szemely';
  return 'egyeb';
}

// A kiosztás adata a háttérnek (share.send adat): pillanatkép. kepek: a feltöltött másolatok [{ kep, belyeg, szel, mag }]
// az anyag képeinek sorrendjében; forras: { tipus, id, nev } (csak a DM látja).
export function kiosztasAdat(a, kepek, forras) {
  const n = anyagNorm(a);
  const o = { fajta: n.fajta, szoveg: n.szoveg, kepek: (kepek || []).map((k, i) => ({
    kep: k.kep, belyeg: k.belyeg || k.kep, cim: str((n.kepek[i] || {}).cim || k.cim), szel: Number(k.szel) || 0, mag: Number(k.mag) || 0,
    terkep: !!(n.kepek[i] || {}).terkep
  })) };
  if (n.fajta === 'level') o.level = { ...n.level };
  if (forras && (forras.id || forras.nev)) o.forras = { tipus: str(forras.tipus), id: str(forras.id), nev: str(forras.nev), anyag: str(forras.anyag) };
  if (a && a.elozo) o.elozo = str(a.elozo);
  return o;
}

// Egy kiosztott anyagból újra szerkeszthető vázlat (az „Újabb változat” gombhoz). A képek a már kiosztott másolatok.
export function kiosztottbolVazlat(m) {
  const d = (m && m.adat) || {};
  return {
    ...anyagNorm({ fajta: d.fajta, cim: m.cim, szoveg: d.szoveg, level: d.level,
      kepek: (d.kepek || []).map((k) => ({ ...k, vagas: null, kesz: true })) }),
    elozo: m.id
  };
}

// ---- Alanyok ----

// A DM sora (tipus 'alany', cim, adat) vagy a játékos nézete (ismert_nev, nev) egységesen.
export function alanyNezet(a) {
  if (!a) return null;
  if (a.adat && typeof a.adat === 'object') {
    const d = a.adat;
    const valodi = d.valodi || {};
    return {
      id: a.id, ismert_nev: str(a.cim), nev: d.felfedve && valodi.nev ? str(valodi.nev) : str(a.cim),
      valodi: { tipus: str(valodi.tipus), id: str(valodi.id), nev: str(valodi.nev) },
      kategoria: ALANY_KATEGORIAK[d.kategoria] ? d.kategoria : 'egyeb', felfedve: d.felfedve === true,
      osszekapcsolva: str(d.osszekapcsolva), jegyzet: str(d.jegyzet), dm: true
    };
  }
  return {
    id: a.id, ismert_nev: str(a.ismert_nev || a.nev), nev: str(a.nev || a.ismert_nev), valodi: null,
    kategoria: ALANY_KATEGORIAK[a.kategoria] ? a.kategoria : 'egyeb', felfedve: a.felfedve === true,
    osszekapcsolva: str(a.osszekapcsolva), jegyzet: '', dm: false
  };
}

// Az összekapcsolás láncának vége (körben is megáll).
export function alanyCel(alanyok, id) {
  const ix = new Map((alanyok || []).map((a) => [a.id, alanyNezet(a)]));
  let most = id;
  const latott = new Set();
  while (most && !latott.has(most)) {
    latott.add(most);
    const a = ix.get(most);
    if (!a || !a.osszekapcsolva || !ix.has(a.osszekapcsolva)) return most;
    most = a.osszekapcsolva;
  }
  return most;
}

// A DM listáiba: „A kapucnis idegen (valójában Varga mester)”.
export function alanyNevDm(a) {
  const n = alanyNezet(a);
  if (!n) return '';
  return n.valodi && n.valodi.nev && n.valodi.nev !== n.ismert_nev ? `${n.ismert_nev} (${n.felfedve ? 'felfedve: ' : 'valójában '}${n.valodi.nev})` : n.ismert_nev;
}

// Lehetséges összekapcsolási célok (önmaga és a rá mutató lánc nélkül, hogy ne menjen körbe).
export function osszekapcsolhato(alanyok, id) {
  const lista = (alanyok || []).map(alanyNezet);
  return lista.filter((a) => {
    if (a.id === id) return false;
    let most = a.id;
    const latott = new Set();
    while (most && !latott.has(most)) {
      if (most === id) return false;
      latott.add(most);
      const x = lista.find((y) => y.id === most);
      most = x ? x.osszekapcsolva : '';
    }
    return true;
  });
}

// ---- Kiosztott anyagok a nézetekben ----

const anyagE = (m) => m && m.tipus === 'anyag';
export const visszavontE = (m) => m && m.allapot === 'visszavont';

// Az anyagok időrendben, a legújabb elöl; fajta: szűrő ('' = mind).
export function idorendben(megosztasok, fajta = '') {
  return (megosztasok || []).filter(anyagE).filter((m) => !fajta || (m.adat && m.adat.fajta) === fajta)
    .slice().sort((a, b) => str(b.idopont).localeCompare(str(a.idopont)));
}

// Az Ismeretek nézet: alanyonként (az összekapcsolt alanyok egy csoportban, a lánc végénél) a hozzá kiosztott anyagok.
// Visszaad: [{ alany, kategoria, korabbi: [ismert nevek], anyagok }], kategória, majd név szerint.
export function ismeretek(megosztasok, alanyok) {
  const lista = (alanyok || []).map(alanyNezet);
  const ix = new Map(lista.map((a) => [a.id, a]));
  const csoportok = new Map();
  idorendben(megosztasok).forEach((m) => {
    if (!m.alany_id || !ix.has(m.alany_id)) return;
    const cel = alanyCel(alanyok, m.alany_id);
    if (!csoportok.has(cel)) csoportok.set(cel, { alany: ix.get(cel), anyagok: [], tagok: new Set() });
    const cs = csoportok.get(cel);
    cs.anyagok.push(m);
    let most = m.alany_id;
    const latott = new Set();
    while (most && !latott.has(most) && most !== cel) { latott.add(most); cs.tagok.add(most); most = (ix.get(most) || {}).osszekapcsolva; }
  });
  return [...csoportok.values()].map((cs) => {
    const korabbi = [...cs.tagok].map((id) => ix.get(id).ismert_nev).filter((n) => n && n !== cs.alany.nev && n !== cs.alany.ismert_nev);
    if (cs.alany.felfedve && cs.alany.ismert_nev !== cs.alany.nev) korabbi.unshift(cs.alany.ismert_nev);
    return { alany: cs.alany, kategoria: cs.alany.kategoria, korabbi: [...new Set(korabbi)], anyagok: cs.anyagok };
  }).sort((a, b) => KATEGORIA_SORREND.indexOf(a.kategoria) - KATEGORIA_SORREND.indexOf(b.kategoria) || a.alany.nev.localeCompare(b.alany.nev, 'hu'));
}

// Látta-e a kérő (játékosnál latta_en, a DM sorában a latta objektum a felhasználó szerint).
export function lattaE(m, felhasznaloId) {
  if (!m) return false;
  if (m.latta_en !== undefined) return !!m.latta_en;
  return !!(m.latta && typeof m.latta === 'object' && m.latta[felhasznaloId]);
}

export function ujakSzama(megosztasok, felhasznaloId) {
  return idorendben(megosztasok).filter((m) => !visszavontE(m) && !lattaE(m, felhasznaloId)).length;
}

// Újabb változat: melyik anyagot váltotta fel egy későbbi (adat.elozo). Visszaad: Map(régi id → új anyag).
export function ujabbValtozatok(megosztasok) {
  const ki = new Map();
  idorendben(megosztasok).slice().reverse().forEach((m) => { if (m.adat && m.adat.elozo) ki.set(m.adat.elozo, m); });
  return ki;
}

// A felugró megmutatáshoz: a még nem mutatott, nemrég megmutatott anyagok (kulcs: id és a megmutatás ideje).
// mar: Set a már mutatott kulcsokkal (eszközönként), most: Date.now().
export const megmutatasKulcs = (m) => m.id + '@' + m.megmutat;
export function megmutatandok(megosztasok, mar, most, ablak = MEGMUTATAS_ABLAK_MS) {
  return idorendben(megosztasok).filter((m) => m.megmutat && !visszavontE(m) && !mar.has(megmutatasKulcs(m)))
    .filter((m) => { const t = Date.parse(m.megmutat); return !isFinite(t) || most - t <= ablak; })
    .reverse();
}

// A címzettek szövegesen (a DM listájához és a játékos „csak neked” jeléhez).
export function cimzettSzoveg(cimzettek, karakterek) {
  const l = Array.isArray(cimzettek) && cimzettek.length ? cimzettek : ['mindenki'];
  if (l.includes('mindenki')) return 'mindenki';
  const nev = (id) => ((karakterek || []).find((c) => c.id === id) || {}).nev || 'ismeretlen karakter';
  return l.map(nev).join(', ');
}

export function mindenkinekE(m) {
  const l = Array.isArray(m && m.cimzettek) && m.cimzettek.length ? m.cimzettek : [(m && m.cimzett) || 'mindenki'];
  return l.includes('mindenki');
}

// A DM listájához: kik nyitották meg (felhasználónevek).
export function lattak(m, felhasznaloNev) {
  const l = m && m.latta && typeof m.latta === 'object' ? m.latta : {};
  return Object.keys(l).sort((a, b) => str(l[a]).localeCompare(str(l[b]))).map((id) => felhasznaloNev(id) || 'ismeretlen');
}

// Az előkészített anyagok közül melyik ment már ki ebben a kampányban (a forrás és a vázlat azonosítója szerint).
export function kiosztvaE(megosztasok, forrasId, anyagId) {
  return (megosztasok || []).filter(anyagE).filter((m) => !visszavontE(m))
    .some((m) => m.adat && m.adat.forras && m.adat.forras.id === forrasId && m.adat.forras.anyag === anyagId);
}
