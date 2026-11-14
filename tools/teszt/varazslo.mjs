// A karakterkészítő varázsló logikájának (web/js/karakter/varazslo.js) helyi tesztje.
// Futtatás: node tools/teszt/varazslo.mjs
// Egy ember harcos végigvezetése a lépéseken, mintha a felület hívná a függvényeket.
import * as V from '../../web/js/karakter/varazslo.js';
import { uresKarakter } from '../../web/js/karakter/adat.js';
import { karakterSzamol } from '../../web/js/karakter/szamol.js';
import { index } from '../../web/js/karakter/szabalyindex.js';
import { LAPOK } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}
const ix = index(LAPOK);
const kodok = (lap) => lap.figyelmeztetesek.filter((x) => x.szint === 'figyelmeztetes').map((x) => x.kod);

// ---------- Segédek ----------
ellenoriz(V.LEPESEK.length === 10 && V.lepesSzam('faj') === 3 && V.lepesSzam('nincs') === 0, 'tíz lépés, sorszám kulcs szerint');
const k6 = Array.from({ length: 600 }, () => V.kocka());
ellenoriz(k6.every((x) => x >= 1 && x <= 6) && new Set(k6).size === 6, 'a kocka 1 és 6 között gurul, minden érték előfordul');
ellenoriz(V.osszeg([3, 4, 5]) === 12 && V.dobas(3).length === 3, 'dobás és összeg');
ellenoriz(V.penzSzoveg(245) === '24 ezüst 5 réz' && V.penzSzoveg(370) === '37 ezüst' && V.penzSzoveg(0) === '0 réz' && V.penzSzoveg(-15) === '−1 ezüst 5 réz', 'pénz szövegesen (ezüstben, mint a könyv árai)');
ellenoriz(V.arRez({ ar: '14 ezüst' }) === 140 && V.arRez({ ar: '1 arany' }) === 100 && V.arRez({ reszletek: { ar_rez: 7 } }) === 7 && V.arRez({ ar: '' }) === null, 'ár rézben (szövegből és ar_rez mezőből)');
ellenoriz(V.elerhetoForrasok(LAPOK).join() === 'Alapkönyv,Companion', 'a szabályadat forrásai');
const csakAlap = V.szurtLapok(LAPOK, ['Alapkönyv']);
ellenoriz(!csakAlap['Fajok'].some((f) => f.forras === 'Companion') && csakAlap['Arkánumok'].some((a) => a.id === 'ark_altalanos'), 'forrásszűrés: a Companion fajok kimaradnak, az általános sorok maradnak');
ellenoriz(V.szurtLapok(LAPOK, ['Alapkönyv']) === csakAlap, 'a szűrt lapok gyorsítótárból jönnek');

// ---------- 1. Keret, 3. Tulajdonságok: sorban dobás ----------
const k = uresKarakter({ nev: 'Kira', forrasok: ['Alapkönyv', 'Companion'] });
V.modszerBeallit(k, 'sorban');
ellenoriz(k.tulajdonsag_keszites.dobasok.length === 9 && k.tulajdonsag_keszites.dobasok.every((x) => x === null), 'sorban dobás: kilenc üres hely');
const sorban = [[3, 4, 3], [2, 4, 1], [6, 2, 5], [4, 1, 5], [5, 5, 3], [1, 6, 1], [6, 6, 2], [4, 3, 6], [6, 5, 5]];
V.sorbanDob(k, 'tul_accuracy', sorban[0], false, ix);
let lap = karakterSzamol(k, LAPOK);
ellenoriz(!kodok(lap).includes('dobas_darab') && !kodok(lap).includes('dobas_elteres'), 'félkész dobássor közben nincs figyelmeztetés', kodok(lap));
V.TULAJDONSAGOK.forEach((t, i) => { if (i) V.sorbanDob(k, t, sorban[i], t === 'tul_perception', ix); });
ellenoriz(k.tulajdonsag_alap.tul_strength === 2 && k.tulajdonsag_alap.tul_willpower === 3, 'sorban: Erő 13 → 2, Akaraterő 16 → 3');
V.csereValt(k, 'tul_strength', ix);
V.csereValt(k, 'tul_willpower', ix);
ellenoriz(k.tulajdonsag_alap.tul_strength === 3 && k.tulajdonsag_alap.tul_willpower === 2, 'csere: Erő és Akaraterő helyet cserél');
ellenoriz(V.utolsoDobas(k, 'tul:tul_perception').kezi === true && k.dobasok.length === 9, 'a dobások a karakter naplójában, a kézi jel megmarad');
lap = karakterSzamol(k, LAPOK);
ellenoriz(!kodok(lap).some((x) => x.startsWith('dobas')), 'a sorban dobás és a csere rendben', kodok(lap));
V.csereValt(k, 'tul_communication', ix);
ellenoriz(JSON.stringify(k.tulajdonsag_keszites.csere) === '["tul_communication"]' && k.tulajdonsag_alap.tul_strength === 2, 'harmadik koppintás: új csere kezdődik, az előző visszaáll');
V.csereValt(k, 'tul_communication', ix);
V.csereValt(k, 'tul_strength', ix);
V.csereValt(k, 'tul_willpower', ix);

