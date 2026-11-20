// Kampányjátszó 6.7: pihenés (tiszta függvények).
// Könyvi alap:
//   - Szusszanás (breather, Alapkönyv 39. o.): 5 perc egy összecsapás után, 5 + Szívósság + szint Egészség. Egy
//     összecsapás után csak egyszer, és aki a csata végén 0 Egészségen volt, nem kaphatja.
//   - Alvás (39. o.): legalább 6 óra pihentető alvás, 10 + Szívósság + szint Egészség.
//   - Mágiapont (Alapkönyv 68. o., Regaining Magic Points): minden teljes óra pihenés vagy meditáció 1d6 + Akaraterő,
//     8 óra zavartalan pihenés után mind visszajön.
//   - Súlyos sebek (Kampányépítő 113. o., Grave Wounds, a kampánykeret választható szabálya): az alvás gyógyulása csak az
//     első napon jár, utána naponta Szívósságnyi; rossz pihenés vagy ellátás mellett ennek a fele. Rossz körülmények
//     vagy fertőzés napi 1d6, nagyon rossz körülmények napi 2d6 sebzés, és nincs gyógyulás.
// A pihenés a karakter adatába kerül (adat.pihenes_naplo), bejegyzésenként azonosítóval, így a karakterlap ütközéskori
// összefésülése (a függő módosítás újra alkalmazása) nem duplikál, és a csapat egyszerre adott pihenése (character.rest,
// backend/Pihenes.gs) ugyanilyen bejegyzést ír. Terv: claude/kampanyjatszo-terv.md, „6.7”.

export const MAX_NAPLO = 100;
export const MAX_ORA = 24;
export const MAX_NAP = 60;

export const FAJTAK = {
  szusszanas: { nev: 'Szusszanás', rovid: '5 perc egy összecsapás után', oldal: 'Alapkönyv 39. o.' },
  alvas: { nev: 'Alvás', rovid: 'legalább 6 óra, több napra is', oldal: 'Alapkönyv 39. és 68. o.' },
  meditacio: { nev: 'Meditáció', rovid: 'csak Mágiapont, óránként', oldal: 'Alapkönyv 68. o.' }
};

// A Súlyos sebek körülményei (csak bekapcsolt szabálynál).
export const KORULMENYEK = {
  jo: { nev: 'Megfelelő', leiras: 'Az első nap a szokásos gyógyulás, utána naponta Szívósságnyi Egészség.' },
  gyenge: { nev: 'Rossz pihenés vagy ellátás', leiras: 'Az első nap utáni napi Szívósságnyi gyógyulás fele (lefelé kerekítve).' },
  rossz: { nev: 'Rossz körülmények, fertőzés', leiras: 'Nincs gyógyulás, naponta 1d6 sebzés.' },
  nagyon_rossz: { nev: 'Nagyon rossz körülmények', leiras: 'Nincs gyógyulás, naponta 2d6 sebzés.' }
};

const szam = (x, d = 0) => { const n = Number(x); return Number.isFinite(n) ? n : d; };
const egesz = (x, min, max, d) => Math.max(min, Math.min(max, Math.round(szam(x, d))));
const szoveg = (x) => (x === undefined || x === null ? '' : String(x));
const lista = (x) => (Array.isArray(x) ? x : []);
const rand = (n) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
export const ujPihenesId = () => 'pi_' + rand(10);
export const PIHENES_ID_MINTA = /^pi_[a-z0-9]{6,20}$/;
const kockaOsszeg = (k) => lista(k).reduce((s, x) => s + szam(x), 0);
const elojeles = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n);

// A karakter pihenéshez szükséges értékei a számolt lapból (karakterSzamol).
export function ertekek(lap) {
  const t = (lap && lap.tulajdonsagok) || {};
  const eg = (lap && lap.egeszseg) || { ertek: 0, aktualis: 0 };
  const mp = lap && lap.magiapont && szam(lap.magiapont.ertek) > 0 ? lap.magiapont : null;
  return {
    szivossag: szam(t.tul_constitution && t.tul_constitution.ertek),
    akaratero: szam(t.tul_willpower && t.tul_willpower.ertek),
    szint: Math.max(1, szam(lap && lap.szint, 1)),
    eg: { aktualis: szam(eg.aktualis), max: szam(eg.ertek) },
    mp: mp ? { aktualis: szam(mp.aktualis), max: szam(mp.ertek) } : null
  };
}

