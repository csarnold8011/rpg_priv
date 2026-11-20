// Kampányjátszó 6.5: jutalmak kiosztása, csapatkassza, zsákmány elosztása (tiszta függvények).
// A kiosztás egy reward.give hívás (backend/Jutalmak.gs): karakterenként pénz, tárgy, jutalombejegyzés, és a kassza mozgása;
// társnál az NJK kötődése. Itt készül a kérés a jutalom elemből (5.6) vagy a zsákmányból, és itt van a kassza nézete.
// A pénz mindig rézben (1 ezüst = 10 réz).
import * as JU from './jutalom.js';
import { penzSzoveg } from '../karakter/varazslo.js';

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();
const egesz = (x) => Math.round(Number(szoveg(x).replace('−', '-')) || 0);

export const ujKiosztasId = () => 'ko_' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(-12);

export const KIOSZTAS_FAJTAK = {
  jutalom: { nev: 'Jutalom', jel: '♛' },
  kincs: { nev: 'Kincs', jel: '◆' },
  zsakmany: { nev: 'Zsákmány', jel: '◆' },
  kassza: { nev: 'Kassza', jel: '¤' },
  atadas: { nev: 'Átadás', jel: '⇄' },
  penz: { nev: 'Pénz', jel: '¤' }
};

// ---------- A kassza ----------

export function kasszaNorm(k) {
  const o = obj(k);
  return { egyenleg: egesz(o.egyenleg), naplo: lista(o.naplo).filter((x) => x && x.id) };
}
export const kasszaOf = (allapot) => kasszaNorm(obj(obj(allapot).kampany).kassza);

// A napló a legújabb elöl; a visszavontak a végére kerülhetnek (mutatVisszavont: false esetén kimaradnak).
export function naploSorok(kassza, { mutatVisszavont = true } = {}) {
  return kasszaNorm(kassza).naplo.filter((x) => mutatVisszavont || !x.visszavonva).slice().reverse();
}

// Egy jutalom elem érvényes (nem visszavont) kiosztásai.
export function jutalomKiosztasai(kassza, jutalomId) {
  return kasszaNorm(kassza).naplo.filter((x) => x.jutalom_id === jutalomId && !x.visszavonva);
}

// A kiosztás pénzmozgásának összege (a karakterek és a kassza együtt).
export const kiosztasPenz = (x) => lista(obj(x).karakterek).reduce((n, t) => n + egesz(t.penz), 0) + egesz(obj(x).kassza);

// Egysoros leírás a naplóhoz.
export function kiosztasSzoveg(x) {
  const k = obj(x);
  const reszek = lista(k.karakterek).map((t) => {
    const r = [];
    if (egesz(t.penz)) r.push((egesz(t.penz) > 0 ? '+' : '') + penzSzoveg(t.penz));
    if (t.targy) r.push(szoveg(t.targy.nev) || 'tárgy');
    if (t.jutalom && !t.targy) r.push(szoveg(t.jutalom.nev) || 'jutalom');
    return (szoveg(t.nev) || 'karakter') + (r.length ? ': ' + r.join(', ') : '');
  });
  if (egesz(k.kassza)) reszek.push('kassza: ' + (egesz(k.kassza) > 0 ? '+' : '') + penzSzoveg(k.kassza) + (van(k.kassza_megjegyzes) && !van(k.ok) ? ' (' + k.kassza_megjegyzes + ')' : ''));
  if (k.tars) reszek.push('társ: ' + (szoveg(k.tars.nev) || 'NJK') + (k.tars.kotodes === 'csapat' ? ' (a csapaté)' : ''));
  return reszek.join('; ');
}

// ---------- Elosztás ----------

// Egy összeg (réz) elosztása a karakterek közt egyenlően. egeszEzust: csak egész ezüstöt kapnak, a maradék a kasszába.
// Visszaad: { reszek: { [id]: réz }, fejenkent, maradek }.
export function egyenloElosztas(osszeg, karakterIdk, { egeszEzust = true } = {}) {
  const n = lista(karakterIdk).length;
  const o = Math.max(0, egesz(osszeg));
  if (!n) return { reszek: {}, fejenkent: 0, maradek: o };
  const egyseg = egeszEzust ? 10 : 1;
  const fejenkent = Math.floor(o / n / egyseg) * egyseg;
  const reszek = {};
  karakterIdk.forEach((id) => { reszek[id] = fejenkent; });
  return { reszek, fejenkent, maradek: o - fejenkent * n };
}