// ---------- Elrendezés és vásárlás (külön karakteren) ----------
const e = uresKarakter();
V.modszerBeallit(e, 'elrendezes');
[[6, 6, 6], [1, 1, 1], [3, 3, 3], [4, 4, 4], [2, 2, 2], [5, 5, 5], [3, 4, 5], [2, 3, 4], [1, 2, 3]].forEach((d, i) => V.elrendezesDob(e, i, d, false, ix));
V.elrendezesKioszt(e, 'tul_fighting', 0, ix);
V.elrendezesKioszt(e, 'tul_strength', 0, ix);
ellenoriz(e.tulajdonsag_alap.tul_strength === 4 && e.tulajdonsag_alap.tul_fighting === 0, 'elrendezés: egy dobás egyszerre csak egy helyen lehet');
V.TULAJDONSAGOK.forEach((t, i) => V.elrendezesKioszt(e, t, i, ix));
let lapE = karakterSzamol(e, LAPOK);
ellenoriz(!kodok(lapE).some((x) => x.startsWith('dobas')), 'elrendezés: mind a kilenc kiosztva, rendben', kodok(lapE));
V.elrendezesKioszt(e, 'tul_accuracy', null, ix);
ellenoriz(e.tulajdonsag_alap.tul_accuracy === 0 && e.tulajdonsag_keszites.kiosztas.tul_accuracy === undefined, 'elrendezés: a kiosztás visszavonható');
const v = uresKarakter();
V.modszerBeallit(v, 'vasarlas');
Object.assign(v.tulajdonsag_alap, { tul_fighting: 3, tul_strength: 3, tul_constitution: 3, tul_dexterity: 2 });
ellenoriz(V.vasarlasOsszeg(v) === 11 && kodok(karakterSzamol(v, LAPOK)).includes('vasarlas_osszeg'), 'vásárlás: 11 elköltött fejlesztés figyelmeztet');

// ---------- 4. Faj ----------
V.fajBeallit(k, 'faj_human');
k.faj_dontes.fokusz = 'fok_dexterity_riding';
const fr = ix.elem('Fajok', 'faj_human').reszletek;
V.elonyDob(k, 0, [3, 4], false);
V.elonyDob(k, 1, [3, 5], true);
ellenoriz(V.elonyIsmetles(k, fr, 1) === 0, 'ismétlődő előny (7 és 8 ugyanaz a sor) felismerve');
V.elonyDob(k, 1, [5, 6], true);
ellenoriz(V.elonyIsmetles(k, fr, 1) === -1 && V.elonySor(fr, 11).ertek === 'fok_accuracy_brawling', 'újradobás után más sor: Pontosság (Verekedés)');
ellenoriz(k.dobasok.filter((d) => d.mire === 'elony:1').length === 2, 'az újradobás is a naplóban marad');
lap = karakterSzamol(k, LAPOK);
ellenoriz(lap.tulajdonsagok.tul_constitution.ertek === 3 && lap.fokuszok.fok_accuracy_brawling, 'faji előnyök: +1 Szívósság, Verekedés fókusz');
V.fajBeallit(k, 'faj_human');
ellenoriz(k.faj_dontes.elonyok.length === 2, 'ugyanaz a faj újra kiválasztva: a döntések megmaradnak');