// A karakter pihenési naplója a legújabb elöl.
export function naplo(adat) {
  return lista(adat && adat.pihenes_naplo).slice().sort((a, b) => szoveg(b.idopont).localeCompare(szoveg(a.idopont)));
}

// Szusszanás: lehet-e. A csata lezárásakor a háttér a karakterbe írja az utolsó csatát (adat.allapot.utolso_csata:
// { id, cim, lezarva, nulla }). Visszaad: { lehet, ok: 'nincs_csata' | 'nulla' | 'mar_volt' | '', csata, szoveg }.
export function szusszanasAllapot(adat) {
  const uc = adat && adat.allapot && adat.allapot.utolso_csata && typeof adat.allapot.utolso_csata === 'object' ? adat.allapot.utolso_csata : null;
  if (!uc || !uc.id) return { lehet: false, ok: 'nincs_csata', csata: null, szoveg: 'Szusszanás csak egy összecsapás után jár, és nincs lezárt csata, amiben részt vett.' };
  if (uc.nulla) return { lehet: false, ok: 'nulla', csata: uc, szoveg: 'A csata végén (' + (uc.cim || 'csata') + ') 0 Egészségen volt, ezért nem szusszanhat (Alapkönyv 39. o.).' };
  const volt = lista(adat.pihenes_naplo).some((x) => x && x.fajta === 'szusszanas' && x.csata_id === uc.id && !x.visszavonva);
  if (volt) return { lehet: false, ok: 'mar_volt', csata: uc, szoveg: 'Ez után a csata után (' + (uc.cim || 'csata') + ') már szusszant; egy összecsapás után csak egyszer lehet.' };
  return { lehet: true, ok: '', csata: uc, szoveg: '' };
}

// Súlyos sebek: jár-e még az első nap szokásos gyógyulása. Az utolsó (nem visszavont) súlyos sebes alvás óta nem
// sérült meg (az Egészsége nem kevesebb, mint az alvás után volt): nem jár; különben (új sebek, vagy még nem aludt) jár.
export function sulyosElsoNap(adat, egAktualis) {
  const utolso = naplo(adat).find((x) => x && x.fajta === 'alvas' && x.sulyos && !x.visszavonva);
  if (!utolso) return true;
  return szam(egAktualis) < szam(utolso.eg_utana);
}

