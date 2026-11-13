// A karakter adatszerkezete (1. változat) és az átállás a korábbi, ideiglenes szerkezetről.
// A karakter a döntéseket tárolja a forrásukkal; a végértékeket a szamol.js állítja elő.
// Részletes leírás: a Claude projekt claude/karakterkeszito-terv.md dokumentuma.
import { SEMA_VERZIO, TULAJDONSAGOK } from './tablak.js';

// Egy szint döntései. A kapott elemek: { tipus, id }, ahol a tipus:
// talentum, arkanum, specializacio, varazslat, fokusz, fegyvercsoport.
// Egy talentum (arkánum, specializáció) fokozata a kapott bejegyzések száma (1 = Kezdő).
export function uresSzint(szint) {
  return { szint, egeszseg_dobas: null, mp_dobas: null, fejlesztes: null, fokusz: null, kapott: [] };
}

export function uresKarakter(o = {}) {
  return {
    sema: SEMA_VERZIO,
    // Kulcsmezők: a háttér ezekből tölti a Karakterek lap oszlopait (listázás, keresés).
    nev: o.nev || '',
    faj: '',
    osztaly: '',
    szint: 1,
    keszites: {
      allapot: 'piszkozat', // piszkozat | kesz | atvett (a korábbi szerkezetből)
      lepes: 'keret',
      forrasok: o.forrasok || [],
      modszer: null, // sorban | elrendezes | vasarlas
      cel_szint: 1
    },
    alap: { kep: null, koncepcio: '', megjelenes: '', celok: [], kotelekek: [], nyelvek: [] },
    // A tulajdonság-módszer eredménye, faji és egyéb bónusz nélkül.
    tulajdonsag_alap: Object.fromEntries(TULAJDONSAGOK.map((t) => [t, 0])),
    // A módszer nyersanyaga az ellenőrzéshez: a 3d6 összegek a lap sorrendjében, a csere.
    tulajdonsag_keszites: { dobasok: [], csere: null },
    // Faj: fókuszválasztás és előnydobások. Egy előny: { dobas: 2d6 összeg, csere_fokusz?, sajat? }.
    // A `sajat` a táblázat sora helyett álló egyedi előny (Félvér, Vadnép): { tipus, ertek, mertek, nev_hu, leiras }.
    faj_dontes: { fokusz: null, elonyok: [] },
    // Háttér: rendszer (alap | companion), mód (dobas | valasztas), a dobások és a választott fókusz.
    hatter: { rendszer: null, id: null, mod: null, osztaly_dobas: null, hatter_dobas: null, fokusz: null },
    // Osztály: a választott fegyvercsoportok (az osztály saját csoportjain felül).
    osztaly_dontes: { fegyvercsoportok: [] },
    szintek: [uresSzint(1)],
    felszereles: { targyak: [], penz_rez: 0, penz_dobas: null },
    allapot: { egeszseg: null, magiapont: null, xp: 0, feltetelek: [] },
    // Kézi módosítók: { cel, ertek, mod: hozzaad | felulir, megjegyzes, ki }.
    // cel: tul_…, fok_… (fókusz megadása), fcs_… (fegyvercsoport), egeszseg_max, magiapont_max, vedekezes, sebesseg, pancelertek.
    kezi: [],
    // A DM által elfogadott figyelmeztetések kulcsai (kod:targy).
    elfogadott: [],
    // A készítés dobásai: { mire, kockak, kezi, idopont }.
    dobasok: [],
    // Gyorsítótár a listákhoz és a háttérhez; a felület mindig újraszámol.
    szamitott: {}
  };
}

const lemasol = (x) => JSON.parse(JSON.stringify(x));

// Hiányzó mezők pótlása (régebbi vagy kézzel szerkesztett adatnál), a meglévőket nem bántja.
export function normalizal(adat) {
  const alap = uresKarakter();
  const ki = Object.assign(alap, lemasol(adat || {}));
  ['keszites', 'alap', 'tulajdonsag_keszites', 'faj_dontes', 'hatter', 'osztaly_dontes', 'felszereles', 'allapot'].forEach((k) => {
    ki[k] = Object.assign(uresKarakter()[k], (adat && adat[k]) || {});
  });
  ki.tulajdonsag_alap = Object.assign(uresKarakter().tulajdonsag_alap, (adat && adat.tulajdonsag_alap) || {});
  ['kezi', 'elfogadott', 'dobasok'].forEach((k) => { if (!Array.isArray(ki[k])) ki[k] = []; });
  if (!Array.isArray(ki.szintek) || !ki.szintek.length) ki.szintek = [uresSzint(1)];
  ki.szintek = ki.szintek
    .map((s) => Object.assign(uresSzint(Number(s.szint) || 1), s, { kapott: Array.isArray(s.kapott) ? s.kapott : [] }))
    .sort((a, b) => a.szint - b.szint);
  ki.sema = SEMA_VERZIO;
  ki.szint = ki.szintek[ki.szintek.length - 1].szint;
  return ki;
}

