// A Kampányépítő tiszta függvényeinek tesztje (web/js/kampany/): elemek öröklése, fa, kapcsolatok, kampánykeret,
// generátormotor. Futtatás: node tools/teszt/kampany.mjs
// A minta dobótáblák kitaláltak (a könyvek szövege nem kerülhet a repóba), csak a szerkezetük követi a könyvét.
import * as E from '../../web/js/kampany/elem.js';
import * as F from '../../web/js/kampany/fa.js';
import * as KP from '../../web/js/kampany/kapcsolat.js';
import * as KR from '../../web/js/kampany/keret.js';
import * as G from '../../web/js/kampany/generator.js';
import * as KL from '../../web/js/kampany/kaland.js';
import * as JL from '../../web/js/kampany/jelenet.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}
// Előre megadott kockák: minden hívás a következő értéket adja (1–6), utána ismétel.
function kockak(...ertekek) {
  let i = 0;
  return () => { const k = ertekek[i % ertekek.length]; i++; return (k - 1) / 6 + 0.01; };
}

// ---------- Elemek, szintek, öröklés ----------
const sablon = { id: 'el_s', tipus: 'helyszin', vilag_id: '', kampany_id: '', alap_id: '', szulo_id: '', adat: { nev: 'Kocsma', leiras: 'Füstös ivó.', cimkek: ['ital'], titkok: 'Pince alatt alagút.' } };
const vilagElem = { id: 'el_v', tipus: 'helyszin', vilag_id: 'w1', kampany_id: '', alap_id: 'el_s', szulo_id: '', adat: { nev: 'A Vén Csuka' } };
const kampanyElem = { id: 'el_k', tipus: 'helyszin', vilag_id: '', kampany_id: 'c1', alap_id: 'el_v', szulo_id: '', adat: { titkok: 'A kocsmáros kém.' } };
let elemek = [sablon, vilagElem, kampanyElem];
let ix = E.index(elemek);

ellenoriz(E.szint(sablon) === 'sablon' && E.szint(vilagElem) === 'vilag' && E.szint(kampanyElem) === 'kampany', 'szintek: sablon, világ, kampány');
ellenoriz(E.lanc(kampanyElem, ix).map((x) => x.id).join(',') === 'el_k,el_v,el_s', 'öröklési lánc kampány → világ → sablon');
let m = E.mezoErtek(kampanyElem, 'nev', ix);
ellenoriz(m.ertek === 'A Vén Csuka' && m.honnan === 'vilag' && !m.sajat, 'a név a világelemből jön');
m = E.mezoErtek(kampanyElem, 'leiras', ix);
ellenoriz(m.ertek === 'Füstös ivó.' && m.honnan === 'sablon', 'a leírás a sablonból jön');
m = E.mezoErtek(kampanyElem, 'titkok', ix);
ellenoriz(m.ertek === 'A kocsmáros kém.' && m.sajat && m.orokolt.ertek === 'Pince alatt alagút.' && m.orokolt.honnan === 'sablon', 'a kampány felülírása nyer, az örökölt érték is látszik');
const mj = E.megjelenitett(kampanyElem, ix);
ellenoriz(mj.nev === 'A Vén Csuka' && mj.leiras === 'Füstös ivó.' && mj.titkok === 'A kocsmáros kém.' && mj.cimkek[0] === 'ital', 'megjelenített adat összefésülve');
ellenoriz(E.nev(kampanyElem, ix) === 'A Vén Csuka', 'megjelenített név');

let k2 = E.mezoBeallit(kampanyElem, 'leiras', 'Füstös ivó.', ix);
ellenoriz(!('leiras' in k2.adat), 'az örökölttel azonos érték nem lesz felülírás');
k2 = E.mezoBeallit(kampanyElem, 'cimkek', ['ital', 'kikötő'], ix);
ellenoriz(k2.adat.cimkek.length === 2 && E.mezoErtek(k2, 'cimkek', ix).sajat, 'a listás mező egészben íródik felül');
k2 = E.mezoBeallit(kampanyElem, 'nev', '', ix);
ellenoriz(!('nev' in k2.adat) && E.nev(k2, ix) === 'A Vén Csuka', 'üres név: az alapé látszik');
k2 = E.visszaallit(kampanyElem, 'titkok');
ellenoriz(E.mezoErtek(k2, 'titkok', ix).ertek === 'Pince alatt alagút.', 'visszaállítás az örökölt értékre');
ellenoriz(E.felulirtMezok(kampanyElem, ix).join() === 'titkok', 'felülírt mezők listája');
const lev = E.levalaszt(kampanyElem, ix);
ellenoriz(!lev.alap_id && lev.adat.leiras === 'Füstös ivó.' && lev.adat.nev === 'A Vén Csuka' && lev.adat.titkok === 'A kocsmáros kém.', 'leválasztás: teljes saját másolat, alap nélkül');
const sabl = E.sablonbol(kampanyElem, ix, 'el_uj');
ellenoriz(E.szint(sabl) === 'sablon' && !sabl.alap_id && sabl.adat.titkok === 'A kocsmáros kém.', 'sablon készítése bármely elemből');
const pld = E.peldany(vilagElem, { kampany_id: 'c2' }, 'el_p');
ellenoriz(pld.alap_id === 'el_v' && E.szint(pld) === 'kampany' && Object.keys(pld.adat).length === 0, 'új kampányelem világelemre hivatkozva, üres felülírással');
ellenoriz(E.lehetAlap(kampanyElem, vilagElem) && E.lehetAlap(vilagElem, sablon) && !E.lehetAlap(sablon, vilagElem) && !E.lehetAlap(vilagElem, { ...sablon, tipus: 'csoport' }), 'alap: azonos típus, magasabb szint');
ellenoriz(E.ellenoriz({ ...kampanyElem, alap_id: 'el_x' }, ix).length === 1, 'hiányzó alap hibát ad');
ellenoriz(E.ellenoriz({ ...kampanyElem, vilag_id: 'w1' }, ix).length >= 1, 'világ és kampány egyszerre hiba');
ellenoriz(E.ellenoriz({ id: 'x', tipus: 'keret', kampany_id: 'c1', adat: {} }, ix).length === 1, 'a kampánykeret elemként csak sablon lehet');
const korosA = { id: 'a', tipus: 'helyszin', alap_id: 'b', vilag_id: 'w', adat: {} };
const korosB = { id: 'b', tipus: 'helyszin', alap_id: 'a', vilag_id: 'w', adat: { nev: 'B' } };
ellenoriz(E.lanc(korosA, E.index([korosA, korosB])).length === 2, 'öröklési kör nem akasztja meg');
ellenoriz(E.peldanyai(vilagElem, elemek).length === 1, 'példányok listája');