// ---------- 5. Háttér ----------
ellenoriz(V.tarsadalmiOsztalyDobas(ix, 3) === 'Alsó', 'társadalmi osztály: 3 → Alsó');
ellenoriz(V.hatterDobasbol(ix, 'alap', 'Alsó', 5).id === 'hat_soldier' && V.hatterDobasbol(ix, 'alap', 'Alsó', 2) === null, 'háttér a társadalmi osztály táblájából');
const h0 = uresKarakter();
h0.hatter.csoport = 'Közép';
ellenoriz(V.tarsadalmiOsztaly(h0, ix) === 'Közép', 'kezdőpénz társadalmi osztálya háttér nélkül is, ha az osztály már megvan (Alapkönyv)');
h0.hatter.rendszer = 'companion'; h0.hatter.csoport = 'Arkán';
ellenoriz(V.tarsadalmiOsztaly(h0, ix) === null, 'Companion csoport háttér nélkül: nincs társadalmi osztály');
ellenoriz(V.hatterCsoportok(ix).join() === 'Arkán' && V.hatterLista(ix, 'companion', 'Arkán')[0].id === 'hat_c_scholar', 'Companion háttércsoportok');
Object.assign(k.hatter, { rendszer: 'alap', mod: 'dobas', osztaly_dobas: 3, hatter_dobas: 5 });
V.hatterBeallit(k, 'hat_soldier');
k.hatter.fokusz = 'fok_accuracy_brawling';
lap = karakterSzamol(k, LAPOK);
ellenoriz(kodok(lap).includes('dupla_fokusz') && V.lepesFigyelmeztetesek(lap).hatter === 1, 'dupla fókusz: a Háttér lépés figyelmeztetést kap', V.lepesFigyelmeztetesek(lap));
k.hatter.fokusz = 'fok_communication_gambling';

// ---------- 6. Osztály ----------
V.osztalyBeallit(k, 'osz_warrior', ix);
ellenoriz(V.kapottIdk(k, 'talentum').join() === 'tal_armor_training', 'harcos: a Páncélviselet magától jár');
V.kapottBeallit(k, 'talentum', ['tal_two_hander_style', 'tal_archery_style'], V.kotelezoTalentumok(ix, 'osz_warrior'));
ellenoriz(V.kapottIdk(k, 'talentum').join() === 'tal_armor_training,tal_two_hander_style,tal_archery_style', 'kezdő talentumok a kötelező mellé');
k.osztaly_dontes.fegyvercsoportok = ['fcs_axes', 'fcs_bludgeons', 'fcs_bows'];
k.szintek[0].egeszseg_dobas = 4;
lap = karakterSzamol(k, LAPOK);
ellenoriz(lap.egeszseg.ertek === 37, 'Egészség: 30 + Szívósság 3 + dobás 4 = 37', lap.egeszseg);
const ketkezes = V.elofeltetelek(ix.elem('Talentumok', 'tal_two_hander_style'), lap, ix);
ellenoriz(ketkezes.length === 2 && ketkezes.every((x) => x.ok), 'Kétkezes stílus előfeltételei teljesülnek (Erő 3, Fejszék)', ketkezes);
ellenoriz(V.elofeltetelek(ix.elem('Talentumok', 'tal_lore'), lap, ix)[0].ok === false, 'Műveltség: Intelligencia 2 nem teljesül');
ellenoriz(!V.magusE(ix, 'osz_warrior') && V.magusE(ix, 'osz_mage'), 'mágus felismerése a Mágiapont képességből');

