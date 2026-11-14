// Mutatványkezelő szabályai: mely mutatványok választhatók, mennyibe kerülnek a karakternek, hány pont jár.
// Tiszta függvények, böngészőben és Node-ban is futnak. Teszt: node tools/teszt/mutatvany.mjs
// Az adat: Mutatványok lap (reszletek.mp = { min, max, plusz }, ismetelheto, feltetel, osszetevok), és a
// karakter kedvezményei: Talentumok és Specializációk `reszletek.mutatvany_hatasok` (Import 09), Szintlépés lap
// `mutatvany_kedvezmeny` és `mutatvany_hatas` elemei. Terv: claude/probak-terv.md.
import { index, reszletek, szam } from '../karakter/szabalyindex.js';
import { fokozatSzam } from '../karakter/tablak.js';

// A választóban mutatott típusok sorrendje és neve. Az „egyéb” típusok saját mechanikája a csatával jön.
export const TIPUSOK = [
  { tipus: 'harc', nev: 'Harc' }, { tipus: 'varázslat', nev: 'Varázslat' },
  { tipus: 'felfedezés', nev: 'Felfedezés', beallitas: 'felfedezes' }, { tipus: 'szerepjáték', nev: 'Szerepjáték', beallitas: 'szerepjatek' },
  { tipus: 'csomag', nev: 'Csomagok' }, { tipus: 'isteni', nev: 'Isteni', beallitas: 'isteni' }, { tipus: 'nyomozás', nev: 'Nyomozás', beallitas: 'nyomozas' },
  { tipus: 'cselszövés', nev: 'Cselszövés', egyeb: true }, { tipus: 'szervezet', nev: 'Szervezet', egyeb: true },
  { tipus: 'kapcsolat', nev: 'Kapcsolat', egyeb: true }, { tipus: 'üldözés', nev: 'Üldözés', egyeb: true },
  { tipus: 'jármű', nev: 'Jármű', egyeb: true }, { tipus: 'tömeges csata', nev: 'Tömeges csata', egyeb: true }
];
const FOKOZAT_KULCS = { kezdo: 'Kezdő', halado: 'Haladó', mester: 'Mester' };
const FEGYVERES_FELTETEL = ['fegyver', 'fegyvercsoport', 'ketkezes', 'tamadas'];

// A helyzethez illő típus: támadásnál harc, varázslásnál varázslat, Kommunikációnál szerepjáték, egyébként felfedezés.
export function kontextusTipus(k = {}) {
  if (k.tipus === 'tamadas') return 'harc';
  if (k.tipus === 'varazslas') return 'varázslat';
  if (k.tul === 'tul_communication') return 'szerepjáték';
  return 'felfedezés';
}

// Egy gépi feltétel a próba helyzetében: true, false, vagy null (nem tudható, a játékos dönt kapcsolóval).
export function feltetelTeljesul(gepi, k = {}) {
  if (!gepi) return null;
  let ismeretlen = false;
  for (const [kulcs, ertek] of Object.entries(gepi)) {
    let jo;
    if (FEGYVERES_FELTETEL.includes(kulcs) && k.tipus && k.tipus !== 'tamadas') return false;
    if (kulcs === 'fegyver') jo = k.fegyver === undefined ? null : ertek.includes(k.fegyver);
    else if (kulcs === 'fegyvercsoport') jo = k.fegyvercsoport === undefined ? null : ertek.includes(k.fegyvercsoport);
    else if (kulcs === 'ketkezes') jo = k.ketkezes === undefined ? null : !!k.ketkezes === !!ertek;
    else if (kulcs === 'tamadas') jo = k.tamadas === undefined ? null : k.tamadas === ertek;
    else if (kulcs === 'tulajdonsag') jo = k.tul === undefined ? null : ertek.includes(k.tul);
    else if (kulcs === 'fokusz') jo = k.fokusz === undefined ? null : ertek.includes(k.fokusz);
    else if (kulcs === 'kepesseg') jo = k.kepesseg === undefined ? (k.tipus ? false : null) : k.kepesseg === ertek;
    else jo = null;
    if (jo === false) return false;
    if (jo === null) ismeretlen = true;
  }
  return ismeretlen ? null : true;
}