// Kézi elosztás: a beírt részek összege nem lehet több az összegnél; a maradék a kasszába. Visszaad: { reszek, maradek, tul }.
export function keziElosztas(osszeg, reszek) {
  const o = Math.max(0, egesz(osszeg));
  const r = {};
  Object.keys(obj(reszek)).forEach((id) => { const x = Math.max(0, egesz(reszek[id])); if (x) r[id] = x; });
  const ossz = Object.values(r).reduce((a, b) => a + b, 0);
  return { reszek: r, maradek: o - ossz, tul: ossz > o };
}

// A zsákmány (vagy a kassza szétosztása) kérése. forras: 'kivulrol' (új pénz: talált, kapott) vagy 'kassza' (a kasszából
// osztják szét: a kassza a kiosztott résszel csökken). maradekKasszaba: a maradék a kasszába kerül (kívülről jövő pénznél).
export function zsakmanyKeres({ kampanyId, id, osszeg, reszek, maradek, forras = 'kivulrol', maradekKasszaba = true, ok = '', fajta } = {}) {
  const karakterek = Object.keys(obj(reszek)).filter((k) => egesz(reszek[k])).map((k) => ({ karakter_id: k, penz: egesz(reszek[k]) }));
  const kiosztott = karakterek.reduce((n, t) => n + t.penz, 0);
  let kassza = 0;
  if (forras === 'kassza') kassza = -kiosztott;
  else if (maradekKasszaba) kassza = Math.max(0, egesz(maradek));
  return {
    kampany_id: kampanyId, id: id || ujKiosztasId(), fajta: fajta || (forras === 'kassza' ? 'atadas' : 'zsakmany'),
    ok: szoveg(ok).trim() || (forras === 'kassza' ? 'A kassza szétosztása' : 'Zsákmány: ' + penzSzoveg(osszeg)),
    karakterek, kassza, kassza_megjegyzes: forras === 'kassza' ? 'szétosztva' : kassza ? 'a maradék' : ''
  };
}

// A kassza egyszerű mozgása (bevétel vagy kiadás). rez előjeles.
export function kasszaKeres({ kampanyId, id, rez, megjegyzes = '' }) {
  return { kampany_id: kampanyId, id: id || ujKiosztasId(), fajta: 'kassza', ok: szoveg(megjegyzes).trim(), kassza: egesz(rez), kassza_megjegyzes: szoveg(megjegyzes).trim() };
}

// Pénz egy karaktertől a kasszába (rez > 0) vagy a kasszából egy karakternek (rez < 0).
export function atadasKeres({ kampanyId, id, karakterId, rez, megjegyzes = '' }) {
  const r = egesz(rez);
  return { kampany_id: kampanyId, id: id || ujKiosztasId(), fajta: 'atadas', ok: szoveg(megjegyzes).trim() || (r > 0 ? 'Befizetés a kasszába' : 'Kivét a kasszából'),
    karakterek: [{ karakter_id: karakterId, penz: -r }], kassza: r };
}

// ---------- A jutalom elem kiosztása ----------

// Egy jutalom elem (5.6) kioszthatósága: { fajta, egyCimzett, kellCimzett, hiba? }.
export function kiosztasMod(a) {
  const f = JU.fajtaOf(a);
  if (!f) return { fajta: '', hiba: 'A jutalomnak nincs fajtája.' };
  if (f === 'targy') return { fajta: f, egyCimzett: true, kellCimzett: true };
  if (f === 'tars') return { fajta: f, egyCimzett: true, kellCimzett: false, csapatLehet: true, hiba: van(obj(a).njk_id) ? '' : 'A társhoz nincs NJK kiválasztva (a jutalom szerkesztőjében).' };
  if (f === 'kincs') return { fajta: f, egyCimzett: false, kellCimzett: false, hiba: obj(a).ertek_ezust === undefined || obj(a).ertek_ezust === '' || obj(a).ertek_ezust === null ? 'A kincsnek nincs értéke (a szerkesztőben dobható).' : '' };
  return { fajta: f, egyCimzett: false, kellCimzett: true };
}

// A jutalom elem javasolt címzettjei (a „kinek” mezőből): karakterazonosítók, a csapat jelölése külön.
export function javasoltCimzettek(a, karakterIdk) {
  const k = lista(obj(a).kinek).map(String);
  return { karakterek: k.filter((x) => lista(karakterIdk).includes(x)), csapat: k.includes('csapat') };
}

const tisztit = (o) => { const x = {}; Object.keys(o).forEach((k) => { const v = o[k]; if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) x[k] = v; }); return x; };