// A pihenés terve egy karakterre, dobás előtt. o: { fajta, orak, napok, zavartalan, korulmeny, sulyos, elsoNap }.
// Visszaad: { eg: { fix, kocka: { db, oldal } | null, elojel (1 vagy −1), keplet }, mp: { teljes, fix, kocka, keplet } | null,
//            figyelmeztetesek: [szöveg] }. A „fix” a dobás nélküli rész, a kocka összege az előjellel hozzáadódik.
export function terv(lap, o = {}) {
  const e = ertekek(lap);
  const fajta = FAJTAK[o.fajta] ? o.fajta : 'alvas';
  const orak = egesz(o.orak, 0, MAX_ORA, 8);
  const napok = egesz(o.napok, 1, MAX_NAP, 1);
  const zavartalan = o.zavartalan !== false;
  const korulmeny = KORULMENYEK[o.korulmeny] ? o.korulmeny : 'jo';
  const sulyos = !!o.sulyos;
  const fig = [];
  let eg = { fix: 0, kocka: null, elojel: 1, keplet: '' };
  let mp = null;
  const alap = (n) => n + ' + Szívósság ' + e.szivossag + ' + szint ' + e.szint;

  if (fajta === 'szusszanas') {
    eg = { fix: 5 + e.szivossag + e.szint, kocka: null, elojel: 1, keplet: alap(5) };
  } else if (fajta === 'alvas') {
    const elegAlvas = orak >= 6;
    if (!elegAlvas) fig.push('6 óránál rövidebb alvás nem ad Egészséget (Alapkönyv 39. o.).');
    if (!sulyos) {
      const egy = 10 + e.szivossag + e.szint;
      eg = { fix: elegAlvas ? egy * napok : 0, kocka: null, elojel: 1,
        keplet: elegAlvas ? (napok > 1 ? napok + ' nap × (' + alap(10) + ')' : alap(10)) : '' };
    } else if (korulmeny === 'rossz' || korulmeny === 'nagyon_rossz') {
      const db = napok * (korulmeny === 'rossz' ? 1 : 2);
      eg = { fix: 0, kocka: { db, oldal: 6 }, elojel: -1, keplet: napok + ' nap × ' + (korulmeny === 'rossz' ? '1d6' : '2d6') + ' sebzés' };
    } else {
      const elso = o.elsoNap !== false;
      const napi = korulmeny === 'gyenge' ? Math.floor(Math.max(0, e.szivossag) / 2) : Math.max(0, e.szivossag);
      const elsoResz = elso && elegAlvas ? 10 + e.szivossag + e.szint : 0;
      const tobbi = (elso ? napok - 1 : napok) * napi;
      const reszek = [];
      if (elso) reszek.push(elegAlvas ? 'első nap ' + alap(10) : 'első nap 0 (rövid alvás)');
      if ((elso ? napok - 1 : napok) > 0) reszek.push((elso ? napok - 1 : napok) + ' nap × ' + napi + (korulmeny === 'gyenge' ? ' (Szívósság fele)' : ' (Szívósság)'));
      eg = { fix: elsoResz + tobbi, kocka: null, elojel: 1, keplet: reszek.join(', ') };
      if (!elso) fig.push('Súlyos sebek: az első nap szokásos gyógyulását már megkapta (azóta nem sérült), ezért csak napi Szívósságnyi jár.');
      if (e.szivossag <= 0 && (elso ? napok - 1 : napok) > 0) fig.push('A Szívóssága ' + e.szivossag + ', ezért az első nap utáni napokon nem gyógyul.');
    }
    if (e.mp) mp = mpTerv(e, napok > 1 ? MAX_ORA : orak, zavartalan, napok > 1);
  } else {
    if (!e.mp) fig.push('Nincs Mágiapontja; a meditáció csak Mágiapontot ad vissza.');
    else mp = mpTerv(e, orak, zavartalan, false);
    if (orak < 1) fig.push('Egy teljes óránál rövidebb pihenés nem ad Mágiapontot.');
  }
  if (e.eg.max <= 0) fig.push('Az Egészség maximuma még nincs megadva.');
  return { fajta, orak, napok, zavartalan, korulmeny, sulyos, eg, mp, figyelmeztetesek: fig, ertekek: e };
}

function mpTerv(e, orak, zavartalan, tobbNap) {
  if (tobbNap || (orak >= 8 && zavartalan)) return { teljes: true, fix: 0, kocka: null, keplet: tobbNap ? 'több nap: mind visszajön' : '8 óra zavartalan: mind visszajön' };
  if (orak < 1) return { teljes: false, fix: 0, kocka: null, keplet: '' };
  return { teljes: false, fix: orak * e.akaratero, kocka: { db: orak, oldal: 6 },
    keplet: orak + ' óra × (1d6 + Akaraterő ' + e.akaratero + ')' + (orak >= 8 ? ', megszakítva' : '') };
}

// A kockák, amelyeket dobni kell: [{ mire: 'eg' | 'mp', db, oldal }].
export function kellDobas(t) {
  const ki = [];
  if (t.eg.kocka) ki.push({ mire: 'eg', ...t.eg.kocka });
  if (t.mp && t.mp.kocka) ki.push({ mire: 'mp', ...t.mp.kocka });
  return ki;
}

// Az eredmény a dobásokkal: { eg: változás (előjeles), mp: változás, eg_utana, mp_utana, reszlet, hianyzik }.
// dobasok: { eg: [kockák], mp: [kockák] }. A változás a maximumig (és 0-ig) vágva, a ténylegesen kapott érték.
export function eredmeny(t, dobasok = {}) {
  const e = t.ertekek;
  const hianyzik = kellDobas(t).filter((d) => lista(dobasok[d.mire]).length !== d.db).map((d) => d.mire);
  const egNyers = t.eg.fix + (t.eg.kocka ? kockaOsszeg(dobasok.eg) : 0);
  const egCel = Math.max(0, Math.min(e.eg.max, e.eg.aktualis + t.eg.elojel * egNyers));
  const egValt = e.eg.max > 0 ? egCel - e.eg.aktualis : 0;
  let mpValt = 0;
  let mpUtana = e.mp ? e.mp.aktualis : null;
  if (e.mp && t.mp) {
    mpUtana = t.mp.teljes ? e.mp.max : Math.min(e.mp.max, e.mp.aktualis + t.mp.fix + (t.mp.kocka ? kockaOsszeg(dobasok.mp) : 0));
    mpValt = mpUtana - e.mp.aktualis;
  }
  const r = [];
  if (t.eg.keplet || egValt) r.push('Egészség ' + elojeles(egValt) + (t.eg.keplet ? ' (' + t.eg.keplet + (t.eg.kocka ? ', dobás ' + kockaOsszeg(dobasok.eg) : '') + ')' : ''));
  if (t.mp && (t.mp.keplet || mpValt)) r.push('Mágiapont ' + elojeles(mpValt) + (t.mp.keplet ? ' (' + t.mp.keplet + (t.mp.kocka ? ', dobás ' + kockaOsszeg(dobasok.mp) : '') + ')' : ''));
  return { eg: egValt, mp: mpValt, eg_utana: e.eg.max > 0 ? egCel : null, mp_utana: mpUtana, reszlet: r.join('; '), hianyzik };
}

