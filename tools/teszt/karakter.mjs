// A karakterszámoló (web/js/karakter/) helyi tesztje. Futtatás: node tools/teszt/karakter.mjs
// Fő eset: az Alapkönyv példakaraktere, Nicole harcosa (Brigitte), az 1. fejezet példái szerint.
import { karakterSzamol, sebzesSzoveg, szamitottKivonat } from '../../web/js/karakter/szamol.js';
import { uresKarakter, atallit, kulcsmezok, normalizal, uresSzint } from '../../web/js/karakter/adat.js';
import { tulajdonsagDobasbol, fejlesztesKoltseg, tarsadalmiOsztalyDobasbol, kezdoPenzRez } from '../../web/js/karakter/tablak.js';
import { index, szam } from '../../web/js/karakter/szabalyindex.js';
import { LAPOK } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}
const kodok = (lap, csakFigy = true) => lap.figyelmeztetesek.filter((x) => !csakFigy || x.szint === 'figyelmeztetes').map((x) => x.kod);
const ix = index(LAPOK);

// ---------- Táblák ----------
ellenoriz([3, 4, 8, 9, 11, 12, 15, 18].map((n) => tulajdonsagDobasbol(n, ix)).join() === '-2,-1,0,1,1,2,3,4', 'tulajdonság a 3d6 összegből (a szabályadat táblája szerint)');
ellenoriz(tulajdonsagDobasbol(10) === 1 && tulajdonsagDobasbol(16) === 3, 'tulajdonság a tartalék táblából is');
ellenoriz([5, 6, 8, 9, 12].map(fejlesztesKoltseg).join() === '1,2,2,3,3', 'fejlesztési költség az új érték szerint');
ellenoriz(tarsadalmiOsztalyDobasbol(2) === 'Alsó' && tarsadalmiOsztalyDobasbol(6) === 'Felső', 'társadalmi osztály 1d6-ra');
ellenoriz(kezdoPenzRez('Alsó', 12, ix) === 370, 'kezdőpénz: Alsó osztály, 3d6 = 12 → 37 ezüst = 370 réz');
ellenoriz(sebzesSzoveg('2d6+1', 2) === '2d6+3' && sebzesSzoveg('3d6', 3) === '3d6+3' && sebzesSzoveg('1d6+3', -3) === '1d6', 'sebzés szöveg');
ellenoriz(szam('−1') === -1 && szam('') === 0 && szam('2,5') === 2.5, 'szám a cellából (nyomdai mínusz, üres, vessző)');

// ---------- Nicole harcosa, 1. szint ----------
function nicole() {
  const k = uresKarakter({ nev: 'Brigitte', forrasok: ['Alapkönyv', 'Companion'] });
  k.faj = 'faj_human';
  k.osztaly = 'osz_warrior';
  k.keszites.modszer = 'sorban';
  // 9 dobás a lap sorrendjében (Alapkönyv 11. o.), majd Erő és Akaraterő cseréje
  k.tulajdonsag_keszites = { dobasok: [10, 7, 13, 10, 13, 8, 14, 13, 16], csere: ['tul_strength', 'tul_willpower'] };
  k.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 2, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
  // Ember: Úszás fókusz; előnyök: +1 Szívósság (7) és Pontosság (Verekedés) (10)
  k.faj_dontes = { fokusz: 'fok_constitution_swimming', elonyok: [{ dobas: 7 }, { dobas: 10 }] };
  // Alsó osztály (2), katona (5); a Verekedés már megvan, ezért Szerencsejáték
  k.hatter = { rendszer: 'alap', id: 'hat_soldier', mod: 'dobas', osztaly_dobas: 2, hatter_dobas: 5, fokusz: 'fok_communication_gambling' };
  k.osztaly_dontes = { fegyvercsoportok: ['fcs_axes', 'fcs_bludgeons', 'fcs_bows'] };
  k.szintek = [{ ...uresSzint(1), egeszseg_dobas: 4, kapott: [
    { tipus: 'talentum', id: 'tal_armor_training' }, { tipus: 'talentum', id: 'tal_two_hander_style' }, { tipus: 'talentum', id: 'tal_archery_style' }
  ] }];
  // Kétkezes fejsze, buzogány, számszeríj, nehéz bőrpáncél; 37 ezüstből 17-et elköltött
  k.felszereles = { targyak: [
    { id: 'fgy_two_handed_axe', db: 1, felszerelve: true }, { id: 'fgy_mace', db: 1 }, { id: 'fgy_crossbow', db: 1 },
    { id: 'pan_heavy_leather', db: 1, felszerelve: true }, { id: 'fel_rope', db: 1 }
  ], penz_rez: 200, penz_dobas: 12 };
  k.keszites.allapot = 'kesz';
  return k;
}