// A karakterre kerülő bejegyzés a jutalom adatából (a fajta szerint a lényeges mezők).
export function bejegyzesJutalombol(a, { nev = '', nevek = {}, targyId = '' } = {}) {
  a = obj(a);
  const f = JU.fajtaOf(a);
  const kozos = { nev: szoveg(nev), leiras: szoveg(a.leiras).slice(0, 2000), megnyitas: szoveg(a.megnyitas), adomanyozo: szoveg(a.adomanyozo),
    feltetelek: szoveg(a.feltetelek), visszavonhato: !!a.visszavonhato || undefined };
  if (f === 'cim') {
    return tisztit({ ...kozos, fajta: 'cim', cim_fajta: szoveg(a.cim_fajta), hatas_mod: szoveg(a.hatas_mod), bonusz: a.bonusz === '' || a.bonusz === undefined ? '' : egesz(a.bonusz),
      mire: szoveg(a.mire), hatas: szoveg(a.hatas), alkalmankent: !!a.alkalmankent || undefined, jogok: szoveg(a.jogok), orokolt: !!a.orokolt || undefined });
  }
  if (f === 'tagsag') {
    const rangok = JU.rangokNorm(a.rangok);
    const rangSzam = Math.max(1, egesz(a.rang) || 1);
    const rang = rangok[rangSzam - 1] || null;
    return tisztit({ ...kozos, fajta: 'tagsag', szervezet: szoveg(nevek.csoport || a.szervezet), szervezet_tipus: szoveg(a.szervezet_tipus), csoport_id: szoveg(a.csoport_id),
      rang: rangSzam, rang_nev: rang ? rang.nev : '', rang_elonyok: rang ? rang.elonyok : '', rang_kotelessegek: rang ? rang.kotelessegek : '',
      rangok: rangok.map((r) => ({ nev: r.nev, elonyok: r.elonyok, kotelessegek: r.kotelessegek })), felvetel: szoveg(a.felvetel) });
  }
  if (f === 'tars') {
    return tisztit({ ...kozos, fajta: 'tars', nev: szoveg(nevek.njk || nev), njk_id: szoveg(a.njk_id), feladatok: szoveg(a.feladatok), fejlodes: szoveg(a.fejlodes) });
  }
  if (f === 'targy') {
    const e = obj(a.ereklye);
    const ereklye = JU.EREKLYE_FAJTAK[e.fajta] && e.fajta !== 'nincs' && a.tartos !== 'ideiglenes';
    return tisztit({ ...kozos, fajta: ereklye ? 'ereklye' : 'targy', targy_id: targyId, targy_fajta: szoveg(a.targy_fajta), tartos: a.tartos === 'ideiglenes' ? 'ideiglenes' : 'allando',
      alap_id: szoveg(a.alap_id), alap_nev: szoveg(a.alap_nev), kidolgozottsag: szoveg(a.kidolgozottsag), ritkasag: JU.ervenyesRitkasag(a),
      elonyok: JU.elonyokNorm(a.elonyok).map((x) => tisztit({ tipus: x.tipus, ertek: x.ertek, mire: x.mire, ideiglenes: x.ideiglenes || undefined, jegyzet: x.jegyzet })),
      korlatozasok: JU.korlatozasokNorm(a.korlatozasok).map((x) => tisztit({ tipus: x.tipus, szoveg: x.szoveg, kuszob: x.kuszob })),
      atok: JU.atokNorm(a.atok).van ? JU.atokNorm(a.atok) : undefined,
      toltes: van(JU.toltesNorm(a.toltes).mp) ? JU.toltesNorm(a.toltes) : undefined,
      tortenet: szoveg(a.tortenet).slice(0, 2000),
      ereklye: ereklye ? tisztit({ fajta: e.fajta, kepessegek: JU.kepessegekNorm(e.kepessegek).map((k) => tisztit({ nev: k.nev, szint: k.szint, feltetel: k.feltetel, leiras: k.leiras })),
        feltetel: szoveg(e.feltetel), hangolodas: szoveg(e.hangolodas), korlatok: szoveg(e.korlatok) }) : undefined });
  }
  return tisztit({ ...kozos, fajta: 'egyeb' });
}

// A leltárba kerülő tárgy: { id, nev, db }. A fegyver, páncél és pajzs a szabályadat elemének egyedi változata
// (`alap~kiosztás`), így a felszerelés választóiban és a fegyverek közt is megjelenik; a többi saját tárgy.
export function targyLeltarba(a, nev, kiosztasId) {
  a = obj(a);
  const alap = szoveg(a.alap_id);
  const id = /^(fgy|pan)_[a-z0-9_]+$/.test(alap) ? alap + '~' + kiosztasId : 'sajat:' + kiosztasId;
  return { id, nev: szoveg(nev).slice(0, 120) || 'Mágikus tárgy', db: 1 };
}

