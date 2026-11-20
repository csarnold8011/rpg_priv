// A 6.5 tiszta függvényeinek tesztje: a kiosztás kérése (web/js/kampany/kioszt.js), a karakter jutalmai
// (web/js/karakter/jutalmak.js), a mágikus tárgy a karakter számolásában, és a kiosztások az alkalom eseménynaplójában.
// Futtatás: node tools/teszt/kioszt.mjs
import * as KI from '../../web/js/kampany/kioszt.js';
import * as KJ from '../../web/js/karakter/jutalmak.js';
import * as A from '../../web/js/kampany/alkalom.js';
import { uresKarakter, uresSzint } from '../../web/js/karakter/adat.js';
import { karakterSzamol } from '../../web/js/karakter/szamol.js';
import { felszerelesFrissit } from '../../web/js/karakter/varazslo.js';
import { LAPOK } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---------- Elosztás ----------
let e = KI.egyenloElosztas(250, ['a', 'b', 'c']);
ellenoriz(e.fejenkent === 80 && e.maradek === 10 && e.reszek.b === 80, 'egyenlő elosztás egész ezüstre: 3 × 8 ezüst, 1 ezüst marad', e);
e = KI.egyenloElosztas(250, ['a', 'b', 'c'], { egeszEzust: false });
ellenoriz(e.fejenkent === 83 && e.maradek === 1, 'rézre pontosan: 3 × 83 réz, 1 réz marad', e);
ellenoriz(KI.egyenloElosztas(50, []).maradek === 50, 'címzett nélkül minden marad');
let k = KI.keziElosztas(100, { a: '60', b: '30', c: '' });
ellenoriz(k.maradek === 10 && !k.tul && !('c' in k.reszek), 'kézi elosztás: a maradék a kasszába', k);
ellenoriz(KI.keziElosztas(100, { a: 80, b: 30 }).tul, 'kézi elosztás: túllépés jelzése');
let r = KI.zsakmanyKeres({ kampanyId: 'c1', id: 'ko_teszt001', osszeg: 250, reszek: { a: 80, b: 80 }, maradek: 90 });
ellenoriz(r.kassza === 90 && r.karakterek.length === 2 && r.fajta === 'zsakmany' && /Zsákmány/.test(r.ok), 'zsákmány kérése: a maradék a kasszába', r);
r = KI.zsakmanyKeres({ kampanyId: 'c1', osszeg: 200, reszek: { a: 100, b: 100 }, forras: 'kassza' });
ellenoriz(r.kassza === -200 && r.fajta === 'atadas' && /^ko_/.test(r.id), 'a kassza szétosztása: a kassza a kiosztottal csökken', r);
r = KI.atadasKeres({ kampanyId: 'c1', karakterId: 'a', rez: 50 });
ellenoriz(r.kassza === 50 && r.karakterek[0].penz === -50 && /Befizetés/.test(r.ok), 'befizetés a kasszába: a karaktertől levonva');
ellenoriz(KI.kasszaKeres({ kampanyId: 'c1', rez: -30, megjegyzes: 'Szállás' }).kassza === -30, 'kassza kiadás');

// ---------- Jutalom elemből ----------
const cim = { fajta: 'cim', cim_fajta: 'hirnev', hatas_mod: 'bonusz', bonusz: 1, mire: 'Megfélemlítés goblinok ellen', kinek: ['a', 'csapat'], leiras: 'A goblinok rettegnek tőle.' };
ellenoriz(JSON.stringify(KI.javasoltCimzettek(cim, ['a', 'b'])) === JSON.stringify({ karakterek: ['a'], csapat: true }), 'a javasolt címzettek a „kinek” mezőből');
let v = KI.jutalomKeres(cim, { kampanyId: 'c1', jutalomId: 'el1', nev: 'Goblinölő', cimzettek: ['a', 'b'] });
ellenoriz(!v.hiba && v.keres.karakterek.length === 2 && v.keres.karakterek[1].jutalom.fajta === 'cim' && v.keres.karakterek[0].jutalom.bonusz === 1
  && v.keres.jutalom_id === 'el1' && v.keres.ok === 'Cím: Goblinölő', 'cím: mindkét hős bejegyzést kap', v);