// ---------- Fa ----------
const v = (id, tipus, szulo, sorrend, nev, extra = {}) => ({ id, tipus, vilag_id: 'w1', kampany_id: '', alap_id: '', szulo_id: szulo, sorrend, adat: { nev }, ...extra });
const faElemek = [
  v('orszag', 'helyszin', '', 10, 'Ország'),
  v('varos', 'helyszin', 'orszag', 20, 'Város'),
  v('falu', 'helyszin', 'orszag', 10, 'Falu'),
  v('kocsma', 'helyszin', 'varos', 10, 'Kocsma'),
  v('ceh', 'csoport', '', 10, 'Céh'),
  { id: 'k_bolt', tipus: 'helyszin', vilag_id: '', kampany_id: 'c1', alap_id: '', szulo_id: 'varos', sorrend: 20, adat: { nev: 'Bolt' } }
];
const fix = E.index(faElemek);
ellenoriz(F.gyerekek(faElemek, 'orszag', fix).map((e) => e.id).join() === 'falu,varos', 'gyerekek sorrend szerint');
const helyFa = F.fa(faElemek.filter((e) => e.tipus === 'helyszin'), fix);
ellenoriz(helyFa.length === 1 && helyFa[0].gyerekek.length === 2 && helyFa[0].gyerekek[1].gyerekek.length === 2, 'fa építése');
ellenoriz(F.osok(fix.get('kocsma'), fix).map((e) => e.id).join() === 'orszag,varos', 'ősök a gyökértől');
ellenoriz(F.utvonal(fix.get('kocsma'), fix) === 'Ország › Város › Kocsma', 'útvonal szövegként');
ellenoriz(F.leszarmazottak(fix.get('orszag'), faElemek).length === 4, 'leszármazottak');
ellenoriz(F.athelyezesHiba(fix.get('orszag'), 'kocsma', fix) !== '', 'saját leszármazott alá nem kerülhet');
ellenoriz(F.athelyezesHiba(fix.get('ceh'), 'varos', fix) !== '', 'csoport nem kerülhet helyszín alá');
ellenoriz(F.athelyezesHiba(fix.get('kocsma'), 'falu', fix) === '', 'helyszín áthelyezhető másik helyszín alá');
ellenoriz(E.szulohozIllik(fix.get('k_bolt'), fix.get('varos')) && !E.szulohozIllik(fix.get('varos'), fix.get('k_bolt')), 'kampányelem világelem alá kerülhet, fordítva nem');
const mozg = F.athelyez(faElemek, 'kocsma', 'orszag', 0);
ellenoriz(mozg.find((x) => x.id === 'kocsma').szulo_id === 'orszag' && mozg.find((x) => x.id === 'kocsma').sorrend === 10 && mozg.some((x) => x.id === 'falu' && x.sorrend === 20), 'áthelyezés új helyre, a testvérek sorrendje igazodik');
ellenoriz(F.kovetkezoSorrend(faElemek, 'orszag') === 30, 'következő sorrendszám');
const emelt = E.emel(fix.get('k_bolt'), 'w1', fix);
ellenoriz(emelt.vilag_id === 'w1' && !emelt.kampany_id && emelt.szulo_id === 'varos', 'világelemmé emelés (a világelem szülő marad)');
const kSzulo = { id: 'k_v', tipus: 'helyszin', kampany_id: 'c1', vilag_id: '', szulo_id: '', adat: {} };
const kGyerek = { id: 'k_g', tipus: 'helyszin', kampany_id: 'c1', vilag_id: '', szulo_id: 'k_v', adat: {} };
ellenoriz(E.emel(kGyerek, 'w1', E.index([kSzulo, kGyerek])).szulo_id === '', 'emeléskor a kampányszülő alól a gyökérbe kerül');
ellenoriz(E.szures(faElemek, { szoveg: 'kocs' }).length === 1 && E.szures(faElemek, { tipus: 'csoport' }).length === 1, 'szűrés név és típus szerint');