// A napló bejegyzése (a karakterlapon helyben, a csapatnál a háttér is ilyet ír).
export function bejegyzes(t, er, { id, ki = '', kampanyId = '', csataId = '', dobasok = {}, idopont, sulyosElso } = {}) {
  const b = {
    id: id || ujPihenesId(), idopont: idopont || new Date().toISOString(), fajta: t.fajta, ki: szoveg(ki), kampany_id: szoveg(kampanyId),
    eg: er.eg, mp: er.mp, eg_utana: er.eg_utana, mp_utana: er.mp_utana, eg_max: t.ertekek.eg.max, mp_max: t.ertekek.mp ? t.ertekek.mp.max : null,
    reszlet: szoveg(er.reszlet).slice(0, 300)
  };
  if (t.fajta !== 'szusszanas') { b.orak = t.orak; b.napok = t.napok; }
  if (t.fajta === 'alvas' && t.sulyos) { b.sulyos = true; b.korulmeny = t.korulmeny; b.sulyos_elso = sulyosElso !== false; }
  if (csataId) b.csata_id = szoveg(csataId);
  const kd = {};
  if (lista(dobasok.eg).length) kd.eg = lista(dobasok.eg).slice(0, 120);
  if (lista(dobasok.mp).length) kd.mp = lista(dobasok.mp).slice(0, 30);
  if (Object.keys(kd).length) b.dobasok = kd;
  return b;
}

// A bejegyzés alkalmazása a karakter adatára (helyben módosítja). A változást az aktuális értékhez adja (a maximumig
// és 0-ig vágva): ha közben máshol sérült, az is megmarad. Ugyanaz az azonosító kétszer nem kerül be. Visszaad: bool.
export function alkalmaz(adat, b) {
  adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
  adat.pihenes_naplo = lista(adat.pihenes_naplo);
  if (adat.pihenes_naplo.some((x) => x && x.id === b.id)) return false;
  const x = { ...b };
  if (b.eg_max > 0) {
    const akt = adat.allapot.egeszseg === null || adat.allapot.egeszseg === undefined ? b.eg_max : szam(adat.allapot.egeszseg);
    const uj = Math.max(0, Math.min(b.eg_max, akt + szam(b.eg)));
    x.eg = uj - akt;
    x.eg_utana = uj;
    adat.allapot.egeszseg = uj;
  }
  if (b.mp_max !== null && b.mp_max !== undefined && b.mp_max > 0) {
    const akt = adat.allapot.magiapont === null || adat.allapot.magiapont === undefined ? b.mp_max : szam(adat.allapot.magiapont);
    const uj = Math.max(0, Math.min(b.mp_max, akt + szam(b.mp)));
    x.mp = uj - akt;
    x.mp_utana = uj;
    adat.allapot.magiapont = uj;
  }
  adat.pihenes_naplo.push(x);
  if (adat.pihenes_naplo.length > MAX_NAPLO) adat.pihenes_naplo.splice(0, adat.pihenes_naplo.length - MAX_NAPLO);
  return true;
}