// A karakter mutatványhatásai: [{ hatas, eredet, kulcs }]. A választásos hatás a karakter választása szerint
// bontódik ki (valasztasok[kulcs] = lehetőség id); a még nem választottak a `valasztandok` listába kerülnek.
export function karakterHatasai(lapok, lap, valasztasok = {}) {
  const ix = index(lapok);
  const hatasok = [];
  const valasztandok = [];
  const hozzaad = (h, eredet, kulcs) => {
    if (h.tipus !== 'valasztas') { hatasok.push({ hatas: h, eredet, kulcs }); return; }
    const v = valasztasok[h.kulcs];
    const kizart = h.kizar ? valasztasok[h.kizar] : null;
    const lehetosegek = h.lehetosegek.filter((l) => l.id !== kizart);
    const l = lehetosegek.find((x) => x.id === v);
    if (!l) { valasztandok.push({ kulcs: h.kulcs, kerdes: h.kerdes, lehetosegek, eredet }); return; }
    const kesz = { ...h.hatas };
    if (kesz.mutatvany_tipus === true) kesz.mutatvany_tipus = l.id; // Legendás: a választott típus
    else kesz.mutatvanyok = l.mutatvanyok;
    hatasok.push({ hatas: kesz, eredet: `${eredet}: ${l.nev}`, kulcs });
  };
  [['talentumok', 'Talentumok'], ['specializaciok', 'Specializációk']].forEach(([mezo, lapNev]) => {
    ((lap && lap[mezo]) || []).forEach((t) => {
      const e = t.elem || ix.elem(lapNev, t.id);
      const mh = reszletek(e).mutatvany_hatasok || {};
      Object.entries(mh).forEach(([fok, lista]) => {
        if ((t.db || 0) < fokozatSzam(FOKOZAT_KULCS[fok])) return;
        lista.forEach((h, i) => hozzaad(h, `${t.nev_hu || (e && e.nev_hu) || t.id} (${FOKOZAT_KULCS[fok]})`, `${t.id}:${fok}:${i}`));
      });
    });
  });
  // Osztályképességek a szintig (Szintlépés lap)
  const osztaly = lap && lap.osztaly && lap.osztaly.id;
  for (let n = 1; osztaly && n <= ((lap && lap.szint) || 0); n++) {
    const sor = ix.szintSor(osztaly, n);
    (reszletek(sor).kepessegek || []).forEach((k, i) => {
      const eredet = `${k.nev_hu || 'Osztályképesség'} (${lap.osztaly.nev_hu}, ${n}. szint)`;
      const kulcs = `${sor.id}:${i}`;
      if (k.tipus === 'mutatvany_kedvezmeny' && k.mutatvany && k.koltseg !== undefined && !k.szoveg_hatas) {
        hozzaad({ tipus: 'ar', mutatvany: k.mutatvany, koltseg: szam(k.koltseg), feltetel: k.feltetel, feltetel_gepi: k.feltetel_gepi }, eredet, kulcs);
      } else if (k.tipus === 'mutatvany_kedvezmeny' && k.mutatvany) {
        hozzaad({ tipus: 'szoveg', mutatvanyok: [k.mutatvany], szoveg: k.leiras, feltetel: k.feltetel, feltetel_gepi: k.feltetel_gepi }, eredet, kulcs);
      }
      if (k.mutatvany_hatas) hozzaad({ ...k.mutatvany_hatas, kulcs: k.mutatvany_hatas.kulcs }, eredet, kulcs + ':h');
    });
  }
  return { hatasok, valasztandok };
}