let lap = karakterSzamol(nicole(), LAPOK);
const t = (id) => lap.tulajdonsagok[id].ertek;
ellenoriz(t('tul_fighting') === 3 && t('tul_constitution') === 3 && t('tul_strength') === 3 && t('tul_willpower') === 2, 'Nicole: Harc 3 (ember), Szívósság 3 (előny), Erő 3 és Akaraterő 2 (csere)',
  Object.fromEntries(Object.entries(lap.tulajdonsagok).map(([k, v]) => [k, v.ertek])));
ellenoriz(lap.tulajdonsagok.tul_constitution.reszek.map((r) => r.eredet).join(' | ') === 'Alapérték | Faji előny (1. dobás: 7)', 'a Szívósság összetevői megmagyarázzák az értéket', lap.tulajdonsagok.tul_constitution.reszek);
ellenoriz(['fok_constitution_swimming', 'fok_accuracy_brawling', 'fok_communication_gambling'].every((f) => lap.fokuszok[f] && lap.fokuszok[f].bonusz === 2) && Object.keys(lap.fokuszok).length === 3, 'Nicole fókuszai: Úszás, Verekedés, Szerencsejáték', Object.keys(lap.fokuszok));
ellenoriz(lap.egeszseg.ertek === 37 && lap.egeszseg.aktualis === 37, 'Egészség: 30 + Szívósság 3 + dobás 4 = 37', lap.egeszseg);
ellenoriz(lap.vedekezes.ertek === 11, 'Védekezés: 10 + Ügyesség 1 = 11 (a könyv szerint)', lap.vedekezes);
ellenoriz(lap.sebesseg.ertek === 10, 'Sebesség: 10 + Ügyesség 1 − páncélbüntetés 1 = 10', lap.sebesseg);
ellenoriz(lap.pancelertek.ertek === 4 && lap.pancel.ugyesseg_buntetes === 0, 'Páncélérték 4, Páncélviselettel nincs Ügyesség-büntetés', lap.pancel);
ellenoriz(lap.fegyvercsoportok.map((c) => c.id).sort().join() === 'fcs_axes,fcs_bludgeons,fcs_bows,fcs_brawling', 'fegyvercsoportok: Verekedés + három választott');
const fejsze = lap.fegyverek.find((w) => w.id === 'fgy_two_handed_axe');
const szamszerij = lap.fegyverek.find((w) => w.id === 'fgy_crossbow');
ellenoriz(fejsze.tamadas === 3 && fejsze.sebzes === '3d6+3' && fejsze.ismert && !fejsze.min_ero_alatt, 'kétkezes fejsze: támadás +3, sebzés 3d6+3', fejsze);
ellenoriz(szamszerij.tamadas === 1 && szamszerij.sebzes === '2d6+3', 'számszeríj: Pontosság 1, sebzés 2d6+1 + Észlelés 2', szamszerij);
ellenoriz(lap.talentumok.map((x) => x.id + ':' + x.fokozat).sort().join() === 'tal_archery_style:Kezdő,tal_armor_training:Kezdő,tal_two_hander_style:Kezdő', 'talentumok Kezdő fokon');
ellenoriz(lap.hatter.tarsadalmi_osztaly === 'Alsó' && lap.penz_rez === 200, 'háttér: Alsó osztály, 20 ezüst maradt');
ellenoriz(kodok(lap).length === 0, 'Nicole karaktere szabályos: nincs figyelmeztetés', lap.figyelmeztetesek);