// ---------- Kapcsolatok ----------
const kapcs = [
  { id: 'l1', honnan: 'njk_apa', hova: 'njk_lany', tipus: 'szulo_gyermek' },
  { id: 'l2', honnan: 'njk_apa', hova: 'ceh', tipus: 'vezeti' },
  { id: 'l3', honnan: 'njk_lany', hova: 'njk_x', tipus: 'ellensege' },
  { id: 'l4', honnan: 'jel1', hova: 'jel2', tipus: 'kovetkezik' },
  { id: 'l5', honnan: 'jel1', hova: 'jel3', tipus: 'kovetkezik' },
  { id: 'l6', honnan: 'x', hova: 'y', tipus: 'baratja', aktiv: false }
];
let kl = KP.elemKapcsolatai('njk_lany', kapcs);
ellenoriz(kl.length === 2 && kl.find((x) => x.masik === 'njk_apa').felirat === 'szülője' && kl.find((x) => x.masik === 'njk_x').felirat === 'ellensége', 'kapcsolatok mindkét irányban, fordított felirattal');
kl = KP.elemKapcsolatai('njk_apa', kapcs);
ellenoriz(kl.find((x) => x.masik === 'njk_lany').felirat === 'gyermeke' && kl.find((x) => x.masik === 'ceh').felirat === 'vezeti', 'a honnan oldal felirata');
ellenoriz(KP.elemKapcsolatai('x', kapcs).length === 0, 'archivált kapcsolat nem látszik');
ellenoriz(KP.vanMar({ honnan: 'njk_x', hova: 'njk_lany', tipus: 'ellensege' }, kapcs), 'szimmetrikus kapcsolat fordítva is ugyanaz');
ellenoriz(!KP.vanMar({ honnan: 'njk_lany', hova: 'njk_apa', tipus: 'szulo_gyermek' }, kapcs), 'irányított kapcsolat fordítva más');
ellenoriz(KP.ellenoriz({ honnan: 'a', hova: 'a', tipus: 'baratja' }, []).length === 1 && KP.ellenoriz({ honnan: 'a', hova: 'b', tipus: 'nincs' }, []).length === 1, 'kapcsolat ellenőrzése');
ellenoriz(KP.kovetkezok('jel1', kapcs).join() === 'jel2,jel3', 'elágazó „következő” kapcsolatok');
ellenoriz(KP.erintett('njk_apa', kapcs).length === 2, 'egy elem összes kapcsolata');
ellenoriz(Object.keys(KP.tipusCsoportok()).length === 4, 'kapcsolattípusok csoportokban');

// ---------- Kampánykeret ----------
let k = KR.uresKeret();
ellenoriz(Object.keys(k.ivek).length === 5 && k.szintsav.kezdo === 1 && k.szintsav.zaro === 20 && k.kihivasok.harc === 3, 'üres keret alapértékekkel');
ellenoriz(KR.normalizal({ szintsav: { kezdo: 7, zaro: 3 }, kihivasok: { harc: 9 } }).szintsav.zaro === 7 && KR.normalizal({ kihivasok: { harc: 9 } }).kihivasok.harc === 5, 'szintsáv és súlyok korlátozva');
ellenoriz(KR.normalizal({ jatekosok: { 'f:u1': { kedvel: ['harc', 'tánc'] } } }).jatekosok['f:u1'].kedvel.join() === 'harc', 'ismeretlen kedvelt kihívás kiesik');
k = KR.beallit(k, 'veg.ellenfel.nev', 'A Démonúrnő');
ellenoriz(k.veg.ellenfel.nev === 'A Démonúrnő' && KR.uresKeret().veg.ellenfel.nev === '', 'mezőírás útvonallal, az eredeti nem változik');
k = KR.beallit(k, 'szintsav', { kezdo: 1, zaro: 10 });
ellenoriz(KR.ivAktiv(KR.IVEK[1], k) && KR.ivAktiv(KR.IVEK[2], k) && !KR.ivAktiv(KR.IVEK[3], k), 'ívek a tervezett szintsávban');
const ar = KR.kihivasArany({ kihivasok: { harc: 2, felfedezes: 1, szerepjatek: 1 } });
ellenoriz(ar.harc === 50 && ar.felfedezes === 25 && ar.szerepjatek === 25, 'kihívások aránya százalékban');
ellenoriz(KR.kihivasArany({ kihivasok: { harc: 0, felfedezes: 0, szerepjatek: 0 } }).harc === 0, 'nulla súlyok');
k = KR.peldaAlkalmaz(k, 'zsoldosok');
ellenoriz(k.peldakeret === 'zsoldosok' && k.tema.startsWith('A hősök egy zsoldoscsapat') && KR.keretNev(k) === 'Zsoldosok', 'keret-példa: név és kiinduló téma');
k = KR.beallit(k, 'tema', 'Saját téma.');
ellenoriz(KR.peldaAlkalmaz(k, 'kuldetes').tema === 'Saját téma.', 'a kitöltött témát a példa nem írja felül');
let all = KR.lepesAllapot(k, [{ id: 'c1', jatekos_id: 'u1' }, { id: 'c2', jatekos_id: '' }]);
ellenoriz(all.tema === 'kesz' && all.veg === 'resz' && all.jatekosok === 'ures' && all.ivek === 'ures', 'lépések állapota');
k = KR.beallit(k, 'jatekosok', { 'f:u1': { kedvel: ['harc'], jegyzet: '' } });
ellenoriz(KR.lepesAllapot(k, [{ id: 'c1', jatekos_id: 'u1' }, { id: 'c2', jatekos_id: '' }]).jatekosok === 'resz', 'játékos-lépés részben kész (a gyerek karaktere még nincs)');
ellenoriz(KR.jatekosKulcs({ id: 'c2', jatekos_id: '' }) === 'k:c2' && KR.jatekosKulcs({ id: 'c1', jatekos_id: 'u1' }) === 'f:u1', 'játékos kulcsa (játékos nélküli karakternél a karakter)');
ellenoriz(KR.jatekosoknak(KR.uresKeret()) === null, 'üres keretből nincs játékosoknak szóló rész');
k = KR.ajanlasValt(k, 'fajok', 'faj_elf');
ellenoriz(KR.ajanlasJel(KR.jatekosoknak(k), 'fajok', 'faj_elf') === 'ajanlott', 'ajánlott faj');
k = KR.ajanlasValt(k, 'fajok', 'faj_elf');
ellenoriz(KR.ajanlasJel(KR.jatekosoknak(k), 'fajok', 'faj_elf') === 'kizart', 'második koppintás: kizárt');
k = KR.ajanlasValt(k, 'fajok', 'faj_elf');
ellenoriz(KR.ajanlasJel(KR.jatekosoknak(k), 'fajok', 'faj_elf') === null, 'harmadik: semleges');
k = KR.ajanlasValt(KR.ajanlasValt(k, 'fokuszok', 'fok_x'), 'fokuszok', 'fok_x');
ellenoriz(KR.normalizal(k).ajanlasok.fokuszok.ajanlott.length === 0 && KR.normalizal(k).ajanlasok.fokuszok.kizart.length === 0, 'fókusz nem zárható ki, csak ajánlható');
k = KR.beallit(KR.ajanlasValt(k, 'hatterek', 'hat_a'), 'kalandra_hivas.jatekosoknak', 'Városi nyomozók lesztek.');
let jr = KR.jatekosoknak(k);
ellenoriz(jr.bemutatas === 'Városi nyomozók lesztek.' && jr.szintsav.zaro === 10 && jr.ajanlasok.hatterek.ajanlott[0] === 'hat_a' && !jr.ajanlasok.fajok, 'játékosoknak szóló rész: bemutatás, szintsáv, nem üres ajánlások');
ellenoriz(!('veg' in jr) && !('keptar' in jr), 'a DM titkai nincsenek a játékosoknak szóló részben');
k = KR.beallit(KR.beallit(k, 'vilag_id', 'w1'), 'keptar', [{ nev: 'Hadnagy', szerep: 'hadnagy', njk_id: 'n1' }]);
k = KR.beallit(k, 'generator_kikapcsolt', { t1: [2, 1, 2] });
ellenoriz(KR.normalizal(k).generator_kikapcsolt.t1.join() === '1,2', 'kikapcsolt táblasorok rendezve, ismétlés nélkül');
const sa = KR.sablonAdat(k, 'Nyomozós keret');
ellenoriz(sa.nev === 'Nyomozós keret' && !('vilag_id' in sa.keret) && !('jatekosok' in sa.keret) && sa.keret.keptar[0].njk_id === '' && sa.keret.tema === 'Saját téma.', 'keret sablonként: a kampányhoz kötött részek nélkül');
const masik = KR.beallit(KR.beallit(KR.uresKeret(), 'vilag_id', 'w2'), 'tema', 'Régi');
const alk = KR.sablonAlkalmaz(masik, { id: 'el_sab', adat: sa });
ellenoriz(alk.tema === 'Saját téma.' && alk.vilag_id === 'w2' && alk.sablon_id === 'el_sab', 'sablon alkalmazása: a kampány világa marad');
ellenoriz(KR.LEPESEK.length === 9 && KR.KERET_PELDAK.length === 9 && KR.ALMUFAJOK.length === 9, 'a könyv lépései, keret-példái és alműfajai');

