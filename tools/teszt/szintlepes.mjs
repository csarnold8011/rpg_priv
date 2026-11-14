// A szintlépés-varázsló logikájának (web/js/karakter/szintlepes.js) helyi tesztje.
// Futtatás: node tools/teszt/szintlepes.mjs
// Nicole harcosa (Brigitte) az 1. szintről a 4.-re, egy mágus arkánum-fokozattal, egy átvett karakter,
// és a félig fizetett tulajdonság-fejlesztés.
import * as S from '../../web/js/karakter/szintlepes.js';
import { uresKarakter, uresSzint, atallit, kulcsmezok } from '../../web/js/karakter/adat.js';
import { karakterSzamol } from '../../web/js/karakter/szamol.js';
import { index } from '../../web/js/karakter/szabalyindex.js';
import { szurtLapok } from '../../web/js/karakter/varazslo.js';
import { LAPOK as MINTA } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// A minta szabályadat kiegészítése a 4–6. szint harcos és a 3. szint mágus soraival.
const LAPOK = { ...MINTA, 'Szintlépés': MINTA['Szintlépés'].concat([
  { id: 'szint_warrior_04', osztaly: 'osz_warrior', szint: 4, reszletek: { kepessegek: [{ tipus: 'specializacio', nev_hu: 'Új specializáció' }, { tipus: 'fegyvercsoport', nev_hu: 'Új fegyvercsoport' }] } },
  { id: 'szint_warrior_05', osztaly: 'osz_warrior', szint: 5, reszletek: { kepessegek: [{ tipus: 'talentum', nev_hu: 'Új talentum' }, { tipus: 'mutatvany_kedvezmeny', nev_hu: 'Mutatványkedvezmény' }] } },
  { id: 'szint_warrior_06', osztaly: 'osz_warrior', szint: 6, reszletek: { kepessegek: [{ tipus: 'specializacio_fokozat', nev_hu: 'Specializáció új fokozata', fokozat: 'Haladó', specializacio_szint: 4 }] } },
  { id: 'szint_mage_03', osztaly: 'osz_mage', szint: 3, reszletek: { kepessegek: [{ tipus: 'magikus_talentum', nev_hu: 'Új mágikus talentum' }] } }
]) };
const ix = index(LAPOK);
const szamol = (k, felkesz) => karakterSzamol(k, LAPOK, { felkesz });
// A lezárás előtti ellenőrzés: a nyitott szint kész jellel (a felület az Áttekintésben így kérdez).
const keszKent = (k) => ({ ...k, szintek: k.szintek.map((s) => (s.kesz === false ? { ...s, kesz: true } : s)) });
const kodok = (lista) => lista.map((f) => f.kod + ':' + f.targy);

function nicole() {
  const k = uresKarakter({ nev: 'Brigitte', forrasok: ['Alapkönyv', 'Companion'] });
  Object.assign(k, { faj: 'faj_human', osztaly: 'osz_warrior' });
  k.keszites.modszer = 'sorban';
  k.keszites.cel_szint = 4;
  k.tulajdonsag_keszites = { dobasok: [10, 7, 13, 10, 13, 8, 14, 13, 16], csere: ['tul_strength', 'tul_willpower'] };
  k.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 2, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
  k.faj_dontes = { fokusz: 'fok_constitution_swimming', elonyok: [{ dobas: 7 }, { dobas: 10 }] };
  k.hatter = { rendszer: 'alap', id: 'hat_soldier', mod: 'dobas', osztaly_dobas: 2, hatter_dobas: 5, fokusz: 'fok_communication_gambling' };
  k.osztaly_dontes = { fegyvercsoportok: ['fcs_axes', 'fcs_bludgeons', 'fcs_bows'] };
  k.szintek = [{ ...uresSzint(1), egeszseg_dobas: 4, kapott: [
    { tipus: 'talentum', id: 'tal_armor_training' }, { tipus: 'talentum', id: 'tal_two_hander_style' }, { tipus: 'talentum', id: 'tal_archery_style' }
  ] }];
  k.felszereles = { targyak: [{ id: 'pan_heavy_leather', db: 1, felszerelve: true }], penz_rez: 200, penz_dobas: 12 };
  k.keszites.allapot = 'kesz';
  return k;
}