// ---------- Nicole, 2. szint (Alapkönyv 27. o.) ----------
const n2 = nicole();
n2.szintek.push({ ...uresSzint(2), egeszseg_dobas: 4, fejlesztes: 'tul_strength', fokusz: 'fok_fighting_axes', kapott: [{ tipus: 'fokusz', id: 'fok_dexterity_riding' }] });
lap = karakterSzamol(n2, LAPOK);
ellenoriz(lap.szint === 2 && lap.egeszseg.ertek === 44, '2. szint: +4 dobás + Szívósság 3 = 44 Egészség', lap.egeszseg);
ellenoriz(lap.tulajdonsagok.tul_strength.ertek === 4 && lap.fokuszok.fok_fighting_axes && lap.fokuszok.fok_dexterity_riding, '2. szint: Erő 4, Harc (Fejszék), Ügyesség (Lovaglás)');
const fejsze2 = lap.fegyverek.find((w) => w.id === 'fgy_two_handed_axe');
ellenoriz(fejsze2.tamadas === 5 && fejsze2.sebzes === '3d6+4', 'a fókusz és az Erő a fejszén: támadás +5, sebzés 3d6+4', fejsze2);
ellenoriz(kodok(lap).length === 0, '2. szint után sincs figyelmeztetés', lap.figyelmeztetesek);
ellenoriz(kulcsmezok(n2).szint === 2, 'kulcsmezők: a szint a legmagasabb kitöltött szint');

// ---------- Tulajdonság-fejlesztés több szinten át (Alapkönyv 27. o., Erő 5 → 6) ----------
const fx = nicole();
fx.tulajdonsag_alap.tul_strength = 5;
fx.tulajdonsag_keszites.dobasok = [];
for (let n = 2; n <= 8; n++) {
  fx.szintek.push({ ...uresSzint(n), egeszseg_dobas: 3, fejlesztes: n % 2 === 0 ? (n === 6 || n === 8 ? 'tul_strength' : 'tul_dexterity') : 'tul_willpower', fokusz: null });
}
lap = karakterSzamol(fx, LAPOK);
ellenoriz(lap.tulajdonsagok.tul_strength.ertek === 6 && lap.tulajdonsagok.tul_strength.fejlesztes_fuggo === 0, 'Erő 5 → 6 két fejlesztésből (6. és 8. szint)', lap.tulajdonsagok.tul_strength);
const fx7 = normalizal(fx); fx7.szintek = fx7.szintek.filter((s) => s.szint <= 7);
lap = karakterSzamol(fx7, LAPOK);
ellenoriz(lap.tulajdonsagok.tul_strength.ertek === 5 && lap.tulajdonsagok.tul_strength.fejlesztes_fuggo === 1, '7. szinten még Erő 5, egy fejlesztés függőben');