// ---------- Generátor ----------
const TABLAK = [
  { id: 't_bolt', nev_hu: 'Üzlettípus', reszletek: { kocka: '3d6', sorok: [
    { t: [3, 9], e: 'Szatócs', hivas: [{ tabla: 't_minoseg' }] },
    { t: [10, 16], e: 'Fogadó', hivas: [{ tabla: 't_fogado' }] },
    { t: [17, 18], e: 'Kettős profilú', hivas: [{ tabla: '', darab: 2, egyedi: true }] }
  ], kovetkezo: [{ tabla: 't_reszlet', darab: 'sarkany' }] } },
  { id: 't_reszlet', nev_hu: 'Üzletrészlet', reszletek: { kocka: 'd6d6', sorok: [
    { t: [[1, 3], [1, 6]], e: 'Zajos' }, { t: [[4, 6], [1, 3]], e: 'Csendes' }, { t: [[4, 6], [4, 6]], e: 'Félárú' }
  ] } },
  { id: 't_minoseg', nev_hu: 'Minőség', reszletek: { kocka: '3d6', sorok: [
    { t: [3, 9], e: 'Gyenge' }, { t: [10, 18], e: 'Jó, bónusz +{szam}', szam: { alap: 'sarkany', oszto: 2, kerekit: 'fel' } }
  ] } },
  { id: 't_fogado', nev_hu: 'Fogadó', reszletek: { kocka: '1d6', sorok: [{ t: [1, 3], e: 'Tiszta' }, { t: [4, 6], e: 'Poloskás' }] } },
  { id: 't_fegyver', nev_hu: 'Fegyvercsoport', reszletek: { kocka: 'd6d6', sorok: [
    { t: [[1, 1], [1, 3]], e: 'Fejsze' }, { t: [[1, 1], [4, 6]], e: 'Buzogány' }, { t: [[2, 5], [1, 6]], e: 'Kard' },
    { t: [[6, 6], [1, 4]], e: 'Ököl' }, { t: [[6, 6], [5, 5]], e: 'Gránát alapanyag' }, { t: [[6, 6], [6, 6]], e: 'Gránát' }
  ] } },
  { id: 't_kovacs', nev_hu: 'Fegyverkovács', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Fegyverkovács', hivas: [{ tabla: 't_fegyver', darab: '1d6' }] }] } },
  { id: 't_multi', nev_hu: 'Varázstulajdonság', reszletek: { kocka: '1d6', sorok: [
    { t: [1, 5], e: 'Bónusz' }, { t: [6, 6], e: 'Több', hivas: [{ tabla: '', darab: 2, sajat_ujra: true }] }
  ] } },
  { id: 't_hurok', nev_hu: 'Végtelen', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Újra', hivas: [{ tabla: 't_hurok' }] }] } }
];
const korny = (rng, kikapcsolt) => ({ tablak: TABLAK, rng, kikapcsolt });

ellenoriz(G.kockaDobas('3d6', kockak(2, 3, 5)).sarkany === 5 && G.kockaDobas('2d6', kockak(2, 3)).osszeg === 5 && G.kockaDobas('d3', kockak(5)).osszeg === 3, 'kockaformák: 3d6 sárkánykockával, 2d6, d3');
ellenoriz(G.sorIndex(TABLAK[4], [6, 5]) === 4 && G.sorIndex(TABLAK[4], [1, 4]) === 1 && G.sorIndex(TABLAK[4], [3, 2]) === 2, 'oszlopos tábla: oszloponként egy kocka dönt');
ellenoriz(G.tablaHibak(TABLAK[0], TABLAK).length === 0 && G.tablaHibak(TABLAK[4], TABLAK).length === 0, 'helyes táblák ellenőrzése');
ellenoriz(G.tablaHibak({ reszletek: { kocka: '2d6', sorok: [{ t: [2, 6], e: 'a' }, { t: [6, 11], e: 'b' }] } }, []).length === 2, 'lefedetlen és átfedő dobás jelezve');
ellenoriz(G.tablaHibak({ reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'a', hivas: [{ tabla: 'nincs' }] }] } }, TABLAK).length === 1, 'hiányzó hívott tábla jelezve');