// Elérhető-e a különleges feltételű mutatvány (szint vagy specializáció kell hozzá).
function sajatFeltetel(m, lap) {
  const f = reszletek(m).feltetel;
  if (!f || typeof f !== 'object') return true;
  if (f.tipus === 'szint') {
    const n = parseInt(String(f.id).split('_').pop(), 10);
    const osz = String(f.id).replace(/^szint_/, 'osz_').replace(/_\d+$/, '');
    return !!(lap && lap.osztaly && lap.osztaly.id === osz && lap.szint >= n);
  }
  if (f.tipus === 'specializacio') {
    const s = ((lap && lap.specializaciok) || []).find((x) => x.id === f.id);
    return !!s && s.db >= (fokozatSzam(f.fokozat) || 1);
  }
  return true;
}

const ar0 = (m) => { const mp = reszletek(m).mp || {}; return { min: szam(mp.min, szam(m.mutatvanypont, 0)), max: mp.max === null || mp.max === undefined ? (mp.plusz ? null : szam(mp.min, 0)) : szam(mp.max), plusz: !!mp.plusz }; };

// A választó kínálata.
//   forrasok:   aktív források (üres: mind)
//   beallitas:  a kampány beállításai (mutatvanyok: { felfedezes, szerepjatek, isteni, nyomozas })
//   kontextus:  { tipus: 'alap'|'tamadas'|'varazslas', tul, fokusz, fegyver, fegyvercsoport, ketkezes, tamadas, kepesseg }
//   valasztasok: a karakter választásai (Előadóművészet, Mulatozás, Totemharcos, Legendás)
//   kapcsolok:  { [hatás kulcsa]: true } a nem eldönthető feltételekhez (a játékos jelöli)
// Visszaad: { csoportok: [{ tipus, nev, egyeb, mutatvanyok: [kártya] }], plusz: [...], valasztandok: [...], elso: típus }
// A lény (statblokk, web/js/jatek/leny.js) mutatványhatásai: kedvelt mutatványok saját ára, ár-módosítók.
// kinek: 'sajat' (a lény maga hajtja végre) vagy 'ellene' (a célpont: őt érő mutatványok ára).
export function lenyHatasai(leny, kinek) {
  const ki = [];
  if (!leny) return ki;
  // A statblokk kedvelt mutatványainál megadott ár (például „Hatalmas csapás (1 MP)”) már tartalmazza a lény
  // feltétel nélküli kedvezményeit, ezért ezekre a feltétel nélküli módosító nem vonódik le még egyszer.
  const sajatAr = new Set();
  if (kinek === 'sajat') {
    (leny.kedvelt_mutatvanyok || []).forEach((k) => {
      const ar = k.ar === undefined ? null : k.ar;
      if (k.id && ar !== null) { sajatAr.add(k.id); ki.push({ hatas: { tipus: 'ar', mutatvany: k.id, koltseg: Number(ar) }, eredet: 'Kedvelt mutatvány', kulcs: 'kedvelt:' + k.id }); }
    });
  }
  (leny.mutatvany_ar_modositok || []).forEach((m, i) => {
    const irany = m.kinek || (m.mod === 'immunis' || Number(m.mod) > 0 ? 'ellene' : 'sajat');
    if (irany !== kinek || m.mod === 'immunis') return;
    const eredet = (kinek === 'ellene' ? 'Célpont: ' : '') + (m.eredet || (leny.nev ? leny.nev : 'Lény képessége'));
    const mutatvanyok = (m.mutatvanyok || []).filter((id) => m.feltetel || !sajatAr.has(id));
    if (!mutatvanyok.length) return;
    ki.push({ hatas: { tipus: 'csokkent', mutatvanyok, mertek: -Number(m.mod), feltetel: m.feltetel || undefined }, eredet, kulcs: `${kinek}:${i}` });
  });
  return ki;
}