// ---------- Indítás: a készítő Kész gombja után, 4. kezdő szint ----------
const k = nicole();
ellenoriz(S.SZINT_LEPESEK.length === 5 && S.szintLepesSzam('fokusz') === 2, 'öt lépés szintenként');
ellenoriz(S.szintlepesIndit(k, 4) === 2 && k.szintek.length === 2 && k.szintek[1].kesz === false, 'a 2. szint nyílik (kesz: false)');
ellenoriz(k.szintlepes.cel === 4 && k.szintlepes.lepes === 'egeszseg', 'a cél a 4. szint, az első lépés az Egészség', k.szintlepes);
ellenoriz(S.szintlepesIndit(k, 4) === 2 && k.szintek.length === 2, 'újraindításkor a félbehagyott szint folytatódik');
ellenoriz(szamol(k).szint === 1 && szamol(k, true).szint === 2 && kulcsmezok(k).szint === 1, 'a félkész szint a lapon nem számít, az előnézetben igen; a kulcsmező 1');
ellenoriz(szamol(k).felkesz_szint === 2, 'a lap jelzi a folyamatban lévő szintlépést');

// ---------- 2. szint ----------
let elotte = szamol(k);
let figy = S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte);
ellenoriz(['hianyzo_dobas:egeszseg:2', 'fejlesztes_hianyzik:2', 'szint_fokusz_hianyzik:2', 'szint_kepesseg_hianyzik:2:fokusz'].every((x) => kodok(figy).includes(x)), 'döntések nélkül a szint hiányai látszanak', kodok(figy));
ellenoriz(figy.map(S.szintFigyLepese).join() === ['egeszseg', 'tulajdonsag', 'fokusz', 'kepessegek'].join() || new Set(figy.map(S.szintFigyLepese)).size === 4, 'a figyelmeztetések a megfelelő lépéshez tartoznak', figy.map(S.szintFigyLepese));
S.egeszsegDob(k, 2, [5], false);
ellenoriz(szamol(k, true).egeszseg.ertek === 45 && elotte.egeszseg.ertek === 37, 'Egészség: 37 + 5 (dobás) + 3 (Szívósság) = 45');
const fi = S.fejlesztesInfo(elotte, 'tul_strength');
ellenoriz(fi.ertek === 3 && fi.uj === 4 && fi.ar === 1 && fi.most, 'az Erő 3 → 4 ára 1 fejlesztés, most nő', fi);
ellenoriz(S.szintTulajdonsagok(ix, 'osz_warrior', 2).sajat.includes('tul_strength') && S.szintCsoport(3) === 'masodlagos', 'páros szinten elsődleges, páratlanon másodlagos');
S.fejlesztesBeallit(k, 2, 'tul_strength');
S.fokuszBeallit(k, 2, 'fok_strength_might');
S.egyValaszt(k, 2, 'fokusz', 'fok_dexterity_riding');
let utana = szamol(k, true);
ellenoriz(utana.tulajdonsagok.tul_strength.ertek === 4 && utana.fokuszok.fok_strength_might && utana.fokuszok.fok_dexterity_riding, 'Erő 4, új fókusz és az osztály fókusza');
ellenoriz(!S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte).length, 'minden döntés után nincs figyelmeztetés', kodok(S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte)));
const valt = S.szintValtozasok(elotte, utana, (t) => t);
ellenoriz(valt.some((v) => v.nev === 'Egészség' && v.uj === 45) && valt.some((v) => v.nev === 'tul_strength' && v.uj === 4) && valt.filter((v) => v.nev === 'Új fókusz').length === 2, 'a változások listája', valt);
ellenoriz(S.szintLezar(k) === 3 && k.szintek[1].kesz === true && k.szintek[2].kesz === false && k.szintlepes.lepes === 'egeszseg', 'lezárás: a 2. szint kész, nyílik a 3.');
ellenoriz(szamol(k).szint === 2 && kulcsmezok(k).szint === 2, 'a lezárt 2. szint már a lapon is');

// ---------- 3. szint: másodlagos tulajdonság, talentum következő fokozata ----------
elotte = szamol(k);
S.egeszsegDob(k, 3, [2], true);
S.fejlesztesBeallit(k, 3, 'tul_strength');
ellenoriz(kodok(S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte)).includes('fejlesztes_tipus:3'), 'páratlan szinten elsődleges fejlesztés: figyelmeztetés (nem tiltás)');
S.fejlesztesBeallit(k, 3, 'tul_perception');
S.fokuszBeallit(k, 3, 'fok_perception_searching');
const tl = S.talentumLehetosegek(index(szurtLapok(LAPOK, k.keszites.forrasok)), k, 3).find((x) => x.id === 'tal_two_hander_style');
ellenoriz(tl.db === 1 && tl.kovetkezo === 'Haladó', 'a meglévő talentum következő fokozata: Haladó', tl && { db: tl.db, k: tl.kovetkezo });
S.egyValaszt(k, 3, 'talentum', 'tal_two_hander_style');
utana = szamol(k, true);
ellenoriz(utana.talentumok.find((t) => t.id === 'tal_two_hander_style').fokozat === 'Haladó', 'Kétkezes stílus Haladó fokon');
ellenoriz(!S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte).length, 'a 3. szint rendben');
ellenoriz(S.szintLezar(k) === 4, 'nyílik a 4. szint');