// Szatócs (3+3+3 = 9, sárkánykocka 3): minőség (4+4+6 = 14 → Jó, bónusz +3 a saját sárkánykockából), majd 3 üzletrészlet
let fa = G.general('t_bolt', korny(kockak(3, 3, 3, 4, 4, 6, 1, 1, 5, 2, 5, 5)));
ellenoriz(fa.eredmeny === 'Szatócs' && fa.sarkany === 3, 'gyökér: üzlettípus, sárkánykocka');
ellenoriz(fa.hivasok[0].gyerekek[0].eredmeny === 'Jó, bónusz +3', 'láncolt dobás és {szam} a sárkánykockából (fele, felfelé kerekítve)');
ellenoriz(fa.hivasok[1].gyerekek.length === 3 && fa.hivasok[1].darab === 'sarkany', 'a tábla utáni dobások a sárkánykocka szerinti darabszámban');
ellenoriz(fa.hivasok[1].gyerekek.map((g) => g.eredmeny).join() === 'Zajos,Csendes,Félárú', 'oszlopos részlettábla dobásai');
const ered = G.eredmenyek(fa);
ellenoriz(ered.length === 5 && ered[0].melyseg === 0 && ered[1].melyseg === 1, 'eredmények listája mélységgel');
const jgy = G.jegyzet(fa);
ellenoriz(jgy.includes('Üzlettípus (3d6: 3+3+3 = 9 (sárkánykocka 3)): Szatócs') && jgy.includes('Üzletrészlet a sárkánykocka szerint 3×'), 'a dobás menete jegyzetként', jgy);
ellenoriz(G.eredmenySzoveg(fa).split('\n')[0] === 'Szatócs' && G.eredmenySzoveg(fa).includes('• Minőség: Jó, bónusz +3'), 'eredmény szövegként egy mezőbe');

// Kettős profilú: 6+6+6 → két további dobás ugyanezen a táblán, különbözők (egyedi)
fa = G.general('t_bolt', korny(kockak(6, 6, 6, 1, 1, 1, 1, 1, 1, 5, 5, 5, 3)));
const ketto = fa.hivasok[0].gyerekek;
ellenoriz(fa.eredmeny === 'Kettős profilú' && ketto.length === 2 && ketto[0].sor !== ketto[1].sor, 'kettős profil: két különböző eredmény újradobással');

// Darabszám kockával (1d6 = 2 fegyvercsoport)
fa = G.general('t_kovacs', korny(kockak(1, 2, 6, 6, 1, 2)));
ellenoriz(fa.hivasok[0].darabDobas.osszeg === 2 && fa.hivasok[0].gyerekek.map((g) => g.eredmeny).join() === 'Gránát,Fejsze', 'darabszám 1d6 dobással, gránát külön sora');

// Saját sor újradobása (a „több” sor nem jöhet ki újra a hívásban)
fa = G.general('t_multi', korny(kockak(6, 6, 6, 2, 6, 3)));
ellenoriz(fa.hivasok[0].gyerekek.every((g) => g.sor === 0), 'sajat_ujra: a hívó sor újradobva');

// Kikapcsolt sor: újradob
fa = G.general('t_fogado', korny(kockak(5, 2), { t_fogado: [1] }));
ellenoriz(fa.eredmeny === 'Tiszta' && fa.kikapcsoltUjra === 1, 'kampányban kikapcsolt sor esetén újradob');
fa = G.general('t_fogado', korny(kockak(5), { t_fogado: [0, 1] }));
ellenoriz(!!fa.figyelmeztetes, 'ha minden sor ki van kapcsolva, figyelmeztet');

// Hurok: mélységkorlát
fa = G.general('t_hurok', korny(kockak(1)));
let mely = 0;
G.bejar(fa, (cs, ut, m2) => { mely = Math.max(mely, m2); });
ellenoriz(mely === 6 && /Túl mély/.test(G.jegyzet(fa)), 'végtelen láncolás mélységkorláttal');
ellenoriz(G.general('nincs', korny(kockak(1))).hiba, 'ismeretlen tábla hibát ad');

// Újradobás, választás, elhagyás útvonal szerint
fa = G.general('t_bolt', korny(kockak(3, 3, 3, 4, 4, 6, 1, 1, 5, 2, 5, 5)));
let fa2 = G.ujradob(fa, [1, 0], korny(kockak(5, 5)));
ellenoriz(fa2.hivasok[1].gyerekek[0].eredmeny === 'Félárú' && fa.hivasok[1].gyerekek[0].eredmeny === 'Zajos', 'egy sor újradobása (az eredeti fa nem változik)');
fa2 = G.valaszt(fa, [], 1, korny(kockak(2, 1)));
ellenoriz(fa2.eredmeny === 'Fogadó' && fa2.kezi && fa2.hivasok[0].gyerekek[0].eredmeny === 'Tiszta' && fa2.hivasok[1].gyerekek.length === 0, 'választás a táblából: új láncolt dobások, kézi választásnál nincs sárkánykocka');
ellenoriz(G.dobasSzoveg(fa2) === 'választva', 'a kézi választás jelölve');
fa2 = G.valaszt(fa, [0, 0], 1, korny(kockak(1)));
ellenoriz(fa2.hivasok[0].gyerekek[0].eredmeny === 'Jó, bónusz +2', 'választott sor {szam} értéke a felső sárkánykockából');
fa2 = G.elhagy(fa, [1, 2]);
ellenoriz(fa2.hivasok[1].gyerekek.length === 2 && fa.hivasok[1].gyerekek.length === 3, 'egy dobás elhagyása');
ellenoriz(G.csomopont(fa, [1, 1]).eredmeny === 'Csendes', 'csomópont útvonal szerint');
const sl = G.sorLista(TABLAK[4], [5]);
ellenoriz(sl[0].tartomany === '1 / 1–3' && sl[5].kikapcsolt && !sl[0].kikapcsolt, 'sorok listája tartománnyal és kikapcsolással');
let kk = G.kikapcsolValt({}, 't1', 3);
kk = G.kikapcsolValt(kk, 't1', 1);
ellenoriz(kk.t1.join() === '1,3' && !G.kikapcsolValt(G.kikapcsolValt({}, 't1', 3), 't1', 3).t1, 'sor ki- és bekapcsolása');
ellenoriz(G.sorEsely(TABLAK[3], 0) === 50 && G.sorEsely(TABLAK[0], 2) === 1.9, 'sor esélye százalékban');