// opciok.celpont: a célpont lény-nézete (csatában); az ő ár-módosítói és immunitásai a kártyákon jelennek meg.
export function mutatvanyKinalat(lapok, lap, { forrasok, beallitas, kontextus = {}, valasztasok = {}, kapcsolok = {}, celpont = null } = {}) {
  const ix = index(lapok);
  const b = (beallitas && beallitas.mutatvanyok) || {};
  const engedett = { felfedezes: b.felfedezes !== false, szerepjatek: b.szerepjatek !== false, isteni: b.isteni === true, nyomozas: b.nyomozas === true };
  const forrasOk = (e) => !forrasok || !forrasok.length || forrasok.includes(e.forras);
  const kh = karakterHatasai(lapok, lap, valasztasok);
  const valasztandok = kh.valasztandok;
  const hatasok = kh.hatasok.concat(lenyHatasai(lap, 'sajat'), lenyHatasai(celpont, 'ellene'));
  const kedveltek = new Set(((lap && lap.kedvelt_mutatvanyok) || []).map((k) => k.id || 'sajat:' + k.kulcs));
  const immunitasok = ((celpont && celpont.mutatvany_ar_modositok) || []).filter((m) => m.mod === 'immunis');
  const ujak = new Set(hatasok.filter((h) => h.hatas.tipus === 'uj_mutatvany').map((h) => h.hatas.mutatvany));
  const elso = kontextusTipus(kontextus);

  const kartya = (m) => {
    const alap = ar0(m);
    const r = reszletek(m);
    const kedvezmenyek = []; const feltetelesek = []; const megjegyzesek = [];
    let beallitott = null; let csokkentes = 0; let minimum = 0;
    hatasok.forEach(({ hatas: h, eredet, kulcs }) => {
      const erinti = (h.mutatvany && h.mutatvany === m.id) || (h.mutatvanyok && (h.mutatvanyok.includes(m.id) || h.mutatvanyok.includes('*'))) ||
        (h.mutatvany_tipus && h.tipus === 'csokkent' && h.mutatvany_tipus === m.tipus);
      if (!erinti || !['ar', 'csokkent', 'szoveg'].includes(h.tipus)) return;
      const gepi = feltetelTeljesul(h.feltetel_gepi, kontextus);
      const vanFeltetel = !!(h.feltetel || h.feltetel_gepi);
      const teljesul = !vanFeltetel ? true : gepi === null ? !!kapcsolok[kulcs] : gepi;
      const mertek = h.mertek === undefined ? 1 : h.mertek;
      const leiras = h.tipus === 'ar' ? `${h.koltseg} pont` : h.tipus === 'csokkent' ? (mertek >= 0 ? `−${mertek} pont` : `+${-mertek} pont`) : h.szoveg;
      if (vanFeltetel && gepi === null) feltetelesek.push({ kulcs, feltetel: h.feltetel || 'ha teljesül', eredet, leiras, be: !!kapcsolok[kulcs] });
      if (!teljesul) return;
      if (h.tipus === 'szoveg') { megjegyzesek.push({ szoveg: h.szoveg, eredet }); return; }
      if (h.szoveg) megjegyzesek.push({ szoveg: h.szoveg, eredet });
      if (h.tipus === 'ar') { beallitott = beallitott === null ? h.koltseg : Math.min(beallitott, h.koltseg); kedvezmenyek.push({ eredet, leiras }); }
      if (h.tipus === 'csokkent') { csokkentes += mertek; minimum = Math.max(minimum, h.min || 0); kedvezmenyek.push({ eredet, leiras }); }
    });
    let uj = beallitott === null ? alap.min : Math.min(beallitott, alap.min);
    if (csokkentes) uj = Math.max(minimum, uj - csokkentes);
    const elteres = uj - alap.min;
    const ar = { min: uj, max: alap.max === null ? null : Math.max(uj, alap.max + elteres), plusz: alap.plusz };
    return {
      id: m.id, nev_hu: m.nev_hu, nev_en: m.nev_en, tipus: m.tipus, forras: m.forras, oldal: m.oldal, leiras: m.leiras_hu || '',
      alap_ar: alap, ar, valtozo: ar.plusz || (ar.max !== null && ar.max > ar.min),
      ismetelheto: !!r.ismetelheto, osszetevok: r.osszetevok || null, csomag_tipus: r.csomag_tipus || null,
      kedvezmenyek, feltetelesek, megjegyzesek, sajat: ujak.has(m.id) || !!(r.feltetel && typeof r.feltetel === 'object'),
      feltetel_szoveg: typeof r.feltetel === 'string' ? r.feltetel : '',
      kedvelt: kedveltek.has(m.id),
      immunis: immunitasok.filter((x) => (x.mutatvanyok || []).includes(m.id) || (x.mutatvanyok || []).includes('*')).map((x) => x.feltetel || 'a célpont immunis rá')
    };
  };
  // A lény saját (statblokkban leírt) mutatványai: fix vagy változó ár, a leírásuk a statblokkból.
  const sajatKartya = (s) => {
    const mp = s.mp === null || s.mp === undefined ? null : Number(s.mp);
    const ar = { min: mp || 1, max: mp, plusz: mp === null };
    return {
      id: 'sajat:' + s.kulcs, nev_hu: s.nev_hu, nev_en: s.nev_en, tipus: 'sajat', forras: (lap && lap.forras_cimke) || '', oldal: (lap && lap.oldal) || null,
      leiras: s.leiras || '', alap_ar: ar, ar, valtozo: mp === null, ismetelheto: false, osszetevok: null, csomag_tipus: null,
      kedvezmenyek: [], feltetelesek: [], megjegyzesek: [], sajat: true, feltetel_szoveg: '', kedvelt: kedveltek.has('sajat:' + s.kulcs), immunis: []
    };
  };

  const lista = ix.lista('Mutatványok').filter((m) => {
    const r = reszletek(m);
    if (r.szabaly || !m.tipus || m.tipus === 'szabály' || m.tipus === 'horda') return false;
    if (!forrasOk(m)) return false;
    const t = TIPUSOK.find((x) => x.tipus === m.tipus);
    if (!t) return false;
    if (t.beallitas && !engedett[t.beallitas]) return false;
    // a választható szabályok kikapcsolt sorai csak a kampány engedélyével (nyomozás)
    if (m.aktiv === false && !(t.beallitas && engedett[t.beallitas])) return false;
    if (m.tipus === 'csomag') {
      const ct = TIPUSOK.find((x) => x.tipus === r.csomag_tipus);
      if (ct && ct.beallitas && !engedett[ct.beallitas]) return false;
    }
    return sajatFeltetel(m, lap);
  });

  const sorrend = [elso].concat(TIPUSOK.map((t) => t.tipus).filter((t) => t !== elso));
  const csoportok = sorrend.map((tipus) => {
    const t = TIPUSOK.find((x) => x.tipus === tipus);
    const mutatvanyok = lista.filter((m) => m.tipus === tipus).map(kartya)
      .sort((a, c) => (c.kedvelt - a.kedvelt) || (c.sajat - a.sajat) || (a.ar.min - c.ar.min) || a.nev_hu.localeCompare(c.nev_hu, 'hu'));
    return { tipus, nev: t.nev, egyeb: !!t.egyeb, mutatvanyok };
  }).filter((cs) => cs.mutatvanyok.length);
  const sajatok = ((lap && lap.sajat_mutatvanyok) || []).map(sajatKartya);
  // Támadásnál a lény saját mutatványai elöl, egyébként a helyzethez illő típus után.
  if (sajatok.length) csoportok.splice(elso === 'harc' ? 0 : Math.min(1, csoportok.length), 0, { tipus: 'sajat', nev: 'Saját', egyeb: false, mutatvanyok: sajatok });

  return { csoportok, plusz: pluszPontok(lapok, lap, { kontextus, valasztasok, kapcsolok, hatasok }), valasztandok, elso: sajatok.length && elso === 'harc' ? 'sajat' : elso };
}

