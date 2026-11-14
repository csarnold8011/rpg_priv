// Közös lény-nézet (3. lépés): bárki, aki csatában részt vehet, ugyanazt a számolt szerkezetet adja,
// akár bestiáriumi szörny, akár statblokkos NJK, akár játékos karakter.
// Tiszta függvények, böngészőben és Node-ban is futnak. Teszt: node tools/teszt/leny.mjs
//
// A nézet a karakterlap („lap”) mezőneveit követi, így a próbamotor (proba.js: probaOsszeallit)
// változtatás nélkül dolgozik vele: tulajdonsagok[t].ertek, fokuszok[id].bonusz.
import { karakterSzamol, sebzesSzoveg } from '../karakter/szamol.js';
import { TULAJDONSAGOK } from '../karakter/tablak.js';

const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
const reszletekBol = (e) => {
  const r = e && e.reszletek;
  if (!r) return {};
  if (typeof r === 'string') { try { return JSON.parse(r); } catch (err) { return {}; } }
  return r;
};
const nevE = (e, tartalek) => (e ? e.nev_hu || e.nev_en || e.id : tartalek || '');
const keres = (lapok, lap, id) => ((lapok && lapok[lap]) || []).find((x) => x.id === id) || null;

// Fenyegetési szintek (AK 105.): név és a csapat szintje, akinek nagyjából megfelel.
export const FENYEGETESEK = [
  { nev: 'Csekély', en: 'Minor', szint: [1, 4] },
  { nev: 'Mérsékelt', en: 'Moderate', szint: [5, 8] },
  { nev: 'Komoly', en: 'Major', szint: [9, 12] },
  { nev: 'Súlyos', en: 'Dire', szint: [13, 17] },
  { nev: 'Legendás', en: 'Legendary', szint: [18, 20] }
];
export const fenyegetesSorszam = (nev) => FENYEGETESEK.findIndex((f) => f.nev === nev || f.en === nev);

// Erősítés (AK 104., Bestiárium 3.): mennyi tulajdonságpont, fókusz, Egészség, Páncélérték és talentumfokozat jár.
// A tulajdonságpontok: „a” darab tulajdonság kap „+b”-t (például elit: három tulajdonság +1).
export const EROSITESEK = {
  nincs: { nev: 'Nincs', tul: [], fokusz: 0, egeszseg: 0, pancel: 0, talentum: 0 },
  elit: { nev: 'Elit', tul: [{ db: 3, ertek: 1 }], fokusz: 2, egeszseg: 5, pancel: 0, talentum: 1 },
  hosi: { nev: 'Hősi', tul: [{ db: 2, ertek: 2 }, { db: 3, ertek: 1 }], fokusz: 4, egeszseg: 15, pancel: 0, talentum: 2 },
  epikus: { nev: 'Epikus', tul: [{ db: 1, ertek: 3 }, { db: 2, ertek: 2 }, { db: 3, ertek: 1 }], fokusz: 5, egeszseg: 20, pancel: 3, talentum: 3 }
};

// Az erősítés kiosztásának ellenőrzése. erosites: { fok, tulajdonsagok: { tul: +n }, fokuszok: [id], talentumok: [{ id, fok }] }.
// Visszaad: { keret, maradek: { tul: [{ ertek, db }], fokusz, talentum }, hibak: [szöveg] }. Semmit nem tilt, csak jelez.
export function erositesAllas(erosites) {
  const e = erosites || {};
  const keret = EROSITESEK[e.fok] || EROSITESEK.nincs;
  const hibak = [];
  const kiosztott = Object.entries(e.tulajdonsagok || {}).filter(([, v]) => szam(v) !== 0);
  const tulMaradek = keret.tul.map((k) => ({ ertek: k.ertek, db: k.db - kiosztott.filter(([, v]) => szam(v) === k.ertek).length }));
  kiosztott.forEach(([t, v]) => {
    if (!keret.tul.some((k) => k.ertek === szam(v))) hibak.push(`${t}: +${v} nem illik a(z) ${keret.nev} erősítéshez.`);
  });
  tulMaradek.filter((m) => m.db < 0).forEach((m) => hibak.push(`Túl sok +${m.ertek} tulajdonságnövelés.`));
  const fokusz = keret.fokusz - (e.fokuszok || []).length;
  if (fokusz < 0) hibak.push('Túl sok új fókusz.');
  const talentum = keret.talentum - (e.talentumok || []).reduce((a, t) => a + Math.max(1, szam(t.fok, 1)), 0);
  if (talentum < 0) hibak.push('Túl sok talentumfokozat.');
  return { keret, maradek: { tul: tulMaradek, fokusz, talentum }, hibak };
}

