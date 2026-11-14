// NJK-tár (3. lépés, 2. ütem): az NJK-k létrehozása, sablonjai és módosítása. Tiszta függvények,
// böngészőben és Node-ban is futnak. Teszt: node tools/teszt/njk.mjs. Terv: claude/csata-terv.md, „NJK-tár”.
//
// Egy NJK (az NJK-k lap sora): { id, nev, fajta, alap_szorny, fenyegetes, kampanyok, kotodes, iranyito, adat, verzio }
// adat: { statblokk (a Szörnyek lap reszletek szerkezete), erosites, kezi, szerep, allapot, szereplesek }.
// A számolt értékek a közös lény-nézetből jönnek: lenyNezet({ tipus: 'njk', sor }, lapok) (leny.js).
import { TULAJDONSAGOK } from '../karakter/tablak.js';
import { EROSITESEK, FENYEGETESEK } from './leny.js';

const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
const masol = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const reszletekBol = (e) => {
  const r = e && e.reszletek;
  if (!r) return {};
  if (typeof r === 'string') { try { return JSON.parse(r); } catch (err) { return {}; } }
  return r;
};

export const NJK_FAJTAK = {
  statblokk: { nev: 'Statblokkos NJK', leiras: 'Teljes harci értékekkel: visszatérő ellenfél, őr, zsoldos, saját lény.' },
  rovid: { nev: 'Rövid NJK', leiras: 'Nem harcoló szereplő, csak tulajdonságok és fókuszok (például a kocsmáros).' },
  koveto: { nev: 'Követő, társ', leiras: 'Egy karakterhez vagy a csapathoz kötődik; a játékos is irányíthatja.' }
};

// Az NJK szerepjátékos adatai (szerep): a játékos a nyilvános leírást láthatja, a többit csak a DM.
export const SZEREP_MEZOK = [
  { kulcs: 'koncepcio', nev: 'Koncepció', sugo: 'Egy mondat: ki ő, mit csinál.' },
  { kulcs: 'megjelenes', nev: 'Megjelenés' },
  { kulcs: 'motivacio', nev: 'Motiváció', sugo: 'Mit akar, mitől fél.' },
  { kulcs: 'nyilvanos', nev: 'Nyilvános leírás', sugo: 'Ezt látják a játékosok, ha megosztod.' },
  { kulcs: 'titkok', nev: 'Titkok és rejtett vonások', sugo: 'Csak te látod (Companion 102–103.: rejtett vonások).' },
  { kulcs: 'kapcsolatok', nev: 'Kapcsolatok' },
  { kulcs: 'dm_jegyzet', nev: 'DM-jegyzet', sugo: 'Csak te látod.' }
];

export function uresStatblokk() {
  return {
    tulajdonsagok: Object.fromEntries(TULAJDONSAGOK.map((t) => [t, 0])),
    fokuszok: [], fokusz_bonusz: {}, sebesseg: 10, mozgas: [], egeszseg: 10, vedekezes: 10, pancelertek: 0,
    tamadasok: [], kepessegek: [], kedvelt_mutatvanyok: [], sajat_mutatvanyok: [], mutatvany_ar_modositok: [],
    talentumok: [], fegyvercsoportok: []
  };
}

export const uresErosites = () => ({ fok: 'nincs', tulajdonsagok: {}, fokuszok: [], talentumok: [] });

// Új, üres NJK (még azonosító nélkül, az npc.save adja).
export function uresNjk({ nev = '', fajta = 'statblokk' } = {}) {
  const statblokk = uresStatblokk();
  if (fajta === 'rovid') { statblokk.nem_harcolo = true; delete statblokk.sebesseg; }
  return {
    nev, fajta, alap_szorny: '', fenyegetes: fajta === 'statblokk' ? 'Csekély' : '', kampanyok: [], kotodes: '', iranyito: '',
    adat: { statblokk, erosites: uresErosites(), kezi: [], szerep: {}, allapot: {}, szereplesek: [] }
  };
}