// ---------- Figyelmeztetések ----------
const d1 = nicole();
d1.hatter.fokusz = 'fok_accuracy_brawling';
lap = karakterSzamol(d1, LAPOK);
ellenoriz(kodok(lap).includes('dupla_fokusz') && lap.fokuszok.fok_accuracy_brawling.bonusz === 2, 'ugyanaz a fókusz fajból és háttérből: figyelmeztet, +2 marad');
const d2 = nicole();
d2.elfogadott = ['dupla_fokusz:fok_accuracy_brawling'];
d2.hatter.fokusz = 'fok_accuracy_brawling';
lap = karakterSzamol(d2, LAPOK);
ellenoriz(lap.figyelmeztetesek.find((x) => x.kod === 'dupla_fokusz').elfogadott === true, 'a DM elfogadhatja a figyelmeztetést');
const d3 = nicole();
d3.tulajdonsag_alap.tul_strength = 2;
lap = karakterSzamol(d3, LAPOK);
ellenoriz(['dobas_elteres', 'elofeltetel', 'fegyver_min_ero'].every((k) => kodok(lap).includes(k)), 'Erő 2: eltér a dobástól, Kétkezes stílus előfeltétele és a fejsze minimális Ereje sérül', kodok(lap));
const d4 = nicole();
d4.faj_dontes.elonyok = [{ dobas: 7 }, { dobas: 8 }];
lap = karakterSzamol(d4, LAPOK);
ellenoriz(kodok(lap).includes('elony_ismetles') && lap.tulajdonsagok.tul_constitution.ertek === 4, 'ugyanaz az előnysor kétszer: figyelmeztet (az érték azért számolódik)');
const d5 = nicole();
d5.szintek[0].kapott = [{ tipus: 'talentum', id: 'tal_two_hander_style' }];
d5.osztaly_dontes.fegyvercsoportok = ['fcs_axes', 'fcs_bludgeons', 'fcs_bows', 'fcs_staves'];
lap = karakterSzamol(d5, LAPOK);
ellenoriz(['kezdo_talentum', 'kotelezo_talentum', 'fegyvercsoport_darab'].every((k) => kodok(lap).includes(k)), 'hiányzó kezdő talentum, Páncélviselet, túl sok fegyvercsoport', kodok(lap));
ellenoriz(lap.pancel.ugyesseg_buntetes === 1 && kodok(lap, false).includes('pancel_kepzetlen'), 'Páncélviselet nélkül Ügyesség-büntetés jár');
const d6 = nicole();
d6.felszereles.targyak.push({ id: 'fgy_long_sword', db: 1 });
d6.felszereles.penz_rez = -10;
lap = karakterSzamol(d6, LAPOK);
const kard = lap.fegyverek.find((w) => w.id === 'fgy_long_sword');
ellenoriz(!kard.ismert && kard.tamadas === 1 && kard.sebzes === '(2d6+3) / 2' && kodok(lap).includes('fegyver_kepzetlen') && kodok(lap).includes('penz_negativ'), 'ismeretlen fegyvercsoport: −2 támadás, fél sebzés; negatív pénz', kard);
const d7 = nicole();
d7.szintek.push({ ...uresSzint(2), egeszseg_dobas: 2, fejlesztes: 'tul_willpower', fokusz: 'fok_willpower_courage', kapott: [{ tipus: 'fokusz', id: 'fok_strength_might' }] });
lap = karakterSzamol(d7, LAPOK);
ellenoriz(['fejlesztes_tipus', 'szint_fokusz_tipus', 'osztaly_fokusz'].every((k) => kodok(lap).includes(k)), '2. szint: másodlagos tulajdonság, rossz fókusz, nem felsorolt osztályfókusz', kodok(lap));
const d8 = nicole();
d8.keszites.forrasok = ['Alapkönyv'];
d8.faj = 'faj_draak';
d8.faj_dontes = { fokusz: 'fok_willpower_courage', elonyok: [{ dobas: 3 }, { dobas: 7 }] };
lap = karakterSzamol(d8, LAPOK);
ellenoriz(kodok(lap).includes('forras_kikapcsolt') && lap.pancelertek.ertek === 6, 'Companion faj Alapkönyv-only karakternél: figyelmeztet; Páncélos +2 Páncélérték', lap.pancelertek);
const d9 = nicole();
d9.keszites.modszer = 'vasarlas';
d9.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 4, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
lap = karakterSzamol(d9, LAPOK);
ellenoriz(kodok(lap).includes('vasarlas_osszeg') && kodok(lap).includes('vasarlas_korlat'), 'vásárlás: 15 fejlesztés és egy 4-es érték', kodok(lap));

// ---------- Faji fegyvercsoport-előny, ha az osztály már adja ----------
const ork = nicole();
ork.faj = 'faj_orc';
ork.faj_dontes = { fokusz: 'fok_strength_might', elonyok: [{ dobas: 9 }, { dobas: 2 }] };
lap = karakterSzamol(ork, LAPOK);
ellenoriz(lap.fokuszok.fok_fighting_bludgeons && lap.fegyvercsoportok.filter((c) => c.id === 'fcs_bludgeons').length === 1, 'ork, Zúzófegyverek előny: a harcos már tudja, ezért Harc (Zúzófegyverek) fókusz jár');
ork.osztaly_dontes.fegyvercsoportok = ['fcs_axes', 'fcs_bows', 'fcs_staves'];
lap = karakterSzamol(ork, LAPOK);
ellenoriz(!lap.fokuszok.fok_fighting_bludgeons && lap.fegyvercsoportok.some((c) => c.id === 'fcs_bludgeons'), 'ha nem tudja, a fegyvercsoportot kapja');