ellenoriz(KI.jutalomKeres(cim, { kampanyId: 'c1', cimzettek: [] }).hiba, 'cím címzett nélkül hibát ad');
ellenoriz(KJ.cimBonuszSzoveg(v.keres.karakterek[0].jutalom) === '+1 Megfélemlítés goblinok ellen', 'a cím bónuszának szövege');
const tagsag = { fajta: 'tagsag', szervezet: 'Ezüstpajzs rend', rang: 2, rangok: [{ nev: 'Újonc' }, { nev: 'Megbecsült tag', elonyok: '+2 a tagokkal' }] };
v = KI.jutalomKeres(tagsag, { kampanyId: 'c1', nev: 'Felvétel a rendbe', cimzettek: ['a'], nevek: { csoport: 'Az Ezüstpajzs' } });
const tb = v.keres.karakterek[0].jutalom;
ellenoriz(tb.szervezet === 'Az Ezüstpajzs' && tb.rang === 2 && tb.rang_nev === 'Megbecsült tag' && tb.rang_elonyok === '+2 a tagokkal' && tb.rangok.length === 2, 'tagság: a szervezet és a rang előnyei', tb);
const kard = { fajta: 'targy', targy_fajta: 'fegyver', tartos: 'allando', alap_id: 'fgy_mace', elonyok: [{ tipus: 'tamadas', ertek: 1 }, { tipus: 'sebzes', ertek: 2 }],
  atok: { van: true, jelenet: 'szerepjatek', buntetes: -1 }, tortenet: 'Egy törp hős fegyvere.' };
ellenoriz(KI.jutalomKeres(kard, { kampanyId: 'c1', cimzettek: ['a', 'b'] }).hiba === 'Ezt a jutalmat egy hős kaphatja.', 'tárgyat csak egy hős kaphat');
v = KI.jutalomKeres(kard, { kampanyId: 'c1', id: 'ko_kard0001', nev: 'Törpverő', cimzettek: ['a'] });
const kt = v.keres.karakterek[0];
ellenoriz(kt.targy.id === 'fgy_mace~ko_kard0001' && kt.targy.nev === 'Törpverő' && kt.jutalom.targy_id === kt.targy.id && kt.jutalom.fajta === 'targy'
  && kt.jutalom.atok.buntetes === -1 && kt.jutalom.elonyok.length === 2, 'mágikus fegyver: egyedi azonosító a szabályadat elemére, bejegyzéssel', kt);
const gyuru = { fajta: 'targy', targy_fajta: 'egyeb', tartos: 'allando', ereklye: { fajta: 'lepcsos', kepessegek: [{ nev: 'Fény' }, { nev: 'Láng' }, { nev: 'Szárny' }], feltetel: 'A tűz papja viseli' } };
v = KI.jutalomKeres(gyuru, { kampanyId: 'c1', id: 'ko_gyuru001', nev: 'A Láng Gyűrűje', cimzettek: ['b'] });
const gy = v.keres.karakterek[0];
ellenoriz(gy.targy.id === 'sajat:ko_gyuru001' && gy.jutalom.fajta === 'ereklye' && gy.jutalom.ereklye.kepessegek.length === 3, 'ereklye: saját tárgy, ereklye bejegyzés', gy);
ellenoriz(KI.jutalomKeres({ fajta: 'tars' }, { kampanyId: 'c1' }).hiba, 'társ NJK nélkül hibát ad');
v = KI.jutalomKeres({ fajta: 'tars', njk_id: 'n1', feladatok: 'őrzi a tábort' }, { kampanyId: 'c1', nev: 'Bundás', csapat: true });
ellenoriz(v.keres.tars.kotodes === 'csapat' && !v.keres.karakterek.length, 'társ a csapatnak: nincs karakterbejegyzés', v);
v = KI.jutalomKeres({ fajta: 'tars', njk_id: 'n1' }, { kampanyId: 'c1', nev: 'Bundás', cimzettek: ['a'], nevek: { njk: 'Bundás, a kutya' } });
ellenoriz(v.keres.tars.kotodes === 'a' && v.keres.karakterek[0].jutalom.nev === 'Bundás, a kutya', 'társ egy hősnek', v);
ellenoriz(KI.jutalomKeres({ fajta: 'kincs' }, { kampanyId: 'c1' }).hiba, 'kincs érték nélkül hibát ad');
v = KI.jutalomKeres({ fajta: 'kincs', ertek_ezust: 25 }, { kampanyId: 'c1', nev: 'A sárkány kincse' });
ellenoriz(v.keres.kassza === 250 && !v.keres.karakterek.length && v.keres.fajta === 'kincs', 'kincs a kasszába', v);
v = KI.jutalomKeres({ fajta: 'kincs', ertek_ezust: 25 }, { kampanyId: 'c1', cimzettek: ['a', 'b', 'c'], kincsMod: 'eloszt' });
ellenoriz(v.keres.karakterek.every((t) => t.penz === 80) && v.keres.kassza === 10, 'kincs elosztva, a maradék a kasszába', v);
const el = KI.keresElonezet(v.keres, (id) => id.toUpperCase());
ellenoriz(el.length === 4 && el[0].kinek === 'A' && el[0].mit === '+8 ezüst' && el[3].kinek === 'Csapatkassza', 'előnézet soronként', el);