// Másolat egy bestiáriumi szörnyből: a statblokk változtatás nélkül átkerül, utána szabadon módosítható.
export function njkSzornybol(sor, { nev, fajta = 'statblokk' } = {}) {
  const r = masol(reszletekBol(sor));
  const n = uresNjk({ nev: nev || sor.nev_hu || sor.nev_en || '', fajta });
  n.alap_szorny = sor.id || '';
  n.fenyegetes = fajta === 'koveto' ? '' : (sor.fenyegetes || '');
  delete r.valtozatok; // a változatok kiegészítő ötletek, a szerkesztő a kártyáról mutatja őket
  n.adat.statblokk = Object.assign(uresStatblokk(), r);
  if (!r.csoport && sor.csoport) n.adat.statblokk.csoport = sor.csoport;
  n.adat.szerep = { koncepcio: '', nyilvanos: sor.leiras_hu || '' };
  if (fajta === 'koveto') {
    // KÉ 76.: a nem humanoid társ úgy viselkedik, mintha Animal Training (Journeyman) fokon képezték volna
    n.adat.szerep.feladatok = [];
    n.adat.szerep.koncepcio = 'Társállat (úgy engedelmeskedik, mint az Állatidomítás haladó fokán képzett állat).';
  }
  return n;
}

// Másolat egy NJK-ról (például „a farkasfalka vezére” a farkasból): új NJK lesz, a kép nélkül.
export function njkMasolat(n, nev) {
  const m = masol({ nev: nev || `${n.nev} (másolat)`, fajta: n.fajta, alap_szorny: n.alap_szorny, fenyegetes: n.fenyegetes,
    kampanyok: n.kampanyok || [], kotodes: n.kotodes || '', iranyito: n.iranyito || '', adat: n.adat || {} });
  if (m.adat.szerep) m.adat.szerep.kep = null;
  m.adat.szereplesek = [];
  m.adat.allapot = {};
  return m;
}

// ---- Fenyegetési sablon (Companion 104.) ----
// pont: a kilenc tulajdonságra osztható pont (max: a legnagyobb ajánlott érték), egeszseg: alap + Szívósság × szorzó,
// fokusz: fókuszok száma (plusz3: ettől a szinttől egy fókusz kétszer választva +3), talentum: talentumfok,
// specializáció és különleges képesség együtt, mp: alap + Akaraterő × szorzó.
export const FENYEGETESI_SABLONOK = [
  { nev: 'Csekély', pont: 10, max: 4, egeszseg: [25, 2], fokusz: 7, plusz3: false, talentum: 3, mp: [15, 2] },
  { nev: 'Mérsékelt', pont: 15, max: 6, egeszseg: [50, 5], fokusz: 10, plusz3: false, talentum: 6, mp: [30, 5] },
  { nev: 'Komoly', pont: 20, max: 8, egeszseg: [75, 10], fokusz: 13, plusz3: true, talentum: 9, mp: [50, 10] },
  { nev: 'Súlyos', pont: 25, max: 10, egeszseg: [75, 14], fokusz: 15, plusz3: true, talentum: 12, mp: [50, 14] },
  { nev: 'Legendás', pont: 30, max: 12, egeszseg: [75, 18], fokusz: 20, plusz3: true, talentum: 15, mp: [50, 18] }
];
export const sablonNev = (nev) => FENYEGETESI_SABLONOK.find((s) => s.nev === nev) || null;