// Az ár-módosítók egy mutatványra: a lény saját mutatványainak ára (kinek = 'sajat') vagy a lény ellen
// végrehajtott mutatványoké (kinek = 'ellene'). A feltétel szöveg; itt mind beszámít, a felület megmutatja.
export function mutatvanyArModositas(leny, mutatvanyId, kinek) {
  let mod = 0;
  let immunis = false;
  const reszek = [];
  ((leny && leny.mutatvany_ar_modositok) || []).forEach((m) => {
    if ((m.kinek || (m.mod === 'immunis' || szam(m.mod) > 0 ? 'ellene' : 'sajat')) !== kinek) return;
    if (!(m.mutatvanyok || []).includes('*') && !(m.mutatvanyok || []).includes(mutatvanyId)) return;
    if (m.mod === 'immunis') immunis = true; else mod += szam(m.mod);
    reszek.push({ mod: m.mod, feltetel: m.feltetel || '' });
  });
  return { mod, immunis, reszek };
}

function fokuszLista(lapok, ids, extra) {
  const ki = {};
  (ids || []).forEach((id) => {
    const e = keres(lapok, 'Fókuszok', id);
    // Ha a fókusz nincs a szabályadatban, az azonosítóból (fok_<tulajdonság>_…) derül ki a tulajdonsága.
    const m = String(id).match(/^fok_([a-z]+)_/);
    ki[id] = { id, nev_hu: nevE(e, id), tulajdonsag: e ? e.tulajdonsag : (m ? 'tul_' + m[1] : null), bonusz: szam((extra || {})[id], 2) };
  });
  return ki;
}

// Kedvelt mutatványok feloldása: { id } a Mutatványok lapról, { sajat } a lény saját mutatványai közül.
function kedveltFeloldas(lapok, r) {
  const sajat = r.sajat_mutatvanyok || [];
  return (r.kedvelt_mutatvanyok || []).map((k) => {
    if (k.id) {
      const m = keres(lapok, 'Mutatványok', k.id);
      return { id: k.id, nev_hu: nevE(m, k.id), nev_en: m ? m.nev_en : '', mp: k.mp || (m ? m.mutatvanypont : null), ar: k.mp ? Number(k.mp) : null, sajat: false };
    }
    const s = sajat.find((x) => x.kulcs === k.sajat);
    return { kulcs: k.sajat, nev_hu: s ? s.nev_hu : (k.nev_en || k.sajat), nev_en: s ? s.nev_en : k.nev_en, mp: k.mp || (s ? s.mp : null), sajat: true };
  });
}