// ---------- A kassza nézete ----------
const kassza = { egyenleg: 60, naplo: [
  { id: 'ko_1', idopont: '2026-11-20T18:00:00Z', fajta: 'zsakmany', ok: 'Láda', kassza: 10, karakterek: [{ id: 'a', nev: 'Dorn', penz: 80 }] },
  { id: 'ko_2', idopont: '2026-11-20T18:05:00Z', fajta: 'jutalom', ok: 'Cím: Goblinölő', jutalom_id: 'el1', karakterek: [{ id: 'a', nev: 'Dorn', jutalom: { fajta: 'cim', nev: 'Goblinölő' } }] },
  { id: 'ko_3', idopont: '2026-11-20T18:06:00Z', fajta: 'jutalom', ok: 'Cím: Goblinölő', jutalom_id: 'el1', visszavonva: '2026-11-20T18:07:00Z', karakterek: [{ id: 'b', nev: 'Rika', jutalom: { fajta: 'cim', nev: 'Goblinölő' } }] },
  { id: 'ko_4', idopont: '2026-11-20T18:10:00Z', fajta: 'kassza', ok: 'Szállás', kassza: -30, karakterek: [] }
] };
ellenoriz(KI.naploSorok(kassza)[0].id === 'ko_4' && KI.naploSorok(kassza, { mutatVisszavont: false }).length === 3, 'a napló a legújabb elöl, a visszavontak szűrhetők');
ellenoriz(KI.jutalomKiosztasai(kassza, 'el1').length === 1, 'a jutalom elem érvényes kiosztásai (a visszavont nélkül)');
ellenoriz(KI.kiosztasSzoveg(kassza.naplo[0]) === 'Dorn: +8 ezüst; kassza: +1 ezüst', 'a kiosztás egysoros leírása', KI.kiosztasSzoveg(kassza.naplo[0]));
const st = KI.allapotraAlkalmaz({ kampany: { id: 'c1' }, karakterek: [{ id: 'a', verzio: 3, adat: {} }, { id: 'b', verzio: 1 }] },
  { kassza: { egyenleg: 5, naplo: [] }, karakterek: [{ id: 'a', verzio: 4, adat: { x: 1 } }] });
ellenoriz(st.kampany.kassza.egyenleg === 5 && st.karakterek[0].verzio === 4 && st.karakterek[0].adat.x === 1 && st.karakterek[1].verzio === 1, 'a válasz beírása a tárolt kampányállapotba');

