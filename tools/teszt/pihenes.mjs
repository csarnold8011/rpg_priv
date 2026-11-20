// A pihenés tiszta függvényeinek tesztje (web/js/karakter/pihenes.js, 6.7).
// Futtatás: node tools/teszt/pihenes.mjs
import * as P from '../../web/js/karakter/pihenes.js';
import { uresKarakter } from '../../web/js/karakter/adat.js';
import * as A from '../../web/js/kampany/alkalom.js';
import { atallit } from '../../web/js/karakter/adat.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// Egy egyszerű számolt lap: Szívósság 2, Akaraterő 1, 2. szint, Egészség 10/30, Mágiapont 3/20.
const lapOf = ({ eg = 10, egMax = 30, mp = 3, mpMax = 20, szint = 2, con = 2, wp = 1 } = {}) => ({
  szint, tulajdonsagok: { tul_constitution: { ertek: con }, tul_willpower: { ertek: wp } },
  egeszseg: { ertek: egMax, aktualis: eg }, magiapont: mpMax ? { ertek: mpMax, aktualis: mp } : null
});

// ---- Szusszanás: a könyv példája (Brigitte, 2. szintű harcos, Szívósság 2: 9 Egészség) ----
const brigitte = lapOf({ eg: 5, egMax: 30, mpMax: 0 });
let t = P.terv(brigitte, { fajta: 'szusszanas' });
let e = P.eredmeny(t);
ellenoriz(e.eg === 9 && e.eg_utana === 14 && e.mp === 0 && t.mp === null, 'szusszanás: 5 + Szívósság + szint (a könyv példája: 9)', e);
ellenoriz(/5 \+ Szívósság 2 \+ szint 2/.test(e.reszlet), 'a részletben a képlet', e.reszlet);
t = P.terv(lapOf({ eg: 28 }), { fajta: 'szusszanas' });
ellenoriz(P.eredmeny(t).eg === 2, 'a maximumnál nem több');

// ---- Szusszanás jogosultsága ----
const a = uresKarakter({ nev: 'Najah' });
ellenoriz(P.szusszanasAllapot(a).ok === 'nincs_csata', 'csata nélkül nincs szusszanás');
a.allapot.utolso_csata = { id: 'cs1', cim: 'Útonállók', nulla: true };
ellenoriz(P.szusszanasAllapot(a).ok === 'nulla' && /0 Egészségen/.test(P.szusszanasAllapot(a).szoveg), 'aki 0-n volt a csata végén, nem szusszanhat');
a.allapot.utolso_csata = { id: 'cs1', cim: 'Útonállók', nulla: false };
ellenoriz(P.szusszanasAllapot(a).lehet, 'egyébként lehet');
const b1 = P.bejegyzes(P.terv(brigitte, { fajta: 'szusszanas' }), P.eredmeny(P.terv(brigitte, { fajta: 'szusszanas' })), { id: 'pi_aaaaaa1', csataId: 'cs1', ki: 'Bence', kampanyId: 'k1' });
a.allapot.egeszseg = 5;
ellenoriz(P.alkalmaz(a, b1) && a.allapot.egeszseg === 14 && a.pihenes_naplo.length === 1, 'alkalmazás: az Egészség nő, a napló bejegyzést kap');
ellenoriz(P.szusszanasAllapot(a).ok === 'mar_volt', 'egy csata után csak egyszer');
ellenoriz(!P.alkalmaz(a, b1) && a.allapot.egeszseg === 14, 'ugyanaz az azonosító kétszer nem kerül be (újra alkalmazás)');
ellenoriz(P.visszavon(a, 'pi_aaaaaa1') && a.allapot.egeszseg === 5 && a.pihenes_naplo[0].visszavonva, 'visszavonás: a kapott érték lejön, jel marad');
ellenoriz(!P.visszavon(a, 'pi_aaaaaa1') && P.szusszanasAllapot(a).lehet, 'kétszer nem vonható vissza; a visszavont szusszanás után újra lehet');
a.allapot.utolso_csata = { id: 'cs2', cim: 'Farkasok', nulla: false };
ellenoriz(P.szusszanasAllapot(a).lehet, 'új csata után újra lehet');