// További Mutatványpontok a karakter képességeiből: [{ kulcs, ertek, eredet, feltetel, be, kapcsolhato }].
// A társak képességei (Lelkesítés, Jövendölés) nem látszanak a karakteren: ezeket a felület kézi pontként veszi fel.
export function pluszPontok(lapok, lap, { kontextus = {}, valasztasok = {}, kapcsolok = {}, hatasok } = {}) {
  const hs = hatasok || karakterHatasai(lapok, lap, valasztasok).hatasok;
  const elso = kontextusTipus(kontextus);
  return hs.filter(({ hatas: h }) => h.tipus === 'mp_plusz' && (h.kinek || 'sajat') === 'sajat').map(({ hatas: h, eredet, kulcs }) => {
    let gepi = feltetelTeljesul(h.feltetel_gepi, kontextus);
    if (h.mutatvany_tipus) gepi = h.mutatvany_tipus === elso ? (gepi === false ? false : true) : null;
    const vanFeltetel = !!(h.feltetel || h.feltetel_gepi || h.mutatvany_tipus);
    const kapcsolhato = vanFeltetel && gepi !== false;
    const be = !vanFeltetel ? true : gepi === false ? false : kapcsolok[kulcs] !== undefined ? !!kapcsolok[kulcs] : gepi === true;
    const feltetel = h.mutatvany_tipus ? `ha a pontokat ${h.mutatvany_tipus} mutatványra költöd` : (h.feltetel || '');
    return { kulcs, ertek: h.ertek || 1, eredet, feltetel, be, kapcsolhato };
  }).filter((p) => p.kapcsolhato || p.be);
}