// Statblokk (bestiáriumi szörny vagy statblokkos NJK) → nézet.
// statblokk: a Szörnyek lap `reszletek` szerkezete; opciok.erosites és opciok.kezi a módosításokhoz,
// opciok.allapot a csatán túl megmaradó Egészség, Mágiapont, feltételek.
export function statblokkNezet(statblokk, lapok, opciok = {}) {
  const r = statblokk || {};
  const er = opciok.erosites || r.erosites || null;
  const kezi = opciok.kezi || r.kezi || [];
  const alapTul = Object.assign(Object.fromEntries(TULAJDONSAGOK.map((t) => [t, 0])), r.tulajdonsagok || {});
  const tul = {};
  TULAJDONSAGOK.forEach((t) => {
    const reszek = [{ ertek: szam(alapTul[t]), eredet: 'Alapérték' }];
    if (er && er.tulajdonsagok && szam(er.tulajdonsagok[t])) reszek.push({ ertek: szam(er.tulajdonsagok[t]), eredet: (EROSITESEK[er.fok] || {}).nev || 'Erősítés' });
    kezi.filter((k) => k.cel === t).forEach((k) => reszek.push({ ertek: szam(k.ertek), eredet: k.megjegyzes || 'Kézi módosítás' }));
    tul[t] = { ertek: reszek.reduce((a, x) => a + x.ertek, 0), reszek };
  });
  const delta = (t) => tul[t].ertek - szam(alapTul[t]);
  const ujFokuszok = [...((er && er.fokuszok) || []), ...kezi.filter((k) => String(k.cel).startsWith('fok_')).map((k) => k.cel)];
  const fokIds = [...new Set([...(r.fokuszok || []), ...ujFokuszok])];
  const fokuszok = fokuszLista(lapok, fokIds, r.fokusz_bonusz);
  const erk = EROSITESEK[(er && er.fok) || 'nincs'] || EROSITESEK.nincs;
  const kezik = (cel) => kezi.filter((k) => k.cel === cel).reduce((a, k) => a + szam(k.ertek), 0);

  // Támadások: a forrás bónuszát és sebzését a tulajdonság- és fókuszváltozással igazítjuk.
  const tamadasok = (r.tamadasok || []).map((a, i) => {
    const t = a.tul || null;
    let bonusz = a.bonusz === null || a.bonusz === undefined ? null : szam(a.bonusz);
    // szamolt: a szerkesztőben felvett támadás, a bónusz a (módosított) tulajdonságból és a fókuszból jön
    if (a.szamolt && t) bonusz = tul[t].ertek + (a.fokusz && fokuszok[a.fokusz] ? fokuszok[a.fokusz].bonusz : 0);
    else if (bonusz !== null && t) {
      bonusz += delta(t);
      if (a.fokusz && !(r.fokuszok || []).includes(a.fokusz) && fokuszok[a.fokusz]) bonusz += fokuszok[a.fokusz].bonusz;
    }
    const tavolsagi = !!a.hatotav;
    const sebzesTul = a.sebzes_tul || (tavolsagi && /íj|bow|crossbow|számszeríj/i.test(`${a.nev_en} ${a.nev_hu}`) ? 'tul_perception' : 'tul_strength');
    const sebzes = a.sebzes && delta(sebzesTul) ? sebzesSzoveg(a.sebzes, delta(sebzesTul)) : (a.sebzes || '');
    return {
      kulcs: a.kulcs || 'tamadas_' + i, nev_hu: a.nev_hu, nev_en: a.nev_en || '', tulajdonsag: t, fokusz: a.fokusz || null,
      tamadas: bonusz, sebzes, hatotav: a.hatotav || null, tavolsagi, atuto: !!a.atuto, megjegyzes: a.megjegyzes || '',
      fegyver: a.fegyver || null, termeszetes: !a.fegyver
    };
  });

  const egeszsegMax = szam(r.egeszseg) + erk.egeszseg + kezik('egeszseg_max');
  const mpMax = r.magiapont === undefined || r.magiapont === null ? null : szam(r.magiapont) + kezik('magiapont_max');
  const allapot = opciok.allapot || r.allapot || {};
  const kepessegek = (r.kepessegek || []).map((k) => ({ ...k }));
  const gepi = (kulcs) => kepessegek.some((k) => k.gepi && k.gepi[kulcs]);
  const vedekezes = szam(r.vedekezes, 10) + delta('tul_dexterity') + kezik('vedekezes');
  return {
    tipus: 'statblokk',
    tulajdonsagok: tul,
    fokuszok,
    sebesseg: { ertek: r.sebesseg === null || r.sebesseg === undefined ? null : szam(r.sebesseg) + delta('tul_dexterity') + kezik('sebesseg'), mozgas: r.mozgas || [], megjegyzes: r.sebesseg_megjegyzes || '' },
    egeszseg: { ertek: egeszsegMax, aktualis: allapot.egeszseg === null || allapot.egeszseg === undefined ? egeszsegMax : szam(allapot.egeszseg) },
    magiapont: mpMax === null ? null : { ertek: mpMax, aktualis: allapot.magiapont === null || allapot.magiapont === undefined ? mpMax : szam(allapot.magiapont) },
    varazsero: r.varazsero === undefined ? null : { ertek: szam(r.varazsero) + delta(r.varazsero_tul || 'tul_willpower'), megjegyzes: r.varazsero_megjegyzes || '' },
    vedekezes: { ertek: vedekezes, megjegyzes: r.vedekezes_megjegyzes || '' },
    pancelertek: { ertek: szam(r.pancelertek) + erk.pancel + kezik('pancelertek'), atuto_ellen: gepi('pancel_atuto_ellen'), megjegyzes: r.pancel_megjegyzes || '' },
    pancel: null,
    tamadasok,
    kepessegek,
    kedvelt_mutatvanyok: kedveltFeloldas(lapok, r),
    sajat_mutatvanyok: r.sajat_mutatvanyok || [],
    mutatvany_ar_modositok: r.mutatvany_ar_modositok || [],
    talentumok: [...(r.talentumok || []), ...((er && er.talentumok) || [])].map((t) => ({ ...t, db: t.db || t.fok || 1, nev_hu: nevE(keres(lapok, 'Talentumok', t.id), t.id) })),
    arkanumok: (r.arkanumok || []).map((t) => ({ ...t, nev_hu: nevE(keres(lapok, 'Arkánumok', t.id), t.id) })),
    varazslatok: (r.varazslatok || []).map((v) => (v.id ? { id: v.id, nev_hu: nevE(keres(lapok, 'Varázslatok', v.id), v.id) } : { id: null, nev_hu: v.nev_en })),
    fegyvercsoportok: r.fegyvercsoportok || [],
    sotetlatas: gepi('sotetlatas'),
    raj: gepi('raj'),
    kozelharc_tav: Math.max(0, ...kepessegek.map((k) => szam(k.gepi && k.gepi.kozelharc_tav))) || null,
    nem_harcolo: !!r.nem_harcolo,
    erosites: er && er.fok && er.fok !== 'nincs' ? { fok: er.fok, nev: erk.nev } : null,
    feltetelek: allapot.feltetelek || []
  };
}