// Mágus: arkánumok és varázslatok, Companion választással és csak Alapkönyvvel
const m = uresKarakter({ forrasok: ['Alapkönyv', 'Companion'] });
V.osztalyBeallit(m, 'osz_mage', ix);
const kvC = V.kezdoVarazslatok(ix, 'ark_fire', ['Alapkönyv', 'Companion']);
ellenoriz(kvC.valaszthato && kvC.db === 2 && kvC.lista.length === 2, 'Companionnal a kezdő varázslatok választhatók', kvC);
const kvA = V.kezdoVarazslatok(ix, 'ark_fire', ['Alapkönyv']);
ellenoriz(!kvA.valaszthato && kvA.lista.join() === 'var_fire_a,var_fire_b', 'csak Alapkönyvvel a fix varázslatok járnak', kvA);
V.arkanumokBeallit(m, ix, ['ark_fire', 'ark_water'], ['Alapkönyv']);
ellenoriz(V.kapottIdk(m, 'varazslat').length === 4, 'fix varázslatok automatikusan (2 + 2)', V.kapottIdk(m, 'varazslat'));
V.arkanumokBeallit(m, ix, ['ark_fire'], ['Alapkönyv']);
ellenoriz(V.kapottIdk(m, 'varazslat').join() === 'var_fire_a,var_fire_b', 'a kivett arkánum varázslatai is kikerülnek');

// ---------- 7. Felszerelés ----------
k.felszereles.kezdo_fegyverek = ['fgy_two_handed_axe', 'fgy_long_bow', 'fgy_mace'];
k.felszereles.penz_dobas = 12;
let fsz = V.felszerelesFrissit(k, LAPOK);
ellenoriz(fsz.osztaly === 'Alsó' && fsz.kezdo === 370 && k.felszereles.penz_rez === 370, 'kezdőpénz: Alsó osztály, 25 + 12 ezüst');
const idk = k.felszereles.targyak.map((t) => t.id);
ellenoriz(['fel_backpack', 'pan_heavy_leather', 'fgy_two_handed_axe', 'fel_quiver', 'fel_arrows'].every((x) => idk.includes(x)), 'kezdő csomag: hátizsák, nehéz bőrpáncél, fegyverek, íjhoz tegez és vessző', idk);
// vásárlás: a minta szabályadatban nincs ár, ezért egy árazott tételt teszünk mellé
const lapokArral = { ...LAPOK, 'Felszerelés': LAPOK['Felszerelés'].map((x) => (x.id === 'fel_rope' ? { ...x, ar: '2 ezüst' } : x)) };
V.vasarlas(k, 'fel_rope', 1);
V.vasarlas(k, 'fel_rope', 1);
fsz = V.felszerelesFrissit(k, lapokArral);
ellenoriz(k.felszereles.penz_rez === 330 && k.felszereles.targyak.find((t) => t.id === 'fel_rope').db === 2, 'két kötél 4 ezüstért: 33 ezüst marad');
V.vasarlas(k, 'fel_rope', -2);
V.felszerelesFrissit(k, lapokArral);
ellenoriz(k.felszereles.penz_rez === 370 && !k.felszereles.targyak.some((t) => t.id === 'fel_rope'), 'visszavásárlás: a pénz visszajár');
k.felszereles.targyak.find((t) => t.id === 'fgy_mace').felszerelve = true;
V.felszerelesFrissit(k, lapokArral);
ellenoriz(k.felszereles.targyak.find((t) => t.id === 'fgy_mace').felszerelve === true, 'újraszámolás után a felszerelve jel megmarad');

// ---------- Összegzés ----------
k.keszites.allapot = 'kesz';
V.kulcsmezokFrissit(k);
lap = karakterSzamol(k, LAPOK);
ellenoriz(k.szint === 1 && lap.vedekezes.ertek === 10 + lap.tulajdonsagok.tul_dexterity.ertek, 'kész karakter: szint és Védekezés');
ellenoriz(!kodok(lap).length, 'a végigvitt karakteren nincs figyelmeztetés', lap.figyelmeztetesek.filter((x) => x.szint === 'figyelmeztetes'));
ellenoriz(JSON.stringify(k).length < 6000, `a karakter mérete kicsi marad (${JSON.stringify(k).length} karakter)`);

console.log(`\n${db - hibak}/${db} ellenőrzés rendben.`);
if (hibak) process.exit(1);