// ---------- Kalandok (2. fejezet) ----------
let szamlalo = 0;
const ujId = () => 'el_t' + (++szamlalo);
const kal = { id: 'k1', tipus: 'kaland', kampany_id: 'c1', vilag_id: '', alap_id: '', szulo_id: '', sorrend: 10, adat: { nev: 'A pestis', formatum: 'harom', iv: 'kezdo' } };
let reszek = KL.formatumReszek(kal, 'harom', [kal], ujId);
ellenoriz(reszek.length === 3 && reszek.every((r) => r.szulo_id === 'k1' && r.kampany_id === 'c1' && r.tipus === 'resz') && reszek[0].adat.formatum_resz === 'expozicio', 'három felvonás: három rész a kaland alatt');
ellenoriz(KL.formatumReszek(kal, 'ot', [kal].concat(reszek), ujId).length === 0, 'meglévő részeknél a formátum nem hoz újat');
ellenoriz(KL.formatumReszek(kal, 'ot', [kal], ujId).length === 5 && KL.formatumReszek(kal, 'szabad', [kal], ujId).length === 0, 'öt felvonás öt részt, a szabad formátum semmit');
const pp = KL.formatumReszek(kal, 'plotpont', [kal], ujId);
ellenoriz(pp.length === 1 && pp[0].adat.formatum_resz === 'lezaras', 'plot-point: a lezárás rész');
reszek[0].adat.utemek = [{ id: 'u1', szoveg: 'Pestis a városban' }, { id: 'u2', szoveg: 'Megbízás' }];
reszek[1].adat.utemek = [{ id: 'u3', szoveg: 'Őrök támadnak', jelenet_id: 'j1' }, { id: 'u4', szoveg: 'Nyom a fogadóban', kotetlen: true },
  { id: 'u5', szoveg: 'Nyom a kúriában', kotetlen: true }, { id: 'u6', szoveg: 'Nyom a szegényházban', kotetlen: true }, { id: 'u7', szoveg: 'Pihenő', szunet: true }];
reszek[2].adat.utemek = [{ id: 'u8', szoveg: 'Végső csata', nagy_csata: true }];
const jel = { id: 'j1', tipus: 'jelenet', kampany_id: 'c1', szulo_id: reszek[1].id, sorrend: 10, adat: { nev: 'Az őrök' } };
let kElemek = [kal].concat(reszek, [jel]);
let kix = E.index(kElemek);
const sor = KL.utemSor(kal, kElemek, kix);
ellenoriz(sor.map((x) => x.utem.id).join() === 'u1,u2,u3,u4,u5,u6,u7,u8', 'ütemsor a részek sorrendjében');
const cs = KL.utemCsoportok(sor);
ellenoriz(cs.length === 6 && cs[3].kotetlen && cs[3].utemek.join() === '3,4,5', 'a kötetlen ütemek egy csoportot alkotnak');
ellenoriz(KL.utemFigyelmeztetesek(sor).length === 1 && KL.utemFigyelmeztetesek(sor.slice(1)).length === 0, 'hat ütem pihenő nélkül figyelmeztet, öt még nem');
let ab = KL.alkalomBeosztas(sor, { alkalmak: 2, jelenet_alkalom: 4 });
ellenoriz(ab.becsult === 2 && ab.alkalmak[1].utemek.join() === '4,5,6,7' && ab.figyelmeztetesek.length === 1 && ab.figyelmeztetesek[0].index === 7, 'alkalmakra bontás: a nagy csata az alkalom végén figyelmeztet');
ab = KL.alkalomBeosztas(sor, { alkalmak: 1, jelenet_alkalom: 3 });
ellenoriz(ab.becsult === 3 && ab.figyelmeztetesek.some((f) => f.index === -1) && !ab.figyelmeztetesek.some((f) => f.index === 7), 'több alkalom kell, mint a terv; a csata nem a végén');
ellenoriz(KL.alkalomBeosztas(sor, {}).alkalmak.length === 0, 'jelenetszám nélkül nincs beosztás');
ellenoriz(KL.utemMozgat([1, 2, 3], 0, 1).join() === '2,1,3' && KL.utemMozgat([1, 2, 3], 0, -1).join() === '1,2,3', 'ütem mozgatása');
ellenoriz(KL.jelenetFelold('j1', kal, kElemek, kix) === jel && KL.kalandJelenetei(kal, kElemek, kix).length === 1, 'ütem jelenete a kaland fáján');
ellenoriz(KL.kalandja(jel, kix) === kal && KL.reszUtmutato(reszek[1], kal, kix).kulcs === 'bonyodalom', 'a jelenet kalandja, a rész útmutatója');
const osz = KL.kalandOsszegzes(kal, kElemek, kix);
ellenoriz(osz.reszek === 3 && osz.jelenetek === 1 && osz.utemek === 8, 'kaland összegzése');
// sablon kaland példányosítása részeivel és jeleneteivel
const sk = { id: 's_k', tipus: 'kaland', vilag_id: '', kampany_id: '', alap_id: '', szulo_id: '', adat: { nev: 'Sablon kaland', iv: 'gyakorlott' } };
const sr = { id: 's_r', tipus: 'resz', szulo_id: 's_k', sorrend: 10, adat: { nev: 'Rész', utemek: [{ id: 'x', szoveg: 'Ütem', jelenet_id: 's_j' }] } };
const sj = { id: 's_j', tipus: 'jelenet', szulo_id: 's_r', sorrend: 10, adat: { nev: 'Jelenet' } };
const sArch = { id: 's_a', tipus: 'jelenet', szulo_id: 's_r', sorrend: 20, aktiv: false, adat: { nev: 'Archivált' } };
const sablonElemek = [sk, sr, sj, sArch];
const pf = KL.peldanyFa(sk, sablonElemek, { kampany_id: 'c1', szulo_id: '', sorrend: 50 }, ujId);
ellenoriz(pf.length === 3 && pf[0].alap_id === 's_k' && pf[1].alap_id === 's_r' && pf[1].szulo_id === pf[0].id && pf[2].szulo_id === pf[1].id && pf.every((x) => x.kampany_id === 'c1'), 'példány a részeivel és jeleneteivel, az archivált nélkül');
const mind = sablonElemek.concat(pf);
const pix = E.index(mind);
ellenoriz(KL.jelenetFelold('s_j', pf[0], mind, pix) === pf[2], 'örökölt ütem jelenete a példány jelenetére oldódik');
ellenoriz(E.mezoErtek(pf[0], 'iv', pix).ertek === 'gyakorlott', 'a példány örökli az ívet');
const csop = KL.ivSzerint([kal, pf[0], { ...kal, id: 'k3', adat: { nev: 'Ív nélkül' } }], pix);
ellenoriz(csop[0].kalandok.length === 1 && csop[1].kalandok[0] === pf[0] && csop[5].iv === null && csop[5].kalandok.length === 1, 'kalandok ív szerint, ív nélküliek külön');
const tv = [{ id: 'a', sorrend: 10 }, { id: 'b', sorrend: 20 }, { id: 'c', sorrend: 20 }];
const sfa = KL.sablonFa(pf[0], mind, pix, ujId);
ellenoriz(sfa.length === 3 && sfa.every((x) => E.szint(x) === 'sablon' && !x.alap_id) && sfa[1].szulo_id === sfa[0].id && sfa[2].szulo_id === sfa[1].id
  && sfa[1].adat.utemek[0].jelenet_id === sfa[2].id && sfa[0].adat.iv === 'gyakorlott', 'sablon a kalandból a részeivel; az ütem a sablon jelenetére mutat');