// Karakter → nézet: a karakterszámoló eredményéből, ugyanazokkal a mezőkkel.
export function karakterNezet(adat, lapok, opciok = {}) {
  const lap = opciok.lap || karakterSzamol(adat, lapok);
  const tamadasok = (lap.fegyverek || []).filter((w) => w.felszerelve !== false).map((w) => ({
    kulcs: w.id, nev_hu: w.nev_hu, nev_en: '', tulajdonsag: w.tulajdonsag, fokusz: w.fokusz, tamadas: w.tamadas, sebzes: w.sebzes,
    hatotav: w.hatotav || null, tavolsagi: !!w.tavolsagi, atuto: false, megjegyzes: w.ismert === false ? 'Képzetlen fegyvercsoport.' : '',
    fegyver: w.termeszetes ? null : w.id, termeszetes: !!w.termeszetes
  }));
  return {
    tipus: 'karakter',
    lap,
    tulajdonsagok: lap.tulajdonsagok,
    fokuszok: lap.fokuszok,
    sebesseg: { ertek: lap.sebesseg ? lap.sebesseg.ertek : null, mozgas: [], megjegyzes: '' },
    egeszseg: { ertek: lap.egeszseg.ertek, aktualis: lap.egeszseg.aktualis },
    magiapont: lap.magiapont ? { ertek: lap.magiapont.ertek, aktualis: lap.magiapont.aktualis } : null,
    varazsero: null,
    vedekezes: { ertek: lap.vedekezes.ertek, megjegyzes: '' },
    pancelertek: { ertek: lap.pancelertek.ertek, atuto_ellen: false, megjegyzes: '' },
    pancel: lap.pancel,
    tamadasok,
    kepessegek: (lap.kepessegek || []).map((k) => ({ nev_hu: k.nev_hu, nev_en: k.nev_en, tipus: k.tipus, leiras: k.leiras, eredet: k.eredet })),
    kedvelt_mutatvanyok: [],
    sajat_mutatvanyok: [],
    mutatvany_ar_modositok: [],
    talentumok: lap.talentumok || [],
    arkanumok: lap.arkanumok || [],
    varazslatok: lap.varazslatok || [],
    fegyvercsoportok: (lap.fegyvercsoportok || []).map((c) => c.id),
    sotetlatas: !!lap.sotetlatas,
    raj: false,
    kozelharc_tav: null,
    nem_harcolo: false,
    erosites: null,
    feltetelek: (lap.allapot && lap.allapot.feltetelek) || []
  };
}