// ---------- A karakteren: a mágikus tárgy a számolásban ----------
function harcos() {
  const c = uresKarakter({ nev: 'Dorn', forrasok: ['Alapkönyv'] });
  c.faj = 'faj_human'; c.osztaly = 'osz_warrior';
  c.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 2, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
  c.hatter = { rendszer: 'alap', id: 'hat_soldier', mod: 'dobas', osztaly_dobas: 2, hatter_dobas: 5, fokusz: 'fok_communication_gambling' };
  c.szintek = [{ ...uresSzint(1), egeszseg_dobas: 4, kapott: [{ tipus: 'talentum', id: 'tal_armor_training' }] }];
  c.osztaly_dontes = { fegyvercsoportok: ['fcs_bludgeons'] };
  c.felszereles = { targyak: [], kezdo_fegyverek: ['fgy_two_handed_axe'], vasarolt: [], penz_dobas: 12 };
  c.keszites.allapot = 'kesz';
  felszerelesFrissit(c, LAPOK);
  return c;
}
// a háttér reward.give műveletének megfelelő változás (Jutalmak.gs karakterreKioszt_)
function kioszt(c, keresTetel, kid) {
  const f = c.felszereles;
  f.jatek = f.jatek || [];
  if (keresTetel.penz) f.jatek.push({ tipus: 'penz', penz: keresTetel.penz, kiosztas_id: kid, idopont: '2026-11-20T18:00:00Z' });
  if (keresTetel.targy) f.jatek.push({ tipus: 'targy', targy: keresTetel.targy.id, nev: keresTetel.targy.nev, db: 1, kiosztas_id: kid, idopont: '2026-11-20T18:00:00Z' });
  if (keresTetel.jutalom) (c.jutalmak = c.jutalmak || []).push({ ...keresTetel.jutalom, id: kid, kiosztas_id: kid });
  felszerelesFrissit(c, LAPOK);
}
const d = harcos();
const elotte = karakterSzamol(d, LAPOK);
const keres = KI.jutalomKeres(kard, { kampanyId: 'c1', id: 'ko_kard0001', nev: 'Törpverő', cimzettek: ['a'] }).keres;
kioszt(d, { ...keres.karakterek[0], penz: 50 }, 'ko_kard0001');
ellenoriz(d.felszereles.penz_rez === elotte.penz_rez + 50, 'a kiosztott pénz a karakter egyenlegében');
d.felszereles.targyak.find((t) => t.id === 'fgy_mace~ko_kard0001').felszerelve = true;
let lap = karakterSzamol(d, LAPOK);
const fegyver = lap.fegyverek.find((w) => w.id === 'fgy_mace~ko_kard0001');
const sima = (() => { const x = harcos(); x.felszereles.jatek = [{ tipus: 'targy', targy: 'fgy_mace', db: 1, idopont: 'x' }]; felszerelesFrissit(x, LAPOK); return karakterSzamol(x, LAPOK).fegyverek.find((w) => w.id === 'fgy_mace'); })();
ellenoriz(fegyver && fegyver.nev_hu === 'Törpverő' && fegyver.magikus && fegyver.tamadas === sima.tamadas + 1, 'a mágikus fegyver a fegyverek közt, a nevével és +1 támadással', { fegyver, sima });
ellenoriz(fegyver.sebzes === '2d6+5' && sima.sebzes === '2d6+3', 'a sebzés-előny a sebzésben', { a: fegyver.sebzes, b: sima.sebzes });
ellenoriz(KJ.targyJutalma(d, 'fgy_mace~ko_kard0001').nev === 'Törpverő' && KJ.alapId('fgy_mace~ko_kard0001') === 'fgy_mace' && KJ.egyediE('fgy_mace~k'), 'a tárgy bejegyzése és a szabályadat azonosítója');
// páncél
const pancel = KI.jutalomKeres({ fajta: 'targy', targy_fajta: 'pancel', tartos: 'allando', alap_id: 'pan_heavy_leather', elonyok: [{ tipus: 'pancel', ertek: 2 }, { tipus: 'vedekezes', ertek: 1 }] },
  { kampanyId: 'c1', id: 'ko_pancel01', nev: 'Árnyékbőr', cimzettek: ['a'] }).keres;
const p = harcos();
const p0 = karakterSzamol(p, LAPOK);
kioszt(p, pancel.karakterek[0], 'ko_pancel01');
p.felszereles.targyak.forEach((t) => { t.felszerelve = t.id === 'pan_heavy_leather~ko_pancel01'; });
const p1 = karakterSzamol(p, LAPOK);
const p0pancel = (() => { const x = harcos(); x.felszereles.targyak.forEach((t) => { t.felszerelve = t.id === 'pan_heavy_leather'; }); return karakterSzamol(x, LAPOK); })();
ellenoriz(p1.pancel && p1.pancel.nev_hu === 'Árnyékbőr' && p1.pancelertek.ertek === p0pancel.pancelertek.ertek + 2 && p1.vedekezes.ertek === p0pancel.vedekezes.ertek + 1,
  'a viselt mágikus páncél: a neve, +2 Páncélérték, +1 Védekezés', { p1: [p1.pancelertek.ertek, p1.vedekezes.ertek], p0: [p0pancel.pancelertek.ertek, p0pancel.vedekezes.ertek], p0x: p0.pancelertek.ertek });