// ---- Alvás ----
t = P.terv(lapOf(), { fajta: 'alvas', orak: 8 });
e = P.eredmeny(t);
ellenoriz(e.eg === 14 && t.mp.teljes && e.mp === 17 && e.mp_utana === 20, 'alvás 8 óra: 10 + Szívósság + szint, és zavartalanul minden Mágiapont', e);
t = P.terv(lapOf(), { fajta: 'alvas', orak: 6 });
ellenoriz(P.kellDobas(t).length === 1 && P.kellDobas(t)[0].db === 6 && P.kellDobas(t)[0].mire === 'mp', '6 óránál a Mágiapont óránként 1d6 (6 kocka)');
e = P.eredmeny(t, { mp: [1, 1, 1, 1, 1, 1] });
ellenoriz(e.eg === 14 && e.mp === 12 && e.hianyzik.length === 0, '6 óra: 6 × (1d6 + Akaraterő 1) = 6 + 6', e);
ellenoriz(P.eredmeny(t).hianyzik.join() === 'mp', 'a hiányzó dobás jelzése');
t = P.terv(lapOf(), { fajta: 'alvas', orak: 5 });
ellenoriz(P.eredmeny(t, { mp: [1, 1, 1, 1, 1] }).eg === 0 && t.figyelmeztetesek.some((x) => /6 óránál/.test(x)), '6 óránál rövidebb alvás nem gyógyít');
t = P.terv(lapOf(), { fajta: 'alvas', orak: 8, zavartalan: false });
ellenoriz(!t.mp.teljes && t.mp.kocka.db === 8 && /megszakítva/.test(t.mp.keplet), 'megszakított 8 óra: óránként dob');
t = P.terv(lapOf({ eg: 1, egMax: 60 }), { fajta: 'alvas', napok: 3 });
ellenoriz(P.eredmeny(t).eg === 42 && t.mp.teljes, 'több nap: naponta a teljes gyógyulás, a Mágiapont mind');

// ---- Súlyos sebek ----
const sl = lapOf({ eg: 2, egMax: 60, con: 3, szint: 4 });
t = P.terv(sl, { fajta: 'alvas', sulyos: true, napok: 3, elsoNap: true });
ellenoriz(P.eredmeny(t).eg === 17 + 6, 'súlyos sebek: első nap 10 + 3 + 4, utána naponta Szívósság (2 × 3)', P.eredmeny(t));
t = P.terv(sl, { fajta: 'alvas', sulyos: true, napok: 3, elsoNap: false });
ellenoriz(P.eredmeny(t).eg === 9 && t.figyelmeztetesek.length === 1, 'első nap nélkül: 3 × Szívósság');
t = P.terv(sl, { fajta: 'alvas', sulyos: true, napok: 3, elsoNap: true, korulmeny: 'gyenge' });
ellenoriz(P.eredmeny(t).eg === 17 + 2, 'rossz ellátás: a napi Szívósság fele, lefelé kerekítve (3 → 1)');
t = P.terv(sl, { fajta: 'alvas', sulyos: true, napok: 2, korulmeny: 'rossz' });
ellenoriz(P.kellDobas(t)[0].db === 2 && t.eg.elojel === -1, 'rossz körülmények: naponta 1d6 sebzés');
ellenoriz(P.eredmeny(t, { eg: [6, 5] }).eg === -2 && P.eredmeny(t, { eg: [6, 5] }).eg_utana === 0, 'a sebzés 0-nál megáll');
t = P.terv(sl, { fajta: 'alvas', sulyos: true, napok: 2, korulmeny: 'nagyon_rossz' });
ellenoriz(P.kellDobas(t)[0].db === 4, 'nagyon rossz körülmények: naponta 2d6');
const s = uresKarakter({ nev: 'Varuker' });
s.allapot.egeszseg = 10;
ellenoriz(P.sulyosElsoNap(s, 10), 'súlyos sebek: az első alvásnál jár az első nap');
const tS = P.terv(lapOf({ eg: 10, egMax: 60 }), { fajta: 'alvas', sulyos: true, elsoNap: true });
const bS = P.bejegyzes(tS, P.eredmeny(tS), { id: 'pi_bbbbbb1', sulyosElso: true });
P.alkalmaz(s, bS);
ellenoriz(s.allapot.egeszseg === 24 && bS.sulyos && bS.sulyos_elso, 'az alvás bejegyzése jelöli a súlyos sebeket');
ellenoriz(!P.sulyosElsoNap(s, 24), 'utána (ha nem sérült) már nem jár az első nap');
ellenoriz(P.sulyosElsoNap(s, 20), 'új seb után újra jár');

// ---- Meditáció ----
t = P.terv(lapOf(), { fajta: 'meditacio', orak: 2 });
e = P.eredmeny(t, { mp: [4, 6] });
ellenoriz(e.eg === 0 && e.mp === 12 && /2 óra × \(1d6 \+ Akaraterő 1\)/.test(e.reszlet), 'meditáció 2 óra: 4 + 6 + 2 × 1', e);
t = P.terv(lapOf({ mp: 0 }), { fajta: 'meditacio', orak: 8 });
ellenoriz(P.eredmeny(t).mp === 20, 'meditáció 8 zavartalan óra: mind');
t = P.terv(lapOf({ mpMax: 0 }), { fajta: 'meditacio', orak: 2 });
ellenoriz(t.mp === null && t.figyelmeztetesek.some((x) => /nincs Mágiapontja/i.test(x)), 'Mágiapont nélkül figyelmeztet');