// A kosár ellenőrzése. kosar: [{ id, mp, db }] (mp: a tételre költött pont összesen).
// Visszaad: { osszes, maradt, hibak: [szöveg] }
export function kosarEllenoriz(kosar, pont, kinalat) {
  const kartyak = new Map();
  ((kinalat && kinalat.csoportok) || []).forEach((cs) => cs.mutatvanyok.forEach((m) => kartyak.set(m.id, m)));
  const hibak = [];
  let osszes = 0;
  const darab = new Map();
  (kosar || []).forEach((t) => {
    osszes += Number(t.mp) || 0;
    darab.set(t.id, (darab.get(t.id) || 0) + (Number(t.db) || 1));
    const m = kartyak.get(t.id);
    if (!m) return;
    if (!m.valtozo && !m.ismetelheto && (Number(t.db) || 1) > 1) hibak.push(`${m.nev_hu}: körönként egyszer.`);
    if (m.valtozo) {
      if (t.mp < m.ar.min) hibak.push(`${m.nev_hu}: legalább ${m.ar.min} pont.`);
      if (m.ar.max !== null && t.mp > m.ar.max) hibak.push(`${m.nev_hu}: legfeljebb ${m.ar.max} pont.`);
    }
  });
  darab.forEach((n, id) => {
    const m = kartyak.get(id);
    if (m && n > 1 && !m.ismetelheto && !m.valtozo && !hibak.some((h) => h.startsWith(m.nev_hu))) hibak.push(`${m.nev_hu}: körönként egyszer.`);
  });
  // csomag és a benne lévő mutatvány nem választható együtt
  (kosar || []).forEach((t) => {
    const m = kartyak.get(t.id);
    (m && m.osszetevok ? m.osszetevok : []).forEach((o) => {
      if (darab.has(o)) hibak.push(`${m.nev_hu}: már tartalmazza ezt: ${(kartyak.get(o) || {}).nev_hu || o}.`);
    });
  });
  if (osszes > pont) hibak.push(`Több pontot költenél (${osszes}), mint amennyi van (${pont}).`);
  return { osszes, maradt: pont - osszes, hibak };
}

// Egy kártya kosárba tétele: fix árú mutatványnál az ár, változónál a legkisebb ár; ismételhetőnél a darabszám nő.
export function kosarba(kosar, m) {
  const k = (kosar || []).slice();
  const i = k.findIndex((t) => t.id === m.id);
  if (i >= 0) {
    const t = { ...k[i] };
    if (m.valtozo) t.mp = t.mp + 1;
    else if (m.ismetelheto) { t.db = (t.db || 1) + 1; t.mp = m.ar.min * t.db; }
    else return k;
    k[i] = t;
    return k;
  }
  k.push({ id: m.id, nev: m.nev_hu, mp: m.ar.min, db: 1 });
  return k;
}