// ---------- Mágus ----------
const m = uresKarakter({ nev: 'Varázsló' });
m.faj = 'faj_human';
m.osztaly = 'osz_mage';
m.keszites.modszer = 'vasarlas';
m.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 1, tul_dexterity: 1, tul_fighting: 0, tul_intelligence: 3, tul_perception: 1, tul_strength: 0, tul_willpower: 3 };
m.faj_dontes = { fokusz: 'fok_dexterity_riding', elonyok: [{ dobas: 2 }, { dobas: 5 }] };
m.hatter = { rendszer: 'companion', id: 'hat_c_scholar', mod: 'valasztas', fokusz: 'fok_intelligence_arcane_lore' };
m.szintek = [{ ...uresSzint(1), egeszseg_dobas: 3, mp_dobas: 5, kapott: [
  { tipus: 'arkanum', id: 'ark_fire' }, { tipus: 'arkanum', id: 'ark_water' },
  { tipus: 'varazslat', id: 'var_fire_a' }, { tipus: 'varazslat', id: 'var_fire_b' }, { tipus: 'varazslat', id: 'var_water_a' }, { tipus: 'varazslat', id: 'var_water_b' }
] }];
m.keszites.allapot = 'kesz';
lap = karakterSzamol(m, LAPOK);
ellenoriz(lap.magiapont && lap.magiapont.ertek === 18, 'mágus Mágiapont: 10 + Akaraterő 3 + dobás 5 = 18', lap.magiapont);
ellenoriz(lap.egeszseg.ertek === 24 && lap.tulajdonsagok.tul_intelligence.ertek === 4, 'mágus Egészség 20 + 1 + 3; Intelligencia 3 + 1 (előny)');
ellenoriz(kodok(lap).length === 0, 'a mágus szabályos', lap.figyelmeztetesek);
ellenoriz(!lap.fokuszok.fok_intelligence_fire_arcana, 'Kezdő arkánumhoz még nem jár arkánumfókusz');
m.szintek.push({ ...uresSzint(2), egeszseg_dobas: 1, mp_dobas: 2, fejlesztes: 'tul_willpower', fokusz: 'fok_accuracy_staves', kapott: [{ tipus: 'arkanum', id: 'ark_fire' }, { tipus: 'varazslat', id: 'var_fire_c' }] });
lap = karakterSzamol(m, LAPOK);
ellenoriz(lap.fokuszok.fok_intelligence_fire_arcana && lap.arkanumok.find((a) => a.id === 'ark_fire').fokozat === 'Haladó', 'Haladó Tűz arkánum: jár a Tűz arkánum fókusz');
ellenoriz(lap.magiapont.ertek === 23, 'mágus 2. szint: 18 + dobás 2 + Akaraterő 3 (a fejlesztés előtti érték) = 23', lap.magiapont);
ellenoriz(lap.tulajdonsagok.tul_willpower.ertek === 4, 'mágus 2. szint: Akaraterő 4');
m.szintek[1].kapott.push({ tipus: 'varazslat', id: 'var_fire_c' });
m.szintek[0].kapott = m.szintek[0].kapott.filter((k) => k.id !== 'var_water_a');
lap = karakterSzamol(m, LAPOK);
ellenoriz(kodok(lap).includes('varazslat_ketszer') && kodok(lap).includes('magus_varazslat'), 'kétszer felvett varázslat és hiányzó kezdő varázslat', kodok(lap));
const m2 = normalizal(m);
m2.szintek = [m2.szintek[0]];
m2.szintek[0].kapott.push({ tipus: 'varazslat', id: 'var_fire_c' });
lap = karakterSzamol(m2, LAPOK);
ellenoriz(kodok(lap).includes('varazslat_fokozat'), 'Haladó varázslat Kezdő arkánummal: figyelmeztet');

// ---------- Zsiványpáncél ----------
const z = nicole();
z.osztaly = 'osz_rogue';
z.osztaly_dontes.fegyvercsoportok = ['fcs_bows'];
z.szintek[0].kapott = [];
z.felszereles.targyak = [{ id: 'pan_heavy_leather', felszerelve: true }];
lap = karakterSzamol(z, LAPOK);
ellenoriz(lap.pancel.buntetes === 0 && lap.sebesseg.ertek === 11 && lap.pancel.ugyesseg_buntetes === 0, 'zsivány bőrpáncélban: nincs büntetés (Zsiványpáncél)', lap.pancel);
z.felszereles.targyak = [{ id: 'pan_heavy_mail', felszerelve: true }, { id: 'pan_medium_shield', felszerelve: true }];
lap = karakterSzamol(z, LAPOK);
ellenoriz(lap.pancel.buntetes === 3 && lap.pancel.ugyesseg_buntetes === 3 && lap.vedekezes.ertek === 12, 'zsivány sodronyban: büntetés 3; pajzs talentum nélkül csak +1 Védekezés', { pancel: lap.pancel, ved: lap.vedekezes.ertek });