ellenoriz(KJ.magikusBonuszok({ tartos: 'ideiglenes', elonyok: [{ tipus: 'tamadas', ertek: 3 }] }).tamadas === 0, 'az ideiglenes tárgy előnye nem számít bele');
// ereklye
const gyB = KI.jutalomKeres(gyuru, { kampanyId: 'c1', id: 'ko_gyuru001', nev: 'A Láng Gyűrűje', cimzettek: ['a'] }).keres.karakterek[0].jutalom;
ellenoriz(KJ.ereklyeKepessegek(gyB, 1).filter((x) => x.nyitva).length === 1 && KJ.ereklyeKepessegek(gyB, 4).filter((x) => x.nyitva).length === 2, 'lépcsős ereklye: 1. szinten egy, 4. szinten két képesség');
ellenoriz(KJ.ujKepessegek(gyB, 3, 4).length === 1 && KJ.ujKepessegek(gyB, 4, 5).length === 0, 'szintlépéskor jelzi, ha új képesség nyílik');
const zart = { fajta: 'ereklye', id: 'z1', ereklye: { fajta: 'zart', kepessegek: [{ nev: 'A' }, { nev: 'B' }, { nev: 'C' }] } };
const zk = { jutalmak: [zart] };
ellenoriz(KJ.ereklyeKepessegek(zart, 10).every((x) => !x.nyitva), 'zárt ereklye: a feltételig zárva');
KJ.jutalomModosit(zk, 'z1', { feltetel_teljesult: true });
ellenoriz(KJ.ereklyeKepessegek(zk.jutalmak[0], 1).every((x) => x.nyitva), 'a feltétel teljesülése után mind nyitva');
ellenoriz(KJ.kovetkezoSzintenNyilik({ jutalmak: [gyB] }, 3) === 1, 'a következő szinten nyíló ereklyeképességek száma');
ellenoriz(KJ.jutalmak({ jutalmak: [{ fajta: 'targy', idopont: '2' }, { fajta: 'cim', idopont: '1' }] })[0].fajta === 'cim', 'a jutalmak sorrendje: a címek elöl');

// ---------- Az alkalom eseménynaplója ----------
const futo = { id: 'a_teszt0001', kezdet: '2026-11-20T17:00:00Z', allapot: 'fut', adat: {} };
const allapot = {
  kampany: { id: 'c1', kassza },
  karakterek: [{ id: 'a', nev: 'Dorn', adat: { felszereles: { jatek: [{ tipus: 'penz', penz: 80, kiosztas_id: 'ko_1', idopont: '2026-11-20T18:00:00Z' }, { tipus: 'penz', penz: -5, megjegyzes: 'sör', idopont: '2026-11-20T18:20:00Z' }] } } }]
};
const ev = A.esemenyekAllapotbol(allapot, futo);
const penzEv = ev.filter((x) => x.fajta === 'penz');
ellenoriz(penzEv.length === 2 && penzEv[0].kulcs === 'penz:a:2026-11-20T18:00:00Z' && penzEv[0].adat.kiosztas_id === 'ko_1', 'a kiosztott pénz egyszer jelenik meg, a karakter pénztételének kulcsával', penzEv);
const jutEv = ev.filter((x) => x.fajta === 'jutalom');
ellenoriz(jutEv.length === 4 && jutEv[0].adat.kassza === 10 && jutEv[2].adat.visszavont && jutEv[3].adat.kassza === -30, 'jutalom események: a maradék a kasszába, a cím, a visszavont, a kassza kiadása', jutEv.map((x) => x.kulcs));
ellenoriz(A.esemenySzoveg(jutEv[1]) === 'Jutalom: Cím: Goblinölő (Dorn: Goblinölő)' && /visszavonva$/.test(A.esemenySzoveg(jutEv[2])), 'a jutalom esemény szövege', A.esemenySzoveg(jutEv[1]));
const b = A.esemenyekBeolvasztasa({}, ev);
const ossz = A.penzOsszesites(b.adat.naplo);
ellenoriz(ossz.find((x) => x.nev === 'Dorn').penz === 75 && ossz.find((x) => x.nev === 'Csapatkassza').penz === -20, 'a pénzösszesítés a kasszával együtt', ossz);
const vz = A.vazlat({ ...futo, adat: b.adat });
ellenoriz(/Jutalmak: Dorn: Goblinölő\./.test(vz.jatekosoknak) && /Csapatkassza/.test(vz.kincsek), 'a vázlat: a jutalmak a játékosoknak szóló részben is', vz);
// visszavonás után a pénz esemény jelet kap
const allapot2 = JSON.parse(JSON.stringify(allapot));
allapot2.kampany.kassza.naplo[0].visszavonva = '2026-11-20T18:30:00Z';
allapot2.karakterek[0].adat.felszereles.jatek.shift();
const b2 = A.esemenyekBeolvasztasa(b.adat, A.esemenyekAllapotbol(allapot2, futo));
ellenoriz(b2.adat.naplo.find((x) => x.kulcs === 'penz:a:2026-11-20T18:00:00Z').adat.visszavont && A.penzOsszesites(b2.adat.naplo).find((x) => x.nev === 'Dorn').penz === -5,
  'visszavonás után a pénz esemény „visszavonva”, az összesítés nem számolja');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