// Visszavonás: a ténylegesen kapott (vagy elvesztett) érték levonása az aktuálisból, a bejegyzés „visszavonva” jelet kap.
// Visszaad: bool (történt-e változás).
export function visszavon(adat, id, idopont) {
  const b = lista(adat && adat.pihenes_naplo).find((x) => x && x.id === id);
  if (!b || b.visszavonva) return false;
  adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
  if (szam(b.eg) && b.eg_max > 0) {
    const akt = adat.allapot.egeszseg === null || adat.allapot.egeszseg === undefined ? b.eg_max : szam(adat.allapot.egeszseg);
    adat.allapot.egeszseg = Math.max(0, Math.min(b.eg_max, akt - szam(b.eg)));
  }
  if (szam(b.mp) && b.mp_max > 0) {
    const akt = adat.allapot.magiapont === null || adat.allapot.magiapont === undefined ? b.mp_max : szam(adat.allapot.magiapont);
    adat.allapot.magiapont = Math.max(0, Math.min(b.mp_max, akt - szam(b.mp)));
  }
  b.visszavonva = idopont || new Date().toISOString();
  return true;
}

// A csapat pihenésének kérése (character.rest). sorok: [{ karakter_id, bejegyzes }].
export function csoportKeres({ kampanyId, id, fajta, sorok }) {
  return {
    kampany_id: kampanyId, id, fajta,
    tetelek: lista(sorok).map((s) => {
      const b = s.bejegyzes;
      const t = { karakter_id: s.karakter_id, eg: b.eg, eg_max: b.eg_max, mp: b.mp, mp_max: b.mp_max, reszlet: b.reszlet };
      ['orak', 'napok', 'sulyos', 'korulmeny', 'sulyos_elso', 'csata_id', 'dobasok'].forEach((k) => { if (b[k] !== undefined) t[k] = b[k]; });
      return t;
    })
  };
}

// Egy bejegyzés egysoros szövege a listákhoz.
export function bejegyzesSzoveg(b) {
  const f = (FAJTAK[b.fajta] || { nev: 'Pihenés' }).nev;
  const r = [];
  if (szam(b.eg)) r.push('Egészség ' + elojeles(szam(b.eg)));
  if (szam(b.mp)) r.push('Mágiapont ' + elojeles(szam(b.mp)));
  const ido = b.fajta === 'szusszanas' ? '' : b.napok > 1 ? ', ' + b.napok + ' nap' : b.orak ? ', ' + b.orak + ' óra' : '';
  return f + ido + (b.sulyos ? ', súlyos sebek' + (KORULMENYEK[b.korulmeny] && b.korulmeny !== 'jo' ? ' (' + KORULMENYEK[b.korulmeny].nev.toLowerCase() + ')' : '') : '')
    + ': ' + (r.length ? r.join(', ') : 'nem változott semmi') + (b.visszavonva ? ' (visszavonva)' : '');
}

// A kampány karaktereinek pihenései csoportosítva (a csapat egyszerre adott pihenése egy azonosítón):
// [{ id, idopont, fajta, ki, visszavonva, tetelek: [{ karakter_id, nev, eg, mp, bejegyzes }] }], a legújabb elöl.
export function csoportok(karakterek, { kampanyId = '', szuro } = {}) {
  const m = new Map();
  lista(karakterek).forEach((c) => {
    lista(c && c.adat && c.adat.pihenes_naplo).forEach((b) => {
      if (!b || !b.id) return;
      if (kampanyId && b.kampany_id && b.kampany_id !== kampanyId) return;
      if (szuro && !szuro(b)) return;
      if (!m.has(b.id)) m.set(b.id, { id: b.id, idopont: b.idopont, fajta: b.fajta, ki: b.ki || '', visszavonva: true, tetelek: [] });
      const g = m.get(b.id);
      if (!b.visszavonva) g.visszavonva = false;
      g.tetelek.push({ karakter_id: c.id, nev: c.nev || '', eg: szam(b.eg), mp: szam(b.mp), bejegyzes: b });
    });
  });
  return Array.from(m.values()).sort((a, b) => szoveg(b.idopont).localeCompare(szoveg(a.idopont)));
}

// Alkalom eseménynaplója: a pihenések kulcsos eseményként (a csoportonként egy esemény). benne(ido): az alkalom ideje alatt.
export function pihenesEsemenyek(karakterek, kampanyId, benne) {
  return csoportok(karakterek, { kampanyId, szuro: (b) => benne(b.idopont) }).map((g) => ({
    kulcs: 'pihenes:' + g.id, ido: g.idopont, fajta: 'pihenes', szoveg: (FAJTAK[g.fajta] || { nev: 'Pihenés' }).nev,
    adat: { tetelek: g.tetelek.map((t) => ({ nev: t.nev, eg: t.eg, mp: t.mp })), ...(g.visszavonva ? { visszavont: true } : {}) }
  })).reverse();
}