// ---------- 4. szint: specializáció és fegyvercsoport ----------
elotte = szamol(k);
S.egeszsegDob(k, 4, [6], false);
S.fejlesztesBeallit(k, 4, 'tul_fighting');
S.fokuszBeallit(k, 4, 'fok_fighting_axes');
const sl = S.specializacioLehetosegek(ix, k, 4).find((x) => x.id === 'spec_knight');
ellenoriz(sl && sl.osztalynak && sl.kovetkezo === 'Kezdő', 'a Lovag választható, Kezdő fokon');
S.egyValaszt(k, 4, 'specializacio', 'spec_knight');
S.egyValaszt(k, 4, 'fegyvercsoport', 'fcs_heavy_blades');
S.egyValaszt(k, 4, 'fegyvercsoport', 'fcs_staves');
ellenoriz(S.szintKapott(k, 4, 'fegyvercsoport').join() === 'fcs_staves', 'egy fegyvercsoport: a második választás felülírja az elsőt');
utana = szamol(k, true);
ellenoriz(utana.specializaciok.some((x) => x.id === 'spec_knight') && utana.fegyvercsoportok.some((c) => c.id === 'fcs_lances') && utana.fegyvercsoportok.some((c) => c.id === 'fcs_staves'), 'Lovag (a Kopják járnak vele) és a választott Botok');
ellenoriz(!S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte).length, 'a 4. szint rendben', kodok(S.szintFigyelmeztetesek(szamol(keszKent(k), true), elotte)));
ellenoriz(S.szintLezar(k) === null && !k.szintlepes && kulcsmezok(k).szint === 4 && szamol(k).szint === 4, 'a cél elérve: a szintlépés véget ér, 4. szint');
ellenoriz(szamol(k).egeszseg.ertek === 37 + 8 + 5 + 9, 'Egészség a 4. szinten: 37 + 8 + 5 + 9 = 59', szamol(k).egeszseg.ertek);

// ---------- A karakter oldaláról: egy szint, elvetés ----------
ellenoriz(S.szintlepesIndit(k) === 5 && k.szintlepes.cel === 5, 'a karakter oldaláról egy szint (5.)');
ellenoriz(S.specFokozatJavaslat(k, { specializacio_szint: 4 }) === 'spec_knight' && S.meglevoSpecializaciok(k, 5).join() === 'spec_knight', 'a „Specializáció új fokozata” a 4. szinten választottat javasolja');
S.szintElvet(k);
ellenoriz(k.szintek.length === 4 && !k.szintlepes && kulcsmezok(k).szint === 4, 'elvetés: a félkész szint eltűnik');
// 6. szint automatikus kitöltése
S.szintlepesIndit(k); S.szintLezar(k);
S.szintlepesIndit(k);
S.automatikusKitoltes(k, ix, 6);
ellenoriz(S.szintKapott(k, 6, 'specializacio').join() === 'spec_knight' && szamol(k, true).specializaciok.find((x) => x.id === 'spec_knight').fokozat === 'Haladó', '6. szint: Lovag Haladó fokozata előre kitöltve');

// ---------- Félig fizetett fejlesztés ----------
const h = nicole();
h.tulajdonsag_alap.tul_fighting = 4; // Harc 5 (az ember +1-ével)
const h1 = szamol(h);
S.szintlepesIndit(h, 2);
S.fejlesztesBeallit(h, 2, 'tul_fighting');
S.szintLezar(h);
const hl = szamol(h);
const hi = S.fejlesztesInfo(hl, 'tul_fighting');
ellenoriz(hl.tulajdonsagok.tul_fighting.ertek === 5 && hi.fizetett === 1 && hi.ar === 2 && hi.most, 'Harc 5 → 6 ára 2: egy szint után 1 / 2 kifizetve, a következő fejlesztéssel nő', hi);
ellenoriz(S.szintValtozasok(h1, hl, (t) => t).some((v) => v.szoveg && /1 \/ 2/.test(v.szoveg)), 'a változások között a félig fizetett fejlesztés');

// ---------- Átvett (régi szerkezetű) karakter ----------
const regi = atallit({ nev: 'Dorn', faj: 'faj_human', osztaly: 'osz_warrior', szint: 3, tulajdonsagok: { tul_constitution: 2, tul_strength: 3 },
  egeszseg: { max: 40, aktualis: 30 }, fokuszok: ['fok_fighting_axes'] });