// Átállás a korábbi, ideiglenes szerkezetről (a felület váza idején készült karakterek):
//   { nev, faj, osztaly, szint, tulajdonsagok: {tul_…: n}, fokuszok: [fok_…],
//     egeszseg: {aktualis, max}, magiapont: {aktualis, max}, vedekezes, sebesseg, pancelertek }
// Semmi nem vész el: a tulajdonságok az alapba, minden más kézi módosítóként „átvett” megjegyzéssel kerül át.
export function atallit(regi) {
  if (!regi || typeof regi !== 'object') return uresKarakter();
  if (Number(regi.sema) >= 1) return normalizal(regi);

  const uj = uresKarakter({ nev: regi.nev || '' });
  const megj = 'átvett a korábbi karakterlapról';
  uj.faj = regi.faj || '';
  uj.osztaly = regi.osztaly || '';
  const szint = Math.max(1, Math.min(20, parseInt(regi.szint, 10) || 1));
  uj.szintek = [];
  for (let i = 1; i <= szint; i++) uj.szintek.push(uresSzint(i));
  uj.szint = szint;
  uj.keszites.allapot = 'atvett';
  uj.keszites.lepes = null;
  uj.keszites.cel_szint = szint;

  const tul = regi.tulajdonsagok && typeof regi.tulajdonsagok === 'object' ? regi.tulajdonsagok : {};
  TULAJDONSAGOK.forEach((t) => { if (tul[t] !== undefined) uj.tulajdonsag_alap[t] = Number(tul[t]) || 0; });

  const kezi = (cel, ertek, mod) => uj.kezi.push({ cel, ertek, mod, megjegyzes: megj, ki: 'atallas' });
  (Array.isArray(regi.fokuszok) ? regi.fokuszok : []).forEach((f) => kezi(f, 2, 'hozzaad'));
  const eg = regi.egeszseg || {};
  if (eg.max !== undefined && eg.max !== '') kezi('egeszseg_max', Number(eg.max) || 0, 'felulir');
  if (eg.aktualis !== undefined && eg.aktualis !== '') uj.allapot.egeszseg = Number(eg.aktualis) || 0;
  const mp = regi.magiapont || {};
  if (mp.max !== undefined && mp.max !== '') kezi('magiapont_max', Number(mp.max) || 0, 'felulir');
  if (mp.aktualis !== undefined && mp.aktualis !== '') uj.allapot.magiapont = Number(mp.aktualis) || 0;
  ['vedekezes', 'sebesseg', 'pancelertek'].forEach((k) => {
    if (regi[k] !== undefined && regi[k] !== null && regi[k] !== '') kezi(k, Number(regi[k]) || 0, 'felulir');
  });

  // Ismeretlen mezők megőrzése, hogy a DM a nyers szerkesztőben még lássa őket.
  const ismert = ['nev', 'faj', 'osztaly', 'szint', 'tulajdonsagok', 'fokuszok', 'egeszseg', 'magiapont', 'vedekezes', 'sebesseg', 'pancelertek'];
  const egyeb = {};
  Object.keys(regi).forEach((k) => { if (!ismert.includes(k)) egyeb[k] = regi[k]; });
  if (Object.keys(egyeb).length) uj.atvett_egyeb = egyeb;
  return uj;
}

// A kulcsmezők a döntésekből: a szint a legmagasabb kitöltött szint.
export function kulcsmezok(adat) {
  const szintek = (adat && adat.szintek) || [];
  const szint = szintek.length ? Math.max(...szintek.map((s) => Number(s.szint) || 1)) : 1;
  return { nev: adat.nev || '', faj: adat.faj || '', osztaly: adat.osztaly || '', szint };
}