// A statblokk összevetése a sablonnal. Semmit nem tilt, csak jelez. A harcos NJK Egészsége +5, a mágusé −5 lehet.
export function sablonAllas(statblokk, fenyegetes) {
  const s = sablonNev(fenyegetes);
  if (!s) return null;
  const r = statblokk || {};
  const tul = r.tulajdonsagok || {};
  const ertekek = TULAJDONSAGOK.map((t) => szam(tul[t]));
  const pontok = ertekek.reduce((a, x) => a + x, 0);
  const legnagyobb = Math.max(...ertekek);
  const fokuszDb = (r.fokuszok || []).length + Object.values(r.fokusz_bonusz || {}).filter((x) => szam(x) >= 3).length;
  const talentumDb = (r.talentumok || []).reduce((a, t) => a + Math.max(1, szam(t.fok, 1)), 0);
  const egeszsegAjanlott = s.egeszseg[0] + s.egeszseg[1] * szam(tul.tul_constitution);
  const mpAjanlott = s.mp[0] + s.mp[1] * szam(tul.tul_willpower);
  const fig = [];
  if (pontok > s.pont) fig.push(`A tulajdonságok összege ${pontok}, a sablon ${s.pont} pontot ajánl.`);
  if (legnagyobb > s.max) fig.push(`A legnagyobb tulajdonság ${legnagyobb}, a sablon legfeljebb ${s.max}-et ajánl.`);
  if (fokuszDb > s.fokusz) fig.push(`${fokuszDb} fókusz, a sablon ${s.fokusz}-et ajánl.`);
  if (!s.plusz3 && Object.values(r.fokusz_bonusz || {}).some((x) => szam(x) >= 3)) fig.push('+3-as fókusz csak Komoly fenyegetéstől ajánlott.');
  if (talentumDb > s.talentum) fig.push(`${talentumDb} talentumfok, a sablon ${s.talentum}-at ajánl.`);
  if (Math.abs(szam(r.egeszseg) - egeszsegAjanlott) > 5) fig.push(`Az Egészség ${szam(r.egeszseg)}, a sablon szerint ${egeszsegAjanlott} (harcosnál +5, mágusnál −5 belefér).`);
  return {
    sablon: s, pontok, maradek: s.pont - pontok, legnagyobb, fokuszok: fokuszDb, talentumok: talentumDb,
    egeszseg_ajanlott: egeszsegAjanlott, mp_ajanlott: mpAjanlott, figyelmeztetesek: fig
  };
}

// Új NJK a fenyegetési sablonból: üres tulajdonságokkal, a sablon Egészségével; a DM osztja el a pontokat.
export function njkSablonbol(fenyegetes, nev = '') {
  const s = sablonNev(fenyegetes) || FENYEGETESI_SABLONOK[0];
  const n = uresNjk({ nev, fajta: 'statblokk' });
  n.fenyegetes = s.nev;
  n.adat.statblokk.egeszseg = s.egeszseg[0];
  n.adat.statblokk.sablon = s.nev;
  return n;
}

// ---- Követő, társ (Companion 98–99., Kampányépítő 75–76.) ----

// A követő Egészsége a gazda karakterének fele; a csapathoz kötve a második legkisebb Egészségű karakteré.
export function kovetoEgeszseg(gazdaEgeszseg) {
  return Math.floor(szam(gazdaEgeszseg) / 2);
}
export function csapatKovetoEgeszseg(egeszsegek) {
  const l = (egeszsegek || []).map((x) => szam(x)).filter((x) => x > 0).sort((a, b) => a - b);
  if (!l.length) return null;
  return Math.floor((l.length > 1 ? l[1] : l[0]) / 2);
}

// Két-három tulajdonság 2-es, néhány 1-es, 2–3 fókusz. Csak jelez.
export function kovetoAllas(statblokk) {
  const tul = (statblokk && statblokk.tulajdonsagok) || {};
  const ertekek = TULAJDONSAGOK.map((t) => szam(tul[t]));
  const ketesek = ertekek.filter((x) => x === 2).length;
  const egyesek = ertekek.filter((x) => x === 1).length;
  const nagyobb = ertekek.filter((x) => x > 2).length;
  const fokuszok = ((statblokk && statblokk.fokuszok) || []).length;
  const fig = [];
  if (nagyobb) fig.push('A követőnek ritkán van 2-nél nagyobb tulajdonsága; ha kell, adj neki teljes statblokkot.');
  if (ketesek > 3) fig.push(`${ketesek} tulajdonság 2-es (a szokásos kettő vagy három).`);
  if (fokuszok > 3) fig.push(`${fokuszok} fókusz (a szokásos kettő vagy három).`);
  return { ketesek, egyesek, fokuszok, figyelmeztetesek: fig };
}