ellenoriz(!szamol(regi).figyelmeztetesek.some((f) => f.kod === 'hianyzo_dobas'), 'átvett karakter: a régi szintek dobásai nem hiányoznak');
S.szintlepesIndit(regi);
ellenoriz(regi.keszites.atvett_szint === 3 && regi.kezi.find((x) => x.cel === 'egeszseg_max').szint === 3 && regi.szintek.length === 4, 'az átvételkori szint (3) rögzül, a felülírás eddig érvényes');
ellenoriz(kodok(S.szintFigyelmeztetesek(szamol(keszKent(regi), true), szamol(regi))).includes('hianyzo_dobas:egeszseg:4'), 'az új (4.) szint dobása viszont hiányzik');
S.egeszsegDob(regi, 4, [3], false);
const rl = szamol(regi, true);
ellenoriz(rl.egeszseg.ertek === 40 + 3 + 2 && szamol(regi).egeszseg.ertek === 40, 'Egészség: 40 (átvett) + 3 (dobás) + 2 (Szívósság), a lezárásig 40', rl.egeszseg);

// ---------- Mágus: Mágiapont és az arkánum új fokozata ----------
function magus(forrasok) {
  const m = uresKarakter({ nev: 'Elian', forrasok });
  Object.assign(m, { faj: 'faj_human', osztaly: 'osz_mage' });
  m.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 1, tul_dexterity: 1, tul_fighting: 0, tul_intelligence: 3, tul_perception: 2, tul_strength: 0, tul_willpower: 2 };
  m.szintek = [{ ...uresSzint(1), egeszseg_dobas: 3, mp_dobas: 4, kapott: [{ tipus: 'arkanum', id: 'ark_fire' }, { tipus: 'varazslat', id: 'var_fire_a' }, { tipus: 'varazslat', id: 'var_fire_b' }] }];
  m.keszites.allapot = 'kesz';
  S.szintlepesIndit(m, 3);
  S.mpDob(m, 2, [5], false);
  return m;
}
const m = magus(['Alapkönyv', 'Companion']);
const ml = szamol(m, true);
ellenoriz(ml.magiapont.ertek === szamol(m).magiapont.ertek + 5 + 2, 'Mágiapont: + 5 (dobás) + 2 (Akaraterő)', [szamol(m).magiapont.ertek, ml.magiapont.ertek]);
S.szintLezar(m);
const mix = index(szurtLapok(LAPOK, m.keszites.forrasok));
const al = S.arkanumLehetosegek(mix, m, 3).find((x) => x.id === 'ark_fire');
ellenoriz(al.db === 1 && al.kovetkezo === 'Haladó', 'a Tűz arkánum következő fokozata: Haladó');
S.arkanumValaszt(m, mix, 3, 'ark_fire', m.keszites.forrasok);
const sv = S.szintVarazslatok(mix, m, 3, 'ark_fire', m.keszites.forrasok);
ellenoriz(sv.valaszthato && sv.db === 1 && sv.fokozat === 'Haladó' && sv.lista.join() === 'var_fire_c', 'Companionnal: egy varázslat választható a még nem ismertek közül', sv);
ellenoriz(kodok(S.szintFigyelmeztetesek(szamol(keszKent(m), true), szamol(m))).includes('szint_varazslat:3'), 'a varázslat választása előtt figyelmeztetés');
S.varazslatValt(m, 3, 'var_fire_c');
const m3 = szamol(m, true);
ellenoriz(m3.arkanumok.find((a) => a.id === 'ark_fire').fokozat === 'Haladó' && m3.fokuszok.fok_intelligence_fire_arcana && m3.varazslatok.some((v) => v.id === 'var_fire_c'), 'Tűz arkánum Haladó: jár a fókusz és az új varázslat');
const m2 = magus(['Alapkönyv']);
S.szintLezar(m2);
const m2ix = index(szurtLapok(LAPOK, ['Alapkönyv']));
S.arkanumValaszt(m2, m2ix, 3, 'ark_fire', ['Alapkönyv']);
ellenoriz(S.szintKapott(m2, 3, 'varazslat').join() === 'var_fire_c', 'csak Alapkönyv: a fokozat varázslata automatikusan jár');
S.arkanumValaszt(m2, m2ix, 3, 'ark_fire', ['Alapkönyv']);
ellenoriz(!S.szintKapott(m2, 3, 'arkanum').length && !S.szintKapott(m2, 3, 'varazslat').length, 'az arkánum visszavételekor a varázslata is kikerül');

console.log(`\n${db - hibak}/${db} ellenőrzés rendben.`);
if (hibak) process.exit(1);