// A reward.give kérése egy jutalom elemből. a: a megjelenített adat, nev: az elem neve, cimzettek: karakterazonosítók,
// csapat: a társ a csapaté; kincsMod: 'kassza' | 'eloszt' (a kincs értéke a kasszába, vagy elosztva a címzettek közt),
// kerekites: a kincs elosztásánál csak egész ezüst. nevek: { csoport, njk, karakterek: { id: név } }.
// Visszaad: { keres } vagy { hiba }.
export function jutalomKeres(a, { kampanyId, jutalomId, nev = '', cimzettek = [], csapat = false, kincsMod = 'kassza', egeszEzust = true, nevek = {}, id, ok } = {}) {
  const m = kiosztasMod(a);
  if (m.hiba) return { hiba: m.hiba };
  const kid = id || ujKiosztasId();
  const c = lista(cimzettek);
  if (m.kellCimzett && !c.length) return { hiba: 'Válaszd ki, ki kapja.' };
  if (m.egyCimzett && c.length > 1) return { hiba: 'Ezt a jutalmat egy hős kaphatja.' };
  const keres = { kampany_id: kampanyId, id: kid, fajta: m.fajta === 'kincs' ? 'kincs' : 'jutalom', jutalom_id: jutalomId || undefined, jutalom_nev: nev || undefined,
    ok: szoveg(ok).trim() || (JU.FAJTAK[m.fajta].nev + ': ' + (nev || 'jutalom')), karakterek: [] };
  if (m.fajta === 'kincs') {
    const rez = Math.max(0, egesz(a.ertek_ezust)) * 10;
    if (kincsMod === 'eloszt' && c.length) {
      const e = egyenloElosztas(rez, c, { egeszEzust });
      keres.karakterek = c.map((k) => ({ karakter_id: k, penz: e.reszek[k] })).filter((t) => t.penz);
      keres.kassza = e.maradek;
      if (e.maradek) keres.kassza_megjegyzes = 'a maradék';
    } else {
      keres.kassza = rez;
    }
    if (!keres.karakterek.length && !keres.kassza) return { hiba: 'A kincs értéke nulla.' };
    return { keres };
  }
  if (m.fajta === 'tars') {
    const kotodes = csapat || !c.length ? 'csapat' : c[0];
    keres.tars = { njk_id: szoveg(a.njk_id), kotodes };
    if (kotodes !== 'csapat') keres.karakterek = [{ karakter_id: kotodes, jutalom: bejegyzesJutalombol(a, { nev, nevek }) }];
    return { keres };
  }
  if (m.fajta === 'targy') {
    const t = targyLeltarba(a, nev, kid);
    keres.karakterek = [{ karakter_id: c[0], targy: t, jutalom: bejegyzesJutalombol(a, { nev, nevek, targyId: t.id }) }];
    return { keres };
  }
  keres.karakterek = c.map((k) => ({ karakter_id: k, jutalom: bejegyzesJutalombol(a, { nev, nevek }) }));
  return { keres };
}

// Előnézet a párbeszédhez: soronként mit kap ki. nevOf(id) a karakter neve.
export function keresElonezet(keres, nevOf = (x) => x) {
  const k = obj(keres);
  const sorok = lista(k.karakterek).map((t) => {
    const r = [];
    if (egesz(t.penz)) r.push((egesz(t.penz) > 0 ? '+' : '') + penzSzoveg(t.penz));
    if (t.targy) r.push(t.targy.nev);
    if (t.jutalom && !t.targy) r.push((JU.FAJTAK[t.jutalom.fajta] || { nev: 'Jutalom' }).nev + ': ' + (t.jutalom.nev || ''));
    return { kinek: nevOf(t.karakter_id), mit: r.join(', ') };
  });
  if (egesz(k.kassza)) sorok.push({ kinek: 'Csapatkassza', mit: (egesz(k.kassza) > 0 ? '+' : '') + penzSzoveg(k.kassza) });
  if (k.tars && k.tars.kotodes === 'csapat') sorok.push({ kinek: 'A csapat', mit: 'társ' });
  return sorok;
}

// ---------- Optimista nézet ----------

// A kiosztás helyi alkalmazása a DM tárolt kampányállapotára (a válasz előtt): a kassza és a karakterek pénze.
// A háttér válasza (a karakterek új adata) felülírja.
export function allapotraAlkalmaz(allapot, valasz) {
  const st = obj(allapot);
  const v = obj(valasz);
  const kar = new Map(lista(v.karakterek).map((x) => [x.id, x]));
  const kampany = { ...obj(st.kampany), kassza: v.kassza ? kasszaNorm(v.kassza) : kasszaOf(st) };
  const karakterek = lista(st.karakterek).map((c) => {
    const x = kar.get(c.id);
    return x ? { ...c, verzio: x.verzio, adat: x.adat } : c;
  });
  return { ...st, kampany, karakterek };
}