export function njkKovetoSablon(nev = '', { egeszseg } = {}) {
  const n = uresNjk({ nev, fajta: 'koveto' });
  n.fenyegetes = '';
  n.adat.statblokk.egeszseg = szam(egeszseg, 10);
  n.adat.szerep.feladatok = [];
  return n;
}

// ---- Erősítés (AK 104.) ----

const FOKOK = ['nincs', 'elit', 'hosi', 'epikus'];
// Egy fokkal feljebb lép; a már kiosztott pontok megmaradnak (a felület jelzi, mennyi maradt).
export function erositesFeljebb(erosites) {
  const e = masol(erosites || uresErosites());
  const i = FOKOK.indexOf(e.fok || 'nincs');
  e.fok = FOKOK[Math.min(FOKOK.length - 1, i + 1)];
  e.tulajdonsagok = e.tulajdonsagok || {};
  e.fokuszok = e.fokuszok || [];
  e.talentumok = e.talentumok || [];
  return e;
}
export const erositesNev = (fok) => (EROSITESEK[fok] || EROSITESEK.nincs).nev;

// ---- Különleges képességek (Import 11: Különleges képességek lap) ----
// A lap reszletek mezője (géppel olvasható hatások):
//   modositok: [{ cel, ertek }]  (a kézi módosítók céljai: tul_…, egeszseg_max, vedekezes, sebesseg, pancelertek)
//   fokuszok: [id]  fokusz_javitas: id (ha már megvan, +3 lesz)  mozgas: 'repülés' | 'úszás' | 'ásás' (a Sebességgel)
//   gepi: { … } (a képesség gépi kulcsai, például sotetlatas)  tamadas: { nev_hu, nev_en, tul, fokusz, sebzes }
//   mutatvany_ar_modositok: [...]  sajat_mutatvanyok: [...]  tovabbi: [más képességek azonosítói] (sablonoknál)
//   kepesseg_tipus: a képességlista típusa (passzív, fő, mellék …)
// Minden hozzáadott elem megjelölve (kepesseg: id), így a képesség nyomtalanul eltávolítható.

export function vanKepesseg(adat, id) {
  return (((adat && adat.statblokk) || {}).kepessegek || []).some((k) => k.kepesseg_id === id);
}

export function kepessegHozzaadas(adat, sor, lapok) {
  const a = masol(adat || {});
  a.statblokk = a.statblokk || uresStatblokk();
  a.kezi = a.kezi || [];
  if (!sor || vanKepesseg(a, sor.id)) return a;
  const r = reszletekBol(sor);
  const sb = a.statblokk;
  const hozzaadott = { fokuszok: [], fokusz_bonusz: [] };
  (r.modositok || []).forEach((m) => a.kezi.push({ cel: m.cel, ertek: szam(m.ertek), megjegyzes: sor.nev_hu, kepesseg: sor.id }));
  sb.fokuszok = sb.fokuszok || [];
  (r.fokuszok || []).forEach((f) => { if (!sb.fokuszok.includes(f)) { sb.fokuszok.push(f); hozzaadott.fokuszok.push(f); } });
  if (r.fokusz_javitas) {
    const f = r.fokusz_javitas;
    sb.fokusz_bonusz = sb.fokusz_bonusz || {};
    if (sb.fokuszok.includes(f) && !hozzaadott.fokuszok.includes(f)) {
      if (szam(sb.fokusz_bonusz[f], 2) < 3) { sb.fokusz_bonusz[f] = 3; hozzaadott.fokusz_bonusz.push(f); }
    } else if (!sb.fokuszok.includes(f)) { sb.fokuszok.push(f); hozzaadott.fokuszok.push(f); }
  }
  if (r.mozgas) {
    sb.mozgas = sb.mozgas || [];
    if (!sb.mozgas.some((m) => m.tipus === r.mozgas)) sb.mozgas.push({ tipus: r.mozgas, ertek: szam(sb.sebesseg, 10), kepesseg: sor.id });
  }
  if (r.tamadas) {
    sb.tamadasok = sb.tamadasok || [];
    sb.tamadasok.push({ ...r.tamadas, kulcs: 'kep_' + sor.id, szamolt: true, kepesseg: sor.id });
  }
  (r.mutatvany_ar_modositok || []).forEach((m) => { sb.mutatvany_ar_modositok = (sb.mutatvany_ar_modositok || []).concat([{ ...m, kepesseg: sor.id }]); });
  (r.sajat_mutatvanyok || []).forEach((m) => { sb.sajat_mutatvanyok = (sb.sajat_mutatvanyok || []).concat([{ ...m, kepesseg: sor.id }]); });
  sb.kepessegek = (sb.kepessegek || []).concat([{
    nev_hu: sor.nev_hu, nev_en: sor.nev_en || '', tipus: r.kepesseg_tipus || 'passzív', leiras: sor.leiras_hu || '',
    gepi: r.gepi || undefined, kepesseg_id: sor.id, hozzaadott
  }]);
  let ki = a;
  (r.tovabbi || []).forEach((id) => {
    const masik = ((lapok && lapok['Különleges képességek']) || []).find((x) => x.id === id);
    if (masik) ki = kepessegHozzaadas(ki, masik, lapok);
  });
  return ki;
}