// ---- Alkalmazás közbeni változás, maximum, null aktuális ----
const c = uresKarakter({ nev: 'Teljes' });
const tC = P.terv(lapOf({ eg: 20 }), { fajta: 'szusszanas' });
const bC = P.bejegyzes(tC, P.eredmeny(tC), { id: 'pi_cccccc1' });
P.alkalmaz(c, bC); // az aktuális null: a maximum
ellenoriz(c.allapot.egeszseg === 30 && c.pihenes_naplo[0].eg === 0, 'ha közben teljes lett, a ténylegesen kapott 0 kerül a naplóba');
const d = uresKarakter({ nev: 'Sérült' });
d.allapot.egeszseg = 3; // közben máshol megsebesült
const tD = P.terv(lapOf({ eg: 10 }), { fajta: 'szusszanas' });
P.alkalmaz(d, P.bejegyzes(tD, P.eredmeny(tD), { id: 'pi_dddddd1' }));
ellenoriz(d.allapot.egeszseg === 12, 'a változás az aktuális értékhez adódik (a máshol kapott sebzés megmarad)');
for (let i = 0; i < P.MAX_NAPLO + 5; i++) P.alkalmaz(d, { id: 'pi_x' + i, idopont: '2026-01-01', fajta: 'szusszanas', eg: 0, eg_max: 30 });
ellenoriz(d.pihenes_naplo.length === P.MAX_NAPLO, 'a napló hossza korlátos');

// ---- Csoportos kérés, csoportok, események, szöveg ----
const k1 = { id: 'c1', nev: 'Dorn', adat: { pihenes_naplo: [{ id: 'pi_g1', idopont: '2026-11-20T10:00:00Z', fajta: 'alvas', eg: 14, mp: 0, kampany_id: 'k1', orak: 8, napok: 1 }] } };
const k2 = { id: 'c2', nev: 'Lia', adat: { pihenes_naplo: [{ id: 'pi_g1', idopont: '2026-11-20T10:00:00Z', fajta: 'alvas', eg: 9, mp: 12, kampany_id: 'k1', orak: 8, napok: 1 },
  { id: 'pi_g0', idopont: '2026-11-19T10:00:00Z', fajta: 'szusszanas', eg: 5, kampany_id: 'k2' }] } };
const cs = P.csoportok([k1, k2], { kampanyId: 'k1' });
ellenoriz(cs.length === 1 && cs[0].tetelek.length === 2 && !cs[0].visszavonva, 'a csapat pihenése egy csoport (a más kampányé kimarad)');
const ev = P.pihenesEsemenyek([k1, k2], 'k1', (x) => x >= '2026-11-20');
ellenoriz(ev.length === 1 && ev[0].kulcs === 'pihenes:pi_g1' && ev[0].adat.tetelek[1].mp === 12, 'esemény az alkalom naplójába');
ellenoriz(P.bejegyzesSzoveg(k2.adat.pihenes_naplo[0]) === 'Alvás, 8 óra: Egészség +9, Mágiapont +12', 'egysoros szöveg', P.bejegyzesSzoveg(k2.adat.pihenes_naplo[0]));
const ker = P.csoportKeres({ kampanyId: 'k1', id: 'pi_q1', fajta: 'szusszanas', sorok: [{ karakter_id: 'c1', bejegyzes: { ...b1 } }] });
ellenoriz(ker.tetelek[0].csata_id === 'cs1' && ker.tetelek[0].eg === 9 && ker.tetelek[0].eg_max === 30, 'csoportos kérés tételei');
ellenoriz(P.PIHENES_ID_MINTA.test(P.ujPihenesId()), 'azonosító minta');

// ---- A régi szerkezetű karakter átállítása megőrzi a pihenést ----
{
  const r = atallit({ nev: 'Régi', egeszseg: { aktualis: 5, max: 20 }, allapot: { utolso_csata: { id: 'cs9', nulla: false } }, pihenes_naplo: [{ id: 'pi_r1', fajta: 'alvas' }] });
  ellenoriz(r.allapot.utolso_csata.id === 'cs9' && r.pihenes_naplo.length === 1 && !r.atvett_egyeb, 'a régi szerkezetű karakter átállítása megőrzi az utolsó csatát és a pihenéseket');
}

// ---- Az alkalom eseménynaplójában ----
{
  const allapot = { kampany: { id: 'k1' }, karakterek: [k1, k2] };
  const jel = A.esemenyekAllapotbol(allapot, { kezdet: '2026-11-20T09:00:00Z', allapot: 'fut' });
  const ev1 = jel.find((x) => x.fajta === 'pihenes');
  ellenoriz(ev1 && jel.filter((x) => x.fajta === 'pihenes').length === 1, 'az alkalom alatt történt pihenés az eseményjelöltek közt');
  ellenoriz(A.esemenySzoveg(ev1) === 'Pihenés: Alvás (Dorn +14 Egészség; Lia +9 Egészség, +12 MP)', 'az esemény szövege', A.esemenySzoveg(ev1));
  const { adat } = A.esemenyekBeolvasztasa(A.adatNorm({}), jel);
  const v = A.vazlat({ kezdet: '2026-11-20T09:00:00Z', allapot: 'fut', adat });
  ellenoriz(/Pihenés: Alvás/.test(v.szoveg), 'a kalandnapló vázlatában is ott van');
}

console.log(`\n${db - hibak}/${db} rendben`);
process.exit(hibak ? 1 : 0);