// Egységes belépési pont.
// forras: { tipus: 'karakter', adat } | { tipus: 'szorny', sor } (a Szörnyek lap sora vagy id) |
//         { tipus: 'njk', sor } (az NJK-k lap sora vagy a state.get njkk eleme; az adat.statblokk-ot használja).
export function lenyNezet(forras, lapok, opciok = {}) {
  if (!forras) return null;
  if (forras.tipus === 'karakter') {
    return Object.assign(karakterNezet(forras.adat, lapok, opciok), { nev: forras.adat && forras.adat.nev, forras: { tipus: 'karakter', id: forras.id || null } });
  }
  if (forras.tipus === 'szorny') {
    const sor = typeof forras.sor === 'string' ? keres(lapok, 'Szörnyek', forras.sor) : forras.sor;
    if (!sor) return null;
    const r = reszletekBol(sor);
    return Object.assign(statblokkNezet(r, lapok, opciok), {
      nev: sor.nev_hu, nev_en: sor.nev_en, fenyegetes: sor.fenyegetes || '', csoport: sor.csoport || r.csoport || '',
      leny_tipus: sor.tipus || '', forras_cimke: sor.forras, oldal: sor.oldal, forras: { tipus: 'szorny', id: sor.id }
    });
  }
  if (forras.tipus === 'njk') {
    const sor = forras.sor || {};
    const adat = typeof sor.adat === 'string' ? (() => { try { return JSON.parse(sor.adat); } catch (e) { return {}; } })() : (sor.adat || {});
    let sb = adat.statblokk || {};
    // rövid NJK (AK 105.): csak tulajdonság és fókusz; ha mégis kell, Egészség 10 + Szívósság, Védekezés 10 + Ügyesség
    if (sor.fajta === 'rovid') {
      const tul = sb.tulajdonsagok || {};
      sb = { ...sb, nem_harcolo: true, tamadasok: sb.tamadasok || [],
        egeszseg: sb.egeszseg === undefined || sb.egeszseg === null || sb.egeszseg === '' ? 10 + szam(tul.tul_constitution) : sb.egeszseg,
        vedekezes: sb.vedekezes === undefined || sb.vedekezes === null || sb.vedekezes === '' ? 10 + szam(tul.tul_dexterity) : sb.vedekezes };
    }
    return Object.assign(statblokkNezet(sb, lapok, { erosites: adat.erosites, kezi: adat.kezi, allapot: adat.allapot, ...opciok }), {
      nev: sor.nev, fenyegetes: sor.fenyegetes || '', csoport: sb.csoport || '', fajta: sor.fajta || 'statblokk',
      forras: { tipus: 'njk', id: sor.id }
    });
  }
  return null;
}

// Rövid kivonat a listákhoz (Bestiárium kártya fejléce).
export function lenyKivonat(n) {
  if (!n) return null;
  return {
    sebesseg: n.sebesseg.ertek, egeszseg: n.egeszseg.ertek, vedekezes: n.vedekezes.ertek, pancelertek: n.pancelertek.ertek,
    legjobb_tamadas: n.tamadasok.reduce((a, t) => (t.tamadas !== null && (a === null || t.tamadas > a) ? t.tamadas : a), null)
  };
}

// Szűrés a Bestiárium nézethez. szuro: { szoveg, fenyegetes: [nevek], csoport: [nevek], forras: [címkék] }.
export function szornySzures(sorok, szuro = {}) {
  const sz = String(szuro.szoveg || '').trim().toLowerCase();
  const norm = (s) => String(s || '').toLowerCase();
  return (sorok || []).filter((s) => {
    if (s.aktiv === false) return false;
    const r = reszletekBol(s);
    const csoport = s.csoport || r.csoport || '';
    if (szuro.fenyegetes && szuro.fenyegetes.length && !szuro.fenyegetes.includes(s.fenyegetes)) return false;
    if (szuro.csoport && szuro.csoport.length && !szuro.csoport.includes(csoport)) return false;
    if (szuro.forras && szuro.forras.length && !szuro.forras.includes(s.forras)) return false;
    if (!sz) return true;
    return [s.nev_hu, s.nev_en, r.mas_nevek, csoport].some((x) => norm(x).includes(sz));
  }).sort((a, b) => fenyegetesSorszam(a.fenyegetes) - fenyegetesSorszam(b.fenyegetes) || String(a.nev_hu).localeCompare(String(b.nev_hu), 'hu'));
}

export const szornyCsoport = (s) => (s && (s.csoport || reszletekBol(s).csoport)) || '';