const cs2 = KL.sorrendCsere(tv, 'c', -1);
ellenoriz(cs2.length === 1 && cs2[0].id === 'b' && cs2[0].sorrend === 30 && KL.sorrendCsere(tv, 'a', 1).length === 3 && KL.sorrendCsere(tv, 'a', -1).length === 0, 'sorrendcsere a testvérek közt');
ellenoriz(KL.ellenfelNorm({ terv: [{ szoveg: 'x' }] }).terv[0].id === 'tl1' && KL.njkkNorm([{ szerep: 'rossz' }])[0].szerep === 'segito' && KL.hosszNorm({ alkalmak: '3' }).alkalmak === 3, 'mezők normalizálása');
const la = KL.lepesAllapot({ formatum: 'harom', konfliktus: 'x', utemek: [{ szoveg: 'a' }] });
ellenoriz(la.hasznalat === 'resz' && la.tortenet === 'resz' && la.utemek === 'kesz' && la.otlet === 'ures', 'a lépések kitöltöttsége');

// ---------- Jelenetek (5.3) ----------
{
  const j1 = { id: 'j1', tipus: 'jelenet', kampany_id: 'c1', alap_id: '', szulo_id: 'kx', sorrend: 10, adat: { nev: 'Híd', tipusok: ['harc'], nagy_csata: true, osszecsapas_id: 'o_1' } };
  const j2 = { id: 'j2', tipus: 'jelenet', kampany_id: 'c1', alap_id: '', szulo_id: 'kx', sorrend: 20, adat: { nev: 'Alku', tipusok: ['harc', 'szerepjatek', 'rossz'] } };
  const j3 = { id: 'j3', tipus: 'jelenet', kampany_id: 'c1', alap_id: '', szulo_id: 'kx', sorrend: 30, adat: { nev: 'Üres' } };
  const j4 = { id: 'j4', tipus: 'jelenet', kampany_id: 'c1', alap_id: '', szulo_id: 'kx', sorrend: 40, adat: { tipusok: ['felfedezes'] } };
  const kx = { id: 'kx', tipus: 'kaland', kampany_id: 'c1', alap_id: '', szulo_id: '', adat: { nev: 'K', utemek: [{ szoveg: 'a', jelenet_id: 'j1' }, { szoveg: 'b' }, { szoveg: 'c', jelenet_id: 'j2' }] } };
  const je = [kx, j1, j2, j3, j4];
  const jix = E.index(je);
  ellenoriz(JL.tipusokOf(j2.adat).join(',') === 'harc,szerepjatek' && JL.tipusFelirat(['harc', 'szerepjatek']) === 'Harc + Szerepjáték (vegyes)' && JL.tipusFelirat([]) === '', 'típusok: az ismeretlen kimarad, a vegyes felirata');
  const ar = JL.tipusArany(KL.kalandJelenetei(kx, je, jix), jix);
  ellenoriz(ar.db === 4 && ar.tipizalt === 3 && ar.vegyes === 1 && ar.szamok.harc === 2 && Math.abs(ar.sulyok.harc - 1.5) < 1e-9 && ar.szazalek.harc === 50 && ar.szazalek.felfedezes === 33, 'jelenettípusok aránya, a vegyes jelenet súlya megoszlik', ar);
  const ov = JL.kihivasOsszevetes(ar, { kihivasok: { harc: 2, felfedezes: 1, szerepjatek: 1 } });
  ellenoriz(ov.length === 3 && ov[0].terv === 50 && ov[0].teny === 50 && ov[2].teny === 17 && ov[2].elteres === 17 - 25, 'tervezett és tényleges arány a kampánykeret kihívásaihoz', ov);
  ellenoriz(JL.kihivasOsszevetes(JL.tipusArany([], jix), {}).length === 0, 'típus nélkül nincs összevetés');
  const egy = JL.egyhanguSorok([j1, j1, { ...j4, adat: { tipusok: ['harc'] } }, j4], jix);
  ellenoriz(egy.length === 1 && egy[0].db === 3 && egy[0].tol === 0, 'három egymás utáni harc jelzés', egy);
  ellenoriz(JL.egyhanguSorok([j1, j2, j1, j3, j3, j3], jix).length === 0, 'vegyes és típus nélküli jelenet megszakítja a sort');
  const sor = JL.utemSorJelenettel(KL.utemSor(kx, je, jix), kx, je, jix);
  ellenoriz(sor[0].utem.nagy_csata && sor[0].utem.jelenet_csata && !sor[1].utem.nagy_csata && !sor[2].utem.nagy_csata, 'a nagy csata jelenet ütemét a beosztás nagy csatának látja');
  const beo = KL.alkalomBeosztas(sor, { jelenet_alkalom: 1 });
  ellenoriz(beo.alkalmak.length === 3 && beo.figyelmeztetesek.length === 0, 'egy jelenet alkalmanként: nincs „alkalom végére esik” figyelmeztetés');
  const beo2 = KL.alkalomBeosztas([sor[1], sor[0]], { jelenet_alkalom: 2 });
  ellenoriz(beo2.figyelmeztetesek.length === 1, 'a jelenet nagy csatája az alkalom végén figyelmeztet');
  const p = JL.probaNorm({ tulajdonsag: 'tul_perception', fokuszok: ['fok_x', ''], celertek: 13, cimzettek: ['c'], modositok: { c: 2 } }, 0);
  ellenoriz(p.id === 'pr1' && p.tipus === 'alap' && p.fokuszok.length === 1 && p.celertek_rejtett === true && p.mutatvany_engedett === true && p.cimzettek === undefined && p.modositok === undefined, 'előkészített próba: a próbakérés mezői, címzettek nélkül');
  const u = JL.probaUrlap(p);
  ellenoriz(u.cimzettek === 'mindenki' && u.celertek === 13 && u.tulajdonsag === 'tul_perception' && JL.urlapbolProba({ ...u, celertek: 15 }, 'pr9', 'a kapunál').celertek === 15, 'próba ↔ űrlap oda-vissza');
  const os = JL.probaOsszegzes({ tulajdonsag: 'tul_perception', fokuszok: ['fok_x'], celertek: 13 }, () => 'Keresés');
  ellenoriz(os.cim === 'Észlelés (Keresés)' && os.feltetel.includes('Célérték 13') && os.feltetel.includes('rejtett'), 'a próba összegzése', os);
  ellenoriz(JL.probaOsszegzes({ tipus: 'ellen', tulajdonsag: 'tul_strength', ellenfel_nev: 'Őr', ellenfel_bonusz: 3 }).feltetel === 'Ellenfél: Őr (+3)', 'ellenpróba összegzése');
  const fig = JL.figyelmeztetesek({ konfliktusok: [{ cel: 'át a hídon', akadaly: 'őrök' }], megoldasok: [{ mod: 'harc' }], tipusok: ['felfedezes'] });
  ellenoriz(fig.some((f) => f.lepes === 'megoldas') && fig.some((f) => f.lepes === 'konfliktus') && fig.some((f) => f.lepes === 'terkep'), 'figyelmeztetések: egy megoldás, hiányzó „miért”, térkép nélküli felfedezés', fig);
  ellenoriz(JL.figyelmeztetesek({ konfliktusok: [{ cel: 'x', akadaly: 'y', miert: 'z' }], megoldasok: [{ mod: 'harc' }, { mod: 'megvesztegetés' }] }).length === 0, 'két megoldással, „miért”-tel nincs figyelmeztetés');
  ellenoriz(JL.figyelmeztetesek({ kepek: [{ kep: 'f1', terkep: true }], tipusok: ['felfedezes'] }).length === 0, 'térképpel nincs térkép-figyelmeztetés');
  ellenoriz(JL.kepekNorm([{ kep: 'a', cim: 'x' }, { cim: 'nincs fájl' }]).length === 1 && JL.kepekNorm([{ kep: 'a' }])[0].belyeg === 'a', 'képek normalizálása');
  ellenoriz(JL.jelenetXp({ nehezseg: 'kozepes' }) === 250 && JL.jelenetXp({}) === null && JL.becslesbolNehezseg('Nagyon nehéz') === 'nehez' && JL.becslesbolNehezseg('Átlagos') === 'kozepes', 'XP a nehézségből, a becslés fordítása');
  const la = JL.lepesAllapot({ tipusok: ['harc'], konfliktusok: [{ cel: 'a', akadaly: 'b' }], osszecsapas_id: 'o', tet: 'x' });
  ellenoriz(la.tipus === 'kesz' && la.konfliktus === 'resz' && la.kihivasok === 'kesz' && la.hely === 'resz' && la.terkep === 'ures', 'a jelenet lépéseinek kitöltöttsége', la);
  const sj = E.sablonbol(j1, jix, 's_j1');
  ellenoriz(sj.adat.osszecsapas_id === undefined && sj.adat.nagy_csata === true, 'a sablonba a kampány összecsapása nem kerül át');
  const sfj = KL.sablonFa(kx, je, jix, (() => { let n = 0; return () => 'sf' + (++n); })());
  ellenoriz(sfj.filter((x) => x.tipus === 'jelenet').every((x) => x.adat.osszecsapas_id === undefined), 'a részfa sablonjában sem');
}

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