// ---------- Kézi módosítók ----------
const kz = nicole();
kz.kezi = [{ cel: 'tul_perception', ertek: 1, megjegyzes: 'DM ajándéka' }, { cel: 'vedekezes', ertek: 14, mod: 'felulir' }, { cel: 'fok_strength_might', ertek: 2 }];
lap = karakterSzamol(kz, LAPOK);
ellenoriz(lap.tulajdonsagok.tul_perception.ertek === 3 && lap.vedekezes.ertek === 14 && lap.vedekezes.szamolt === 11 && lap.fokuszok.fok_strength_might, 'kézi módosítók: +1 Észlelés, felülírt Védekezés, extra fókusz');
ellenoriz(kodok(lap, false).filter((k) => k === 'kezi_modosito').length === 3 && kodok(lap).length === 0, 'a kézi módosítók tájékoztatásként jelennek meg, nem hibaként');

// ---------- Átállás a korábbi szerkezetről ----------
const regi = { nev: 'Pöttöm', faj: 'Félszerzet', osztaly: 'osz_rogue', szint: 3, tulajdonsagok: { tul_dexterity: 3, tul_accuracy: 2 }, fokuszok: ['fok_accuracy_bows'], egeszseg: { aktualis: 20, max: 31 }, vedekezes: 13, jegyzet: 'kalóz' };
const uj = atallit(regi);
ellenoriz(uj.sema === 1 && uj.keszites.allapot === 'atvett' && uj.szintek.length === 3 && uj.nev === 'Pöttöm', 'átállás: sema 1, átvett állapot, 3 szint');
ellenoriz(uj.atvett_egyeb && uj.atvett_egyeb.jegyzet === 'kalóz', 'átállás: az ismeretlen mezők megmaradnak');
lap = karakterSzamol(regi, LAPOK);
ellenoriz(lap.tulajdonsagok.tul_dexterity.ertek === 3 && lap.fokuszok.fok_accuracy_bows && lap.egeszseg.ertek === 31 && lap.egeszseg.aktualis === 20 && lap.vedekezes.ertek === 13, 'átállás: a régi karakter értékei változatlanul látszanak', { eg: lap.egeszseg, ved: lap.vedekezes.ertek });
ellenoriz(kodok(lap, false).includes('ismeretlen_faj'), 'átállás: a szabad szöveges faj tájékoztatást kap');
ellenoriz(kodok(lap).length === 0, 'átállás: az átvett karakternél nincs figyelmeztetés (például hiányzó szintdobás miatt)', lap.figyelmeztetesek);
ellenoriz(atallit(uj).szintek.length === 3 && karakterSzamol(uj, LAPOK).egeszseg.ertek === 31, 'az átállított karakter újra beolvasva ugyanaz');
ellenoriz(karakterSzamol({}, LAPOK).egeszseg.ertek === 0 && karakterSzamol(null, {}).figyelmeztetesek.length === 0, 'üres karakter és üres szabályadat sem hibázik');

// ---------- Kivonat és méret ----------
const kiv = szamitottKivonat(karakterSzamol(nicole(), LAPOK));
ellenoriz(kiv.egeszseg_max === 37 && kiv.tulajdonsagok.tul_fighting === 3 && kiv.figyelmeztetes_db === 0, 'mentési kivonat');
ellenoriz(JSON.stringify(nicole()).length < 4000, 'egy 1. szintű karakter jóval a cellakorlát alatt marad (' + JSON.stringify(nicole()).length + ' karakter)');

console.log(`\n${db - hibak}/${db} ellenőrzés rendben.`);
if (hibak) { console.log(hibak + ' hiba.'); process.exit(1); }