export function kepessegEltavolitas(adat, id) {
  const a = masol(adat || {});
  const sb = a.statblokk || {};
  const k = (sb.kepessegek || []).find((x) => x.kepesseg_id === id);
  const h = (k && k.hozzaadott) || { fokuszok: [], fokusz_bonusz: [] };
  a.kezi = (a.kezi || []).filter((m) => m.kepesseg !== id);
  sb.fokuszok = (sb.fokuszok || []).filter((f) => !(h.fokuszok || []).includes(f));
  (h.fokusz_bonusz || []).forEach((f) => { if (sb.fokusz_bonusz) delete sb.fokusz_bonusz[f]; });
  ['mozgas', 'tamadasok', 'mutatvany_ar_modositok', 'sajat_mutatvanyok'].forEach((m) => {
    if (Array.isArray(sb[m])) sb[m] = sb[m].filter((x) => x.kepesseg !== id);
  });
  sb.kepessegek = (sb.kepessegek || []).filter((x) => x.kepesseg_id !== id);
  return a;
}

// ---- Szerkesztés segédei ----

// A szerkesztett támadás: a tulajdonságból és a fókuszból számolt bónusszal.
export const ujTamadas = () => ({ nev_hu: '', nev_en: '', tul: 'tul_fighting', fokusz: '', sebzes: '1d6', szamolt: true });

// A szereplés bejegyzése (a csata lezárásakor, 4–5. ütem).
export function szereplesBejegyzes(adat, bejegyzes, max = 50) {
  const a = masol(adat || {});
  a.szereplesek = (a.szereplesek || []).concat([bejegyzes]).slice(-max);
  return a;
}

// Az NJK kampányainak és kötődésének rövid leírása a listákhoz.
export function kotodesSzoveg(n, karakterNev) {
  if (!n || n.fajta !== 'koveto') return '';
  if (n.kotodes === 'csapat') return 'a csapat követője';
  if (n.kotodes) return `${karakterNev(n.kotodes) || 'ismeretlen karakter'} követője`;
  return 'nincs gazdája';
}

// Szűrés az NJK-tár listájához. szuro: { szoveg, fajta, kampany, archivalt }
export function njkSzures(lista, szuro = {}) {
  const sz = String(szuro.szoveg || '').trim().toLowerCase();
  return (lista || []).filter((n) => {
    if (!szuro.archivalt && n.aktiv === false) return false;
    if (szuro.fajta && n.fajta !== szuro.fajta) return false;
    if (szuro.kampany === '_nincs' && (n.kampanyok || []).length) return false;
    if (szuro.kampany && szuro.kampany !== '_nincs' && !(n.kampanyok || []).includes(szuro.kampany)) return false;
    if (!sz) return true;
    return [n.nev, n.koncepcio, n.fenyegetes].some((x) => String(x || '').toLowerCase().includes(sz));
  }).sort((a, b) => String(a.nev).localeCompare(String(b.nev), 'hu'));
}

export { FENYEGETESEK };
