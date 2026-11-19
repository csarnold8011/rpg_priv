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
import * as HS from '../../web/js/kampany/helyszin.js';
import * as B from '../../web/js/kampany/bolt.js';
import * as SZ from '../../web/js/kampany/szereplo.js';
import * as J from '../../web/js/kampany/jutalom.js';
import * as IS from '../../web/js/kampany/isteni.js';
import fs from 'fs';

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
ellenoriz(KR.LEPESEK.length === 10 && KR.KERET_PELDAK.length === 9 && KR.ALMUFAJOK.length === 9, 'a könyv lépései, keret-példái és alműfajai');

// ---------- Alműfajok (9. fejezet): választható szabályok, ajánlás ----------
ellenoriz(KR.VALASZTHATO_SZABALYOK.length === 7 && KR.VALASZTHATO_SZABALYOK.every((s) => s.leiras && s.almufaj_szoveg && s.oldal && s.almufajok.every((a) => KR.ALMUFAJOK.some((x) => x.id === a))),
  'a hét választható szabály leírással, oldallal, létező alműfajokkal');
ellenoriz(KR.ajanlottSzabalyok({}).length === 0, 'alműfaj nélkül nincs ajánlás');
ellenoriz(KR.ajanlottSzabalyok({ almufajok: ['horror'] }).join() === 'sulyos_sebek,egeszseg_minden,romlast_hozo_hatalom,nyomozasi_mutatvanyok', 'horror: a könyv szerinti szabályok');
ellenoriz(KR.ajanlottSzabalyok({ almufajok: ['kard_magia'] }).length === 0, 'kard és mágia: nincs ajánlott szabály');
const kev = KR.ajanlottSzabalyok({ almufajok: ['harcmuveszet', 'varosi'] });
ellenoriz(kev.includes('filmszeru_akrobatika') && kev.includes('atnevezes') && kev.includes('nyomozasi_mutatvanyok') && !kev.includes('sulyos_sebek'), 'keverék: bármelyik elem alműfaja ajánl');
ellenoriz(KR.szabalyAjanlott({ stilus: 'horror' }, 'egeszseg_minden') && !KR.szabalyAjanlott({ stilus: 'magas' }, 'egeszseg_minden'), 'az Alapkönyv horror stílusa is ajánl');
ellenoriz(!KR.szabalyAjanlott({ almufajok: ['horror'] }, 'nincs_ilyen') && KR.keretAlmufajai({ almufajok: ['horror', 'ismeretlen'] }).join() === 'horror', 'ismeretlen szabály és alműfaj kiesik');
let ka = KR.beallit(KR.uresKeret(), 'szabalyok.atnevezes', true);
ka = KR.beallit(ka, 'atnevezes_hiba', 1);
ka = KR.normalizal(KR.beallit(ka, 'atnevezesek', 'Harcos = szamuráj'));
ellenoriz(ka.szabalyok.atnevezes === true && ka.atnevezesek === 'Harcos = szamuráj' && ka.atnevezes_hiba === undefined && ka.szabalyok.nyomozasi_mutatvanyok === undefined,
  'tárolás: jelölés és névlista a keretben, a beállítással kezelt szabály nem');
ellenoriz(KR.lepesAllapot({ atnevezesek: 'x' }, []).szabalyok === 'kesz' && KR.lepesAllapot({}, []).szabalyok === 'ures', 'a lépés állapota a névlistát is nézi');
const kaS = KR.sablonAdat(ka, 'Szamurájos');
const kaA = KR.sablonAlkalmaz(KR.uresKeret(), { id: 's9', adat: kaS });
ellenoriz(kaA.szabalyok.atnevezes === true && kaA.atnevezesek === 'Harcos = szamuráj', 'sablonba átvitel: a szabályok és az átnevezések megmaradnak');

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

// ---------- 5.4: helyszínek, földrajz, boltgenerátor ----------
{
  const reg = { id: 'h_r', tipus: 'helyszin', vilag_id: 'w1', kampany_id: '', alap_id: '', szulo_id: '', sorrend: 0, adat: { nev: 'Partvidék', fajta: 'regio', arszorzo: 120 } };
  const varos = { id: 'h_v', tipus: 'helyszin', vilag_id: 'w1', kampany_id: '', alap_id: '', szulo_id: 'h_r', sorrend: 0, adat: { nev: 'Kikötőváros', fajta: 'telepules' } };
  const bolt = { id: 'h_b', tipus: 'helyszin', vilag_id: 'w1', kampany_id: '', alap_id: '', szulo_id: 'h_v', sorrend: 0, adat: { nev: 'Vasbolt', fajta: 'uzlet' } };
  const kbolt = { id: 'h_kb', tipus: 'helyszin', vilag_id: '', kampany_id: 'c1', alap_id: 'h_b', szulo_id: 'h_v', sorrend: 1, adat: { arszint: 150 } };
  const hel = [reg, varos, bolt, kbolt];
  const hix = E.index(hel);
  const megj = (e) => E.megjelenitett(e, hix);
  ellenoriz(HS.fajtaOf({}) === 'hely' && HS.fajtaOf({ fajta: 'orszag' }) === 'orszag', 'a helyszín fajtája, alapból hely');
  ellenoriz(HS.lepesKulcsok({ fajta: 'uzlet' }).slice(0, 3).join() === 'fajta,bolt,kinalat' && HS.lepesKulcsok({ fajta: 'orszag' }).includes('orszag') && !HS.lepesKulcsok({}).includes('bolt'), 'a lépések a fajta szerint');
  const fa = HS.foldrajziFa(hel, hix);
  ellenoriz(fa.length === 1 && fa[0].gyerekek[0].gyerekek.length === 2, 'földrajzi fa: régió, város, két bolt', fa.length);
  ellenoriz(HS.osok(bolt, hix).map((x) => x.id).join() === 'h_r,h_v', 'a bolt ősei');
  ellenoriz(HS.legkozelebbi(bolt, hix, megj, ['telepules']).id === 'h_v', 'a bolt települése');
  ellenoriz(HS.uzletei(reg, hel, megj).length === 2, 'a régió üzletei');
  ellenoriz(B.arszorzo(bolt, hix, megj, null).szazalek === 120, 'árszorzó a régióból öröklődik');
  ellenoriz(B.arszorzo(reg, hix, megj, { adat: { arszorzo: 90 } }).szazalek === 90 && B.arszorzo(reg, hix, megj, null).szazalek === 100, 'árszorzó a világból, különben 100');
  ellenoriz(HS.figyelmeztetesek({ fajta: 'orszag' }, { fajta: 'telepules' }).some((f) => f.lepes === 'fajta'), 'ország település alatt: figyelmeztet');
  ellenoriz(HS.figyelmeztetesek({ titkok: 'x', szereplok: [{ nev: 'a' }, { nev: 'b' }] }).some((f) => f.lepes === 'lakok'), 'két szereplő konfliktus nélkül: figyelmeztet');
  ellenoriz(HS.figyelmeztetesek({}).some((f) => /titka/.test(f.szoveg)), 'titok nélküli helyszín: figyelmeztet');
  const la = HS.lepesAllapot({ koncepcio: 'rom', titkok: 't', lakok: [{ nev: 'tolvajok' }], uzlet_tipusok: ['szabo'] });
  ellenoriz(la.koncepcio === 'kesz' && la.lakok === 'resz' && la.bolt === 'kesz' && la.tortenet === 'ures', 'a helyszín lépéseinek kitöltöttsége', la);
  ellenoriz(HS.mutatvanyokNorm([{ nev: 'Omlás', ar: 9 }])[0].ar === 6 && HS.korulmenyekNorm([{ mire: 'zsebtolvajlás', modosito: '2' }])[0].modosito === 2, 'helyszín-mutatványok és körülményi módosítók normalizálása');
  ellenoriz(HS.ittTortenik('h_v', [{ id: 'k', tipus: 'itt_tortenik', honnan: 'j1', hova: 'h_v' }]).join() === 'j1', 'itt történik: a helyszín jelenetei');

  // kitalált mini szabályadat (nem a könyv tételei)
  const lapok = {
    Felszerelés: [
      { id: 'fel_a', nev_hu: 'Kabát', nev_en: 'Coat', kategoria: 'Ruházat', reszletek: { ar_rez: 100 } },
      { id: 'fel_b', nev_hu: 'Kalap', nev_en: 'Hat', kategoria: 'Ruházat', reszletek: { ar_rez: 30 } },
      { id: 'fel_c', nev_hu: 'Szoba', nev_en: 'Lodging (night)', kategoria: 'Étel és szállás', reszletek: { ar_rez: 20 } },
      { id: 'fel_d', nev_hu: 'Leves', nev_en: 'Meal (soup)', kategoria: 'Étel és szállás', reszletek: { ar_rez: 5 } },
      { id: 'fel_e', nev_hu: 'Kenyér', nev_en: 'Bread', kategoria: 'Étel és szállás', ar: '5 réz' }
    ],
    Páncélok: [
      { id: 'pan_light_leather', nev_hu: 'K. bőr', reszletek: { tipus: 'pancel', ar_rez: 150 } }, { id: 'pan_heavy_leather', nev_hu: 'N. bőr', reszletek: { tipus: 'pancel', ar_rez: 300 } },
      { id: 'pan_light_mail', nev_hu: 'K. sodrony', reszletek: { tipus: 'pancel', ar_rez: 500 } }, { id: 'pan_light_shield', nev_hu: 'K. pajzs', reszletek: { tipus: 'pajzs', ar_rez: 150 } },
      { id: 'pan_medium_shield', nev_hu: 'Ip. pajzs', reszletek: { tipus: 'pajzs', ar_rez: 300 } }
    ],
    Fegyverek: [
      { id: 'fgy_1', nev_hu: 'Fejsze 1', csoport: 'fcs_axes', reszletek: { ar_rez: 100 } }, { id: 'fgy_2', nev_hu: 'Fejsze 2', csoport: 'fcs_axes', reszletek: { ar_rez: 140 } },
      { id: 'fgy_3', nev_hu: 'Fejsze 3', csoport: 'fcs_axes', reszletek: { ar_rez: 200 } }, { id: 'fgy_g', nev_hu: 'Fiola', csoport: null, reszletek: { tipus: 'granat', ar_rez: 90 } }
    ],
    Fegyvercsoportok: [{ id: 'fcs_axes', nev_hu: 'Fejszék' }]
  };
  ellenoriz(B.listaAr(lapok.Felszerelés[4]) === 5 && B.listaAr(lapok.Felszerelés[0]) === 100, 'listaár az ar_rez-ből vagy az ár szövegéből');
  const pk = { uzlet_tipusok: ['pancelkovacs'], pancel_max: 'pan_heavy_leather', pajzs_max: 'pan_light_shield' };
  const pf = B.forrasok(pk, lapok);
  ellenoriz(pf.find((f) => f.kulcs === 'Páncélok:pancel').sorok.length === 2 && pf.find((f) => f.kulcs === 'Páncélok:pajzs').sorok.length === 1, 'páncélkovács: a kidobott és minden alatta');
  ellenoriz(B.forrasok({ uzlet_tipusok: ['kocsma'] }, lapok)[0].sorok.map((s) => s.id).join() === 'fel_d,fel_e', 'kocsma: étel szállás nélkül');
  ellenoriz(B.forrasok({ uzlet_tipusok: ['elelmiszer'] }, lapok)[0].sorok.map((s) => s.id).join() === 'fel_e', 'élelmiszerbolt: kész étel és szállás nélkül');
  ellenoriz(B.forrasok({ uzlet_tipusok: ['szabo', 'kocsma'] }, lapok).length === 2, 'kettős profil: két forrás');
  ellenoriz(B.forrasok({ sajat_kategoriak: ['Fegyverek:fcs_axes', 'Felszerelés:Ruházat'] }, lapok).length === 2, 'saját bolttípus kategóriákból');
  const fk = { uzlet_tipusok: ['fegyverkovacs'], fegyvercsoportok: ['fcs_axes'], granat: 'granat', boseg: 'teljes' };
  ellenoriz(B.forrasok(fk, lapok).map((f) => f.kulcs).join() === 'Fegyverek:fcs_axes,Fegyverek:granat', 'fegyverkovács: csoportok és gránát');
  let k = B.kinalatGeneral(fk, lapok, { rng: kockak(3, 4, 5) });
  ellenoriz(k.length === 4 && k.every((t) => t.darab >= 1), 'teljes kínálat: minden tétel darabszámmal', k.length);
  k = B.kinalatGeneral({ ...fk, fegyverek_konkret: true }, lapok, { rng: kockak(5) });
  ellenoriz(k.filter((t) => t.forras === 'Fegyverek:fcs_axes').length === 1 && k.find((t) => t.forras === 'Fegyverek:fcs_axes').tetel === 'fgy_3', 'konkrét fegyver: d3 a csoportból (5 → 3.)');
  k = B.kinalatGeneral({ uzlet_tipusok: ['fegyverkovacs'], granat: 'granat_alapanyag' }, lapok, { rng: kockak(2) });
  ellenoriz(k.length === 1 && k[0].forras === 'egyedi' && /alapanyag/.test(k[0].nev), 'gránát-alapanyag egyedi tételként');
  const szk = B.kinalatGeneral({ uzlet_tipusok: ['szabo'], boseg: 'szukos' }, lapok, { rng: kockak(6) });
  ellenoriz(szk.length === 1, 'szűkös kínálat: legalább egy tétel marad', szk.length);
  ellenoriz(B.alacsonyKeszlet(kockak(2, 2, 5)) === 5 && B.alacsonyKeszlet(kockak(1, 2, 3)) === 0, 'alacsony készlet: dupla nélkül elfogyott, duplánál a sárkánykocka');
  const regiK = { uzlet_tipusok: ['szabo', 'pancelkovacs'], pancel_max: 'pan_light_leather', boseg: 'teljes',
    kinalat: [{ id: 'x1', forras: 'egyedi', nev: 'Ezüst bross', lista_rez: 400 }, { id: 'x2', forras: 'Felszerelés:Ruházat', tetel: 'fel_a' }] };
  const uj1 = B.kinalatGeneral(regiK, lapok, { rng: kockak(3), csakForras: 'Páncélok:pancel' });
  ellenoriz(uj1.some((t) => t.id === 'x1') && uj1.some((t) => t.id === 'x2') && uj1.filter((t) => t.forras === 'Páncélok:pancel').length === 1, 'egy forrás újragenerálása a többit megtartja');
  const uj2 = B.kinalatGeneral(regiK, lapok, { rng: kockak(3) });
  ellenoriz(uj2.some((t) => t.id === 'x1') && !uj2.some((t) => t.id === 'x2'), 'teljes újragenerálás: az egyedi tétel marad');
  ellenoriz(B.boltAr(100, { arszint: 150 }, 120) === 180 && B.boltAr(100, { arszint: 150, uzlet_reszletek: [{ hatas: 'felar' }] }, 100) === 50, 'ár: listaár × szorzó × árszint; félárú részlet');
  ellenoriz(B.boltAr(1, { arszint: 50 }) === 1 && B.boltAr(null, {}) === null, 'legalább 1 réz; ár nélkül nincs ár');
  const ta = B.tetelAr({ tetel: 'fel_a' }, { arszint: 100, uzlet_reszletek: [{ hatas: 'csapat_kedvezmeny', szazalek: 25 }] }, 100, lapok);
  ellenoriz(ta.ar === 100 && ta.csapat === 75 && !ta.kezi, 'csapatkedvezmény 25%');
  ellenoriz(B.tetelAr({ tetel: 'fel_a', ar_rez: 77 }, { arszint: 300 }, 100, lapok).ar === 77, 'kézi ár nyer');
  ellenoriz(B.tetelAr({ tetel: '', nev: 'Bross', lista_rez: 400 }, { arszint: 50 }, 100, lapok).ar === 200, 'egyedi tétel listaárral');
  ellenoriz(B.felvasarlasAr(100, {}) === 25 && B.felvasarlasAr(100, { felvasarlas: 40 }) === 40, 'felvásárlás: alapból 25%');

  // a dt_uzlet szerkezetű, kitalált táblák generátorfájából a bolt mezői
  const T = [
    { id: 'dt_uzlet', nev_hu: 'Ü', reszletek: { kocka: '1d6', sorok: [
      { t: [1, 3], e: 'Páncél', ertek: { uzlet: 'pancelkovacs' }, hivas: [{ tabla: 'dt_pancel' }, { tabla: 'dt_pajzs' }, { tabla: 'dt_kidolgozottsag' }, { tabla: 'dt_arszint' }] },
      { t: [4, 6], e: 'Kettős', ertek: { uzlet: 'kettos' }, hivas: [{ tabla: 'dt_uzlet_alap', darab: 2, egyedi: true }, { tabla: 'dt_arszint' }] }
    ], kovetkezo: [{ tabla: 'dt_uzlet_reszlet', darab: 2 }] } },
    { id: 'dt_uzlet_alap', nev_hu: 'Üa', reszletek: { kocka: '1d6', sorok: [{ t: [1, 3], e: 'Szabó', ertek: { uzlet: 'szabo' } }, { t: [4, 6], e: 'Fogadó', ertek: { uzlet: 'fogado' }, hivas: [{ tabla: 'dt_fogado' }] }] } },
    { id: 'dt_fogado', nev_hu: 'F', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Medence' }] } },
    { id: 'dt_pancel', nev_hu: 'P', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'nb', ertek: { pancel: 'pan_heavy_leather' } }] } },
    { id: 'dt_pajzs', nev_hu: 'Pj', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'nincs', ertek: { pajzs: '' } }] } },
    { id: 'dt_kidolgozottsag', nev_hu: 'K', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'finom', ertek: { minoseg: 'finom' } }] } },
    { id: 'dt_arszint', nev_hu: 'A', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: '125%', ertek: { szazalek: 125 } }] } },
    { id: 'dt_uzlet_reszlet', nev_hu: 'R', reszletek: { kocka: '1d6', sorok: [{ t: [1, 3], e: 'Féláras', ertek: { hatas: 'felar' } }, { t: [4, 6], e: 'Mágikus', ertek: { hatas: 'magikus' } }] } }
  ];
  const f1 = G.general('dt_uzlet', { tablak: T, rng: kockak(2, 1, 1, 1, 1, 2, 5) });
  const b1 = B.fabolBolt(f1);
  ellenoriz(b1.uzlet_tipusok.join() === 'pancelkovacs' && b1.pancel_max === 'pan_heavy_leather' && b1.pajzs_max === '' && b1.kidolgozottsag === 'finom' && b1.arszint === 125, 'a dobásból: típus, páncél, pajzs, kidolgozottság, árszint', b1);
  ellenoriz(b1.uzlet_reszletek.length === 2 && b1.magikus_db === 1 && B.ervenyesArszint(b1) === 50, 'üzletrészletek hatással: félár és mágikus kínálat', b1.uzlet_reszletek);
  const f2 = G.general('dt_uzlet', { tablak: T, rng: kockak(5, 1, 5, 1, 1, 1, 1) });
  const b2 = B.fabolBolt(f2);
  ellenoriz(b2.uzlet_tipusok.join() === 'szabo,fogado' && b2.uzlet_reszletek.some((r) => /^Fogadó: /.test(r.e)), 'kettős profil: két típus, a fogadó részlete is', b2);
  ellenoriz(B.tipusFelirat(b2) === 'Szabó és Fogadó' && B.osszefoglalo(b2).includes('árszint ' + B.ervenyesArszint(b2) + '%'), 'a bolt felirata és összefoglalója');
  ellenoriz(B.figyelmeztetesek({ uzlet_tipusok: ['pancelkovacs'] }).some((x) => /újra/.test(x)) && B.figyelmeztetesek({}).length === 1, 'bolt figyelmeztetések');
  ellenoriz(B.fizikai({ uzlet_tipusok: ['kocsma'] }) === false && B.fizikai({ uzlet_tipusok: ['kocsma', 'szabo'] }) === true, 'fizikai árut árul-e');
  const sab = E.sablonbol(kbolt, hix, 's_b');
  ellenoriz(sab.adat.fajta === 'uzlet' && sab.adat.arszint === 150, 'boltból sablon (saját bolttípus mentése)');
  // a generátor bővítései
  const T2 = [{ id: 't', nev_hu: 't', reszletek: { kocka: '1d6', sorok: [{ t: [1, 5], e: 'x {szam}', szam: { alap: '1d6', plusz: -1 } },
    { t: 6, e: 'sok', hivas: [{ tabla: '', darab: 'd3', darab_plusz: 1, sajat_ujra: true }] }] } }];
  ellenoriz(G.general('t', { tablak: T2, rng: kockak(1, 1) }).eredmeny === 'x 0', 'szám mínusz eggyel (1d6−1)');
  const g6 = G.general('t', { tablak: T2, rng: kockak(6, 2, 1, 1, 1) });
  ellenoriz(g6.hivasok[0].gyerekek.length === 2 && /d3\+1 = 2×/.test(G.jegyzet(g6)), 'darab d3+1', G.jegyzet(g6));
}

// ---------- 5.5: szereplők ----------
{
  // a mezőlista azonos a háttérével
  const gs = fs.readFileSync(new URL('../../backend/Njk.gs', import.meta.url), 'utf8');
  const mezok = gs.match(/const NJK_SZEREPLO_MEZOK = \[([^\]]*)\]/)[1].match(/'([a-z_]+)'/g).map((x) => x.slice(1, -1));
  ellenoriz(JSON.stringify(mezok) === JSON.stringify(SZ.SZEREPLO_MEZOK), 'a szereplő mezői a háttérben ugyanazok', mezok);
  const elotag = gs.match(/const NJK_OROKOLHETO = \[([^\]]*)\]/)[1].match(/'([a-z_.]+)'/g).map((x) => x.slice(1, -1));
  ellenoriz(JSON.stringify(elotag.concat(mezok.map((m) => 'adat.szereplo.' + m))) === JSON.stringify(SZ.OROKOLHETO), 'az örökölhető mezők a háttérben ugyanazok');

  const s = { id: 'n_s', nev: 'Kalmár', fajta: 'rovid', adat: { sablon: true, statblokk: { tulajdonsagok: { tul_communication: 2 } }, szerep: { koncepcio: 'Kalmár', kep: { kep: 'k1' } }, szereplo: { szerepek: ['szemlelo'], cel: 'haszon' } } };
  const v = { id: 'n_v', nev: 'Bodor', fajta: 'rovid', vilag_id: 'w1', alap_id: 'n_s', adat: { statblokk: { tulajdonsagok: { tul_communication: 2 } }, szerep: { koncepcio: 'Kalmár' }, szereplo: { szerepek: ['szemlelo'], cel: 'haszon' } } };
  const k = { id: 'n_k', nev: 'Bodor', fajta: 'rovid', alap_id: 'n_v', kampanyok: ['c1'], adat: { szerep: {}, szereplo: {} } };
  const ix = new Map([s, v, k].map((x) => [x.id, x]));
  ellenoriz(SZ.njkSzint(s) === 'sablon' && SZ.njkSzint(v) === 'vilag' && SZ.njkSzint(k) === 'szabad', 'szintek: sablon, világ, szabad');
  ellenoriz(JSON.stringify(SZ.felulirasok(v, s)) === JSON.stringify(['nev']), 'a világ-NJK csak a nevet írja felül');
  const kf = SZ.feloldas(k, v, []);
  ellenoriz(kf.nev === 'Bodor' && kf.adat.szereplo.cel === 'haszon' && kf.adat.statblokk.tulajdonsagok.tul_communication === 2 && kf.adat.felulirt.length === 0, 'feloldás: minden az alapból jön');
  const k2 = SZ.utBeallit(kf, 'adat.szereplo.cel', 'bosszú');
  ellenoriz(JSON.stringify(SZ.felulirasok(k2, v)) === JSON.stringify(['adat.szereplo.cel']), 'egy mező felülírása');
  const info = SZ.mezoInfo(k2, 'adat.szereplo.cel', v);
  ellenoriz(info.sajat && info.orokolt === 'haszon' && info.honnan === 'vilag', 'mezőinfo: saját, örökölt érték és forrás');
  const k3 = SZ.visszaallit({ ...k2, adat: { ...k2.adat, felulirt: ['adat.szereplo.cel'] } }, 'adat.szereplo.cel', v);
  ellenoriz(k3.adat.szereplo.cel === 'haszon' && !k3.adat.felulirt.length, 'visszaállítás az örököltre');
  ellenoriz(SZ.azonos(undefined, '') && SZ.azonos([], undefined) && !SZ.azonos('a', ''), 'az üres értékek egyformák');
  ellenoriz(SZ.lanc(k, ix).map((x) => x.id).join() === 'n_k,n_v,n_s', 'az alapok lánca');
  ellenoriz(!!SZ.alapHiba(v, k, ix) && !!SZ.alapHiba(s, v, ix) && !SZ.alapHiba(k, s, ix), 'szintszabályok: világ nem épül kampányra, sablon csak sablonra');
  ellenoriz(!!SZ.alapHiba({ ...s, alap_id: '' }, { id: 'n_x', alap_id: 'n_s', adat: { sablon: true } }, new Map([['n_s', s]])) , 'kör nem lehet');
  ellenoriz(SZ.alapJeloltek(k, [s, v, k], ix).map((x) => x.id).join() === 'n_s,n_v', 'jelöltek: előbb a sablon, aztán a világ');
  const p = SZ.peldany(v, { kampanyok: ['c1'], nev: 'Bodor, az öreg' });
  ellenoriz(p.alap_id === 'n_v' && p.nev === 'Bodor, az öreg' && p.adat.felulirt.join() === 'nev' && p.adat.szerep.kep === null && !p.vilag_id, 'példány: saját névvel, kép nélkül');
  const sb = SZ.sablonbol({ ...v, adat: { ...v.adat, allapot: { egeszseg: 3 } } });
  ellenoriz(sb.sablon && !sb.alap_id && !sb.kampanyok.length && !Object.keys(sb.adat.allapot).length, 'sablon bármelyikből, állapot nélkül');
  ellenoriz(SZ.peldanyai('n_s', [s, v, k]).map((x) => x.id).join() === 'n_v,n_k', 'a rá épülők (közvetve is)');
  ellenoriz(!SZ.levalaszt(k2).alap_id && !SZ.levalaszt(k2).adat.felulirt.length, 'leválasztás');

  // figyelmeztetések és lépések
  const fg = { nev: 'Morgoth', adat: { szereplo: { szerepek: ['fogonosz'], cel: 'uralom' } } };
  const f = SZ.figyelmeztetesek(fg);
  ellenoriz(f.some((x) => /indítékot/.test(x.szoveg)) && f.some((x) => /eltúlzott/.test(x.szoveg)), 'főgonosz indíték és jellegzetes vonás nélkül figyelmeztet', f);
  ellenoriz(SZ.figyelmeztetesek({ adat: {} }).some((x) => x.lepes === 'szerep'), 'szerep nélkül figyelmeztet');
  ellenoriz(SZ.figyelmeztetesek({ adat: { szereplo: { szerepek: ['csapattag'], epitesi_mod: 'szabad' } } }).length >= 2, 'csapattag: rivaldafény és építési mód');
  const la = SZ.lepesAllapot({ nev: 'X', adat: { szereplo: { szerepek: ['barat'], cel: 'a', indok: 'b', vonas: 'c', kulcspontok: [{ szoveg: 'x' }] } } });
  ellenoriz(la.szerep === 'kesz' && la.szemelyiseg === 'kesz' && la.parbeszed === 'kesz' && la.hatter === 'ures', 'lépések állapota', la);
  const n = SZ.szereploNorm({ szerepek: ['barat', 'nincs'], rejtett: [{ oszlop: 'x', nev: 'Kapzsiság' }], kulcspontok: [{ szoveg: 'a' }] });
  ellenoriz(n.szerepek.join() === 'barat' && n.rejtett[0].oszlop === 'informacio' && n.rejtett[0].id === 'rv1' && n.kulcspontok[0].id === 'kp1', 'normalizálás');

  // hivatkozások
  const elemek = [
    { elem: { id: 'h1', tipus: 'helyszin' }, adat: { nev: 'Vén Csuka', szereplok: [{ njk_id: 'n_k', szerep: 'kocsmáros' }] } },
    { elem: { id: 'k1', tipus: 'kaland' }, adat: { nev: 'A tolvaj', ellenfel: { njk_id: 'n_k' }, njkk: [{ njk_id: 'n_k' }] } },
    { elem: { id: 'j1', tipus: 'jelenet' }, adat: { nev: 'Lesben', lenyek: [{ forras: 'njk', ref_id: 'n_k' }] } },
    { elem: { id: 'u1', tipus: 'helyszin' }, adat: { nev: 'Bolt' } }];
  const hv = SZ.hivatkozasok('n_k', elemek, { veg: { ellenfel: { njk_id: 'n_k' } }, keptar: [{ njk_id: 'n_k' }] }, [{ honnan: 'n_k', hova: 'u1', tipus: 'tulajdonosa' }]);
  ellenoriz(hv.length === 7 && hv.some((x) => x.szoveg === 'tulajdonosa' && x.hol === 'Bolt'), 'hol szerepel: helyszín, kaland, jelenet, keret, bolt', hv);
  const cs = SZ.szerepSzerint([{ id: 'a', szerepek: ['barat', 'megbizo'] }, { id: 'b', szerepek: [] }]);
  ellenoriz(cs.barat.length === 1 && cs.megbizo.length === 1 && cs._nincs.length === 1, 'csoportok szerep szerint');

  // dobótáblák (kitalált minta táblák az Import 13 szerkezetével)
  const tablak = [
    { id: 'dt_rejtett_vonas', reszletek: { kocka: '1d6', sorok: [{ t: [1, 2], e: 'Fókusz', hivas: [{ tabla: 'dt_rv_fokusz' }] }, { t: [3, 4], e: 'Info', hivas: [{ tabla: 'dt_rv_informacio' }] }, { t: [5, 6], e: 'Jellem', hivas: [{ tabla: 'dt_rv_szerepjatek' }] }] } },
    { id: 'dt_rv_fokusz', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Erő fókusz', ertek: { tul: 'tul_strength', fokuszok: ['fok_a', 'fok_b'] } }] } },
    { id: 'dt_rv_informacio', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Rejtekhely: tud egy helyet', ertek: { jelek: 'arra néz' } }] } },
    { id: 'dt_rv_szerepjatek', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Kényszer: szerencsejátékos' }] } },
    { id: 'dt_kapcsolat', reszletek: { kocka: '2d6', sorok: [{ t: [2, 6], e: 'Ellenség', ertek: { tipus: 'ellensege' } }, { t: [7, 12], e: 'Nincs', ertek: { tipus: null } }] } }];
  const rv = SZ.rejtettFabol(G.general('dt_rejtett_vonas', { tablak, rng: kockak(1) }));
  ellenoriz(rv.length === 1 && rv[0].oszlop === 'fokusz' && rv[0].fokusz_jeloltek.length === 2, 'rejtett vonás: új fókusz a jelöltekkel', rv);
  const ri = SZ.rejtettFabol(G.general('dt_rejtett_vonas', { tablak, rng: kockak(3) }));
  ellenoriz(ri[0].nev === 'Rejtekhely' && ri[0].leiras === 'tud egy helyet' && ri[0].jelek === 'arra néz', 'rejtett vonás: információ árulkodó jellel', ri);
  ellenoriz(SZ.kapcsolatTipusFabol(G.general('dt_kapcsolat', { tablak, rng: kockak(1, 1) })) === 'ellensege' && SZ.kapcsolatTipusFabol(G.general('dt_kapcsolat', { tablak, rng: kockak(6, 6) })) === null, 'kapcsolattípus a tábla eredményéből');
  const km = SZ.kovetoMintabol({ adat: { statblokk: { tulajdonsagok: { tul_strength: 0 } }, szerep: {} } }, { nev: 'Testőr', tulajdonsagok: { tul_strength: 2 }, fokuszok: ['fok_x'], feladatok: ['őrködik'] });
  ellenoriz(km.adat.statblokk.tulajdonsagok.tul_strength === 2 && km.adat.statblokk.fokuszok[0] === 'fok_x' && km.adat.szerep.feladatok[0] === 'őrködik', 'követő mintából');
}

// ---------- Jutalmak (5.6) ----------
{
  // lépések a fajta szerint
  ellenoriz(J.lepesKulcsok({}).join() === 'hasznalat,megnyitas' && J.lepesKulcsok({ fajta: 'targy' }).join() === 'hasznalat,targy,ereklye,megnyitas'
    && J.lepesKulcsok({ fajta: 'targy', tartos: 'ideiglenes' }).join() === 'hasznalat,targy,megnyitas' && J.lepesKulcsok({ fajta: 'cim' }).join() === 'hasznalat,cim,megnyitas', 'jutalom lépései fajtánként');
  const la = J.lepesAllapot({ fajta: 'kincs', iv: 'kezdo', szerepek: ['eroforras'], kategoria: 'szereny', ertek_ezust: 10, megnyitas: ['tortenet'] });
  ellenoriz(la.hasznalat === 'kesz' && la.kincs === 'kesz' && la.megnyitas === 'kesz' && la.cim === 'ures', 'jutalom lépésállapot', la);
  // ritkaság (Alapkönyv 119.): +1 ritkás, +2 ritka, +3 legendás; ideiglenes és korlátozott egy fokkal gyakoribb
  ellenoriz(J.targyRitkasag({}) === 'gyakori' && J.targyRitkasag({ elonyok: [{ tipus: 'tamadas', ertek: 1 }] }) === 'ritkas'
    && J.targyRitkasag({ elonyok: [{ tipus: 'tamadas', ertek: 1 }, { tipus: 'pancel', ertek: 2 }] }) === 'ritka'
    && J.targyRitkasag({ elonyok: [{ tipus: 'sebzes', ertek: 3 }] }) === 'legendas', 'tárgy ritkasága az előnyökből');
  ellenoriz(J.targyRitkasag({ tartos: 'ideiglenes', elonyok: [{ tipus: 'tamadas', ertek: 2 }] }) === 'ritkas'
    && J.targyRitkasag({ elonyok: [{ tipus: 'tamadas', ertek: 2 }], korlatozasok: [{ tipus: 'hatter' }] }) === 'ritkas'
    && J.targyRitkasag({ tartos: 'ideiglenes', elonyok: [{ tipus: 'tamadas', ertek: 1 }] }) === 'gyakori', 'ideiglenes és korlátozott tárgy egy fokkal gyakoribb');
  ellenoriz(J.ervenyesRitkasag({ ritkasag: 'legendas', elonyok: [] }) === 'legendas', 'kézi ritkaság nyer');
  // figyelmeztetések
  const fg = (a) => J.figyelmeztetesek(a).map((x) => x.lepes);
  ellenoriz(fg({}).includes('hasznalat'), 'fajta és szintsáv nélkül figyelmeztet');
  ellenoriz(fg({ fajta: 'targy', iv: 'kezdo', elonyok: [{ tipus: 'tamadas', ertek: 2 }], tortenet: 'x' }).includes('targy'), 'túl ritka tárgy a sávhoz');
  ellenoriz(!fg({ fajta: 'targy', iv: 'mester', elonyok: [{ tipus: 'tamadas', ertek: 2 }], tortenet: 'x' }).includes('targy'), 'illő ritkaság nem figyelmeztet');
  ellenoriz(fg({ fajta: 'kincs', iv: 'legendas', kategoria: 'csekely' }).includes('kincs') && !fg({ fajta: 'kincs', iv: 'legendas', kategoria: 'fenyuzo' }).includes('kincs'), 'kincskategória a sávhoz');
  ellenoriz(fg({ fajta: 'cim', iv: 'kezdo', bonusz: 4 }).includes('cim'), 'cím bónusza legfeljebb +3');
  ellenoriz(fg({ fajta: 'cim', iv: 'kezdo', megnyitas: ['adomanyozas'] }).includes('megnyitas'), 'adományozó nélkül');
  ellenoriz(fg({ fajta: 'tars', iv: 'kezdo' }).includes('tars') && !fg({ fajta: 'tars', iv: 'kezdo', njk_id: 'n1' }).includes('tars'), 'társ NJK vagy tulajdonságok nélkül');
  ellenoriz(fg({ fajta: 'targy', iv: 'kezdo', atok: { van: true }, tortenet: 'x' }).includes('targy'), 'átok jelenet és büntetés nélkül');
  ellenoriz(fg({ fajta: 'targy', ereklye: { fajta: 'zart', kepessegek: [{ nev: 'a' }] } }).filter((x) => x === 'ereklye').length === 2, 'zárt ereklye feltétel nélkül, kevés képességgel');
  ellenoriz(fg({ szerepek: ['cel'] }).includes('hasznalat') && J.figyelmeztetesek({ szerepek: ['cel'], kinek: ['csapat'] }).every((x) => !/Célként/.test(x.szoveg)), 'cél: kinek szól');
  // ereklye
  ellenoriz(J.lepcsosNyitott(1) === 1 && J.lepcsosNyitott(5) === 2 && J.lepcsosNyitott(12) === 5 && J.lepcsosNyitott(20) === 7, 'lépcsős ereklye: nyitott képességek száma');
  const er = { ereklye: { fajta: 'lepcsos', kepessegek: [{ nev: 'a' }, { nev: 'b' }, { nev: 'c', szint: 3 }] } };
  const ea = J.ereklyeAllapot(er, 4);
  ellenoriz(ea[0].nyitva && ea[1].nyitva && ea[2].nyitva && !J.ereklyeAllapot(er, 1)[1].nyitva && !J.ereklyeAllapot(er, 2)[2].nyitva, 'lépcsős ereklye a szint szerint');
  ellenoriz(!J.ereklyeAllapot({ ereklye: { fajta: 'zart', kepessegek: [{ nev: 'a' }] } }, 20, false)[0].nyitva && J.ereklyeAllapot({ ereklye: { fajta: 'zart', kepessegek: [{ nev: 'a' }] } }, 1, true)[0].nyitva, 'zárt ereklye a feltételtől');
  // kincs
  const kd = J.kincsDobas('kozepes', kockak(3, 4));
  ellenoriz(kd.ezust === 70 && /× 10/.test(kd.szoveg), 'kincs dobása (2d6 × 10)', kd);
  ellenoriz(J.kincsDobas('csekely', kockak(5)).ezust === 5 && J.kincsDobas('nincs') === null, 'csekély kincs, ismeretlen kategória');
  const bk = J.bankolas('szereny');
  ellenoriz(bk.kell === 3 && bk.osszesen === 30 && bk.jovedelem === 'csekely' && J.bankolas('csekely').jovedelem === null, 'vagyonrendszer: bankolás (78. oldal)', bk);
  ellenoriz(J.bankolas('kozepes').kell === 20, 'bankolás: 2d6 × 10 legkisebb értéke');
  // térkép és kötések
  const jel = [{ id: 'j1', tipus: 'jutalom', adat: { fajta: 'cim', iv: 'kezdo' } }, { id: 'j2', tipus: 'jutalom', adat: { fajta: 'targy' } }, { id: 'x', tipus: 'kaland', adat: {} }];
  const tk = J.terkep(jel, (e) => e.adat);
  ellenoriz(tk.kezdo.cim.length === 1 && tk._nincs.targy.length === 1 && tk.mester.kincs.length === 0, 'jutalomtérkép rácsa', tk);
  const kp = [{ id: 'l1', honnan: 'j1', hova: 'k1', tipus: 'jutalma' }, { id: 'l2', honnan: 'j1', hova: 'k2', tipus: 'itt_tortenik' }, { id: 'l3', honnan: 'j2', hova: 'k1', tipus: 'jutalma', aktiv: false }];
  ellenoriz(J.holSzerzik('j1', kp).length === 1 && J.jutalmaiOf('k1', kp).length === 1, 'jutalom kötése kalandhoz (jutalma)');
  ellenoriz(KP.tipusNev('jutalma', 'ki') === 'jutalma ennek' && KP.tipusNev('jutalma', 'be') === 'jutalma', 'a jutalma kapcsolat feliratai');
  ellenoriz(J.osszefoglalo({ fajta: 'targy', tartos: 'ideiglenes', elonyok: [{ tipus: 'tamadas', ertek: 2 }] }) === 'Mágikus tárgy, ritkás, ideiglenes' && J.osszefoglalo({ fajta: 'kincs', kategoria: 'kozepes', ertek_ezust: 70 }) === 'Kincs, közepes, 70 ezüst', 'jutalom összefoglalója');
  // a térkép tippjei, figyelmeztetései és a hősönkénti nézet
  ellenoriz(J.SAVOK.every((sv) => KR.JUTALOM_OSZLOPOK.every((c) => typeof J.CELLA_TIPPEK[sv.kulcs][c.kulcs] === 'string' && J.CELLA_TIPPEK[sv.kulcs][c.kulcs].length > 10)), 'minden cellához van tipp');
  ellenoriz(J.terkepFigyelmeztetesek({ fajta: 'cim' }).length === 0 && J.terkepFigyelmeztetesek({ fajta: 'targy', iv: 'kezdo', elonyok: [{ tipus: 'tamadas', ertek: 3 }], tortenet: 'x' }).length === 1, 'a térkép figyelmeztetései (szintsáv nélkül nem jelez)');
  const hk = J.hosonkent([{ id: 'a', tipus: 'jutalom', adat: { iv: 'kezdo', kinek: ['c1', 'csapat'] } }, { id: 'b', tipus: 'jutalom', adat: { kinek: ['ismeretlen'] } }, { id: 'c', tipus: 'jutalom', adat: { iv: 'mester' } }], (e) => e.adat, ['c1', 'c2']);
  ellenoriz(hk.c1.kezdo.length === 1 && hk.csapat.kezdo.length === 1 && hk.c2.kezdo.length === 0 && hk._senki._nincs.length === 1 && hk._senki.mester.length === 1, 'hősönkénti nézet', hk);
  // keret: a jutalomtérkép
  const kj = KR.normalizal({ jutalomterkep: { kezdo: { cim: 'Kiválasztottak', rossz: 'x' } } });
  ellenoriz(kj.jutalomterkep.kezdo.cim === 'Kiválasztottak' && kj.jutalomterkep.legendas.kincs === '' && !('rossz' in kj.jutalomterkep.kezdo), 'keret: jutalomtérkép normalizálása');
  ellenoriz(KR.lepesAllapot({ jutalomterkep: { kezdo: { cim: 'x' } }, szintsav: { kezdo: 1, zaro: 4 } }, []).jutalmak === 'kesz' && KR.lepesAllapot({}, []).jutalmak === 'ures', 'keret: jutalomtérkép lépésállapota');
  // véletlen tárgyak (kitalált minta táblák az Import 12 és 14 szerkezetével)
  const tablak = [
    { id: 'dt_fegyvercsoport', reszletek: { kocka: 'd6d6', sorok: [{ t: [[1, 5], [1, 6]], e: 'Fejszék', ertek: { csoport: 'fcs_axes' } }, { t: [6, [1, 5]], e: 'Alapanyag', ertek: { csoport: 'granat_alapanyag' } }, { t: [6, 6], e: 'Gránát', ertek: { csoport: 'granat' } }] } },
    { id: 'dt_pancel', reszletek: { kocka: '3d6', sorok: [{ t: [3, 9], e: 'Nincs', ertek: { pancel: '' } }, { t: [10, 18], e: 'Bőr', ertek: { pancel: 'pan_b' } }] } },
    { id: 'dt_pajzs', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Pajzs', ertek: { pajzs: 'pan_p' } }] } },
    { id: 'dt_kidolgozottsag', reszletek: { kocka: '3d6', sorok: [{ t: [3, 13], e: 'Átlagos', ertek: { minoseg: 'atlagos' } }, { t: [14, 18], e: 'Finom', ertek: { minoseg: 'finom' } }] } },
    { id: J.MAGIKUS_TABLA, reszletek: { kocka: '3d6', sorok: [
      { t: 3, e: 'Átok', ertek: { tipus: 'atok' }, hivas: [{ tabla: '', darab: 1, sajat_ujra: true }] },
      { t: [4, 9], e: 'Támadás +{szam}', szam: { alap: 'sarkany', oszto: 2, kerekit: 'fel' }, ertek: { tipus: 'tamadas' } },
      { t: [10, 14], e: 'Varázslat', ertek: { tipus: 'varazslat' } },
      { t: [15, 17], e: 'Sebzés +{szam}', szam: { alap: 'sarkany', oszto: 3, kerekit: 'fel' }, ertek: { tipus: 'sebzes' } },
      { t: 18, e: 'Több', ertek: { tipus: 'tobb' }, hivas: [{ tabla: '', darab: 2, egyedi: true, sajat_ujra: true }] }] } },
    { id: 'dt_minta', reszletek: { kocka: 'lista', sorok: [{ e: 'Sárkányölő', en: 'Dragon Slayer' }] } }];
  const lapok = { Fegyverek: [{ id: 'f1', csoport: 'fcs_axes', nev_hu: 'Csatabárd' }, { id: 'f2', csoport: 'fcs_axes', nev_hu: 'Hajítófejsze' }, { id: 'g1', reszletek: { tipus: 'granat' }, nev_hu: 'Tűzfiola' }],
    'Páncélok': [{ id: 'pan_b', nev_hu: 'Bőrpáncél' }, { id: 'pan_p', nev_hu: 'Pajzs' }] };
  ellenoriz(G.tablaHibak(tablak[5], tablak).length === 0 && G.listaE(tablak[5]) && G.tablaHibak({ reszletek: { kocka: 'lista', sorok: [{ e: '' }] } }).length === 1, 'választható lista (kocka: lista) ellenőrzése');
  ellenoriz(tablak.slice(0, 5).every((t) => G.tablaHibak(t, tablak).length === 0), 'a minta táblák hibátlanok');
  // 1+1+... = 3: átok, utána újradobás (4+4+6 = 14 varázslat, 6-os sárkánykocka)
  const mf = G.general(J.MAGIKUS_TABLA, { tablak, rng: kockak(1, 1, 1, 4, 4, 6) });
  const m1 = J.magikusFabol(mf);
  ellenoriz(m1.atok && m1.elonyok.length === 1 && m1.elonyok[0].tipus === 'varazslat' && /Mágiapont nélkül/.test(m1.elonyok[0].jegyzet), 'átkozott tárgy, varázslat 6-os sárkánykockával', m1);
  const m2 = J.magikusFabol(G.general(J.MAGIKUS_TABLA, { tablak, rng: kockak(2, 2, 5) }));
  ellenoriz(m2.elonyok[0].tipus === 'tamadas' && m2.elonyok[0].ertek === 3 && !m2.atok, 'támadás a sárkánykocka fele felfelé (5 → +3)', m2);
  const m3 = J.magikusFabol(G.general(J.MAGIKUS_TABLA, { tablak, rng: kockak(6, 6, 6, 2, 2, 5, 5, 5, 6) }));
  ellenoriz(m3.elonyok.length === 2 && m3.elonyok[1].tipus === 'sebzes' && m3.elonyok[1].ertek === 2, 'több előny: két további dobás', m3);
  const fak = J.veletlenTargyFak('fegyver', { tablak, rng: kockak(1, 1, 6, 6, 6, 2, 2, 5) }, { magikus: true });
  const t1 = J.targyFakbol('fegyver', fak, lapok, kockak(2));
  ellenoriz(t1.alap_id === 'f1' || t1.alap_id === 'f2', 'véletlen fegyver: d3 a csoport fegyvereiből', t1);
  ellenoriz(t1.kidolgozottsag === 'finom' && t1.elonyok.length === 1 && t1.elonyok[0].ertek === 3, 'véletlen fegyver: kidolgozottság és mágikus előny', t1);
  const fg2 = J.veletlenTargyFak('fegyver', { tablak, rng: kockak(6, 6, 1, 1, 1) }, {});
  ellenoriz(J.targyFakbol('fegyver', fg2, lapok, kockak(1)).alap_id === 'g1' && !fg2.magikus, 'gránát: 1d6 a gránátok közül');
  ellenoriz(J.targyFakbol('fegyver', J.veletlenTargyFak('fegyver', { tablak, rng: kockak(6, 1, 1, 1, 1) }, {}), lapok).targy_fajta === 'egyeb', 'gránát-alapanyag egyéb tárgy');
  const tp = J.targyFakbol('pancel', J.veletlenTargyFak('pancel', { tablak, rng: kockak(1, 1, 1, 1, 1, 1) }, {}), lapok);
  ellenoriz(tp.nincs && !tp.alap_id, 'véletlen páncél: nincs páncél');
  const tp2 = J.targyFakbol('pancel', J.veletlenTargyFak('pancel', { tablak, rng: kockak(6, 6, 6, 1, 1, 1) }, {}), lapok);
  ellenoriz(tp2.alap_id === 'pan_b' && tp2.alap_nev === 'Bőrpáncél' && tp2.kidolgozottsag === 'atlagos', 'véletlen páncél a szabályadatból', tp2);
  // a valódi szabályadat táblái (ha meg van adva): FAGE_SZABALYOK=<lapok.json>
  if (process.env.FAGE_SZABALYOK) {
    const valodi = JSON.parse(fs.readFileSync(process.env.FAGE_SZABALYOK, 'utf8'))['Dobótáblák'] || [];
    const ujak = valodi.filter((t) => [J.MAGIKUS_TABLA, J.CIM_MINTAK, J.TARS_MINTAK, J.EREKLYE_MINTAK].includes(t.id));
    ellenoriz(ujak.length === 4 && ujak.every((t) => G.tablaHibak(t, valodi).length === 0), 'az Import 14 táblái hibátlanok', ujak.map((t) => [t.id, G.tablaHibak(t, valodi)]));
    for (let i = 0; i < 200; i++) { const x = J.magikusFabol(G.general(J.MAGIKUS_TABLA, { tablak: valodi })); if (!x.elonyok.length) { ellenoriz(false, 'mágikus tulajdonság mindig ad előnyt', x); break; } }
  }
}

// ---------- Isteni (8. fejezet) ----------
{
  const tablak = [
    { id: 'dt_vallas_szerkezet', nev_hu: 'Vallásszerkezet', reszletek: { kocka: '1d6', sorok: [
      { t: 1, e: 'Egy', ertek: { szerkezet: 'egy' } }, { t: [2, 3], e: 'Kettő', ertek: { szerkezet: 'ketto' } },
      { t: [4, 5], e: 'Panteon {szam}', szam: { alap: '3d6' }, ertek: { szerkezet: 'panteon' } }, { t: 6, e: 'Család {szam}', szam: { alap: '3d6' }, ertek: { szerkezet: 'csaladi' } }] } },
    { id: 'dt_tartomany', nev_hu: 'Tartomány', reszletek: { kocka: 'd6d6d6', sorok: [
      { t: [[1, 3], [1, 6], [1, 6]], e: 'Tűz', en: 'Fire' }, { t: [[4, 6], [1, 6], [1, 3]], e: 'Halál', en: 'Death' }, { t: [[4, 6], [1, 6], [4, 6]], e: 'Hold', en: 'The Moon' }] } },
    { id: 'dt_kultusz_tevekenyseg', nev_hu: 'Kultusztevékenység', reszletek: { kocka: '3d6', sorok: [
      { t: [3, 10], e: 'Ima: nyilvánosan', en: 'Public Prayer' }, { t: [11, 18], e: 'Tánc: furcsa', en: 'Dance' }] } },
    { id: 'dt_unnep', nev_hu: 'Ünnep', reszletek: { kocka: '3d6', sorok: [{ t: [3, 18], e: 'Lakoma: közös', en: 'Feast' }], kovetkezo: [{ tabla: 'dt_tartomany', darab: 1 }] } },
    { id: 'dt_isten', nev_hu: 'Isten', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Isten', hivas: [{ tabla: 'dt_tartomany', darab: 'd3', egyedi: true }] }] } },
    { id: 'dt_kultusz', nev_hu: 'Kultusz', reszletek: { kocka: '1d6', sorok: [{ t: [1, 6], e: 'Kultusz', hivas: [
      { tabla: 'dt_kultusz_tevekenyseg', darab: 'd3', egyedi: true }, { tabla: 'dt_tartomany', darab: 'd3', egyedi: true }] }] } }
  ];
  tablak.forEach((t) => ellenoriz(G.tablaHibak(t, tablak).length === 0, 'isteni mintatábla hibátlan: ' + t.id, G.tablaHibak(t, tablak)));
  ellenoriz(E.ELEMTIPUSOK.istenseg.szulok.includes('istenseg'), 'isteni elem isteni elem alá kerülhet');
  ellenoriz(IS.fajtaOf({}) === 'isten' && IS.fajtaOf({ fajta: 'vallas' }) === 'vallas', 'fajta alapból isten');
  // vallásszerkezet
  const sz = IS.szerkezetFabol(G.general('dt_vallas_szerkezet', { tablak, rng: kockak(5, 3, 4, 5) }));
  ellenoriz(sz && sz.szerkezet === 'panteon' && sz.istenek_szama === 12, 'panteon 3d6 istennel', sz);
  ellenoriz(IS.szerkezetFabol(G.general('dt_vallas_szerkezet', { tablak, rng: kockak(2) })).istenek_szama === 2, 'kettős istenhit két isten');
  // isten tartományai: d3 = 2 (kocka 3 → d3 2), egyedi
  const fa = G.general('dt_isten', { tablak, rng: kockak(1, 3, 1, 1, 1, 4, 1, 5) });
  const t = IS.tartomanyokFabol(fa);
  ellenoriz(t.length === 2 && t[0].nev === 'Tűz' && t[1].nev !== 'Tűz', 'isten két különböző tartománnyal', t);
  const jav = IS.arkanumJavaslat(t.concat([{ nev: 'Hold', en: 'The Moon' }]));
  ellenoriz(jav.some((x) => x.id === 'ark_fire') && jav.some((x) => x.id === 'ark_water'), 'arkánumjavaslat a tartományokból', jav);
  ellenoriz(IS.tartomanyokNorm(['Tűz', '', { nev: 'Hold', en: 'The Moon' }]).length === 2, 'tartomány normalizálás szövegből is');
  // kultusz
  const kf = G.general('dt_kultusz', { tablak, rng: kockak(1, 5, 1, 1, 1, 6, 6, 6, 1, 1, 1, 1) });
  const tev = IS.tevekenysegekFabol(kf);
  ellenoriz(tev.length >= 1 && tev[0].nev && tev[0].leiras, 'kultusztevékenység névvel és leírással', tev);
  ellenoriz(IS.tartomanyokFabol(kf).length >= 1, 'kultusz tartományai');
  // ünnep
  const u = IS.unnepFabol(G.general('dt_unnep', { tablak, rng: kockak(3, 3, 3, 1, 1, 1) }));
  ellenoriz(u && u.nev === 'Lakoma (tűz)' && u.tema === 'Tűz' && /^Lakoma: közös/.test(u.szokas), 'ünnep szokással és témával', u);
  // fa és panteon
  const ev = (id, fajta, szulo, extra = {}) => ({ id, tipus: 'istenseg', nev: id, vilag_id: 'w1', kampany_id: '', alap_id: '', szulo_id: szulo || '', sorrend: 0, adat: { nev: id, fajta, ...extra }, aktiv: true });
  const elemek = [ev('v', 'vallas', '', { szerkezet: 'csaladi' }), ev('a', 'isten', 'v'), ev('b', 'isten', 'v'), ev('c', 'isten', 'v'), ev('k', 'kultusz', 'v'), ev('k2', 'kultusz', 'k'), ev('m', 'isten', '')];
  const ixI = E.index(elemek);
  const gy = IS.gyerekek('v', elemek);
  ellenoriz(gy.istenek.length === 3 && gy.kultuszok.length === 1, 'a vallás istenei és kultuszai');
  ellenoriz(IS.vallasa(ixI.get('k2'), ixI).id === 'v', 'a felekezet felekezetének vallása');
  ellenoriz(IS.testverek(ixI.get('a'), elemek).length === 2, 'testvérek a panteonban');
  const kap = [{ id: 'l1', honnan: 'a', hova: 'b', tipus: 'hazastarsa', aktiv: true }, { id: 'l2', honnan: 'c', hova: 'a', tipus: 'imadja', aktiv: true }];
  const parok = IS.panteonParok(gy.istenek, kap);
  ellenoriz(parok.length === 3 && parok.filter((p) => p.kapcsolatok.length).length === 1, 'panteon párjai, az imádás nem kötelék', parok.map((p) => p.kapcsolatok.length));
  const isf = IS.isteniFa(elemek);
  ellenoriz(isf.length === 2 && isf[0].elem.id === 'v' && isf[0].gyerekek.length === 4 && isf[0].gyerekek.find((x) => x.elem.id === 'k').gyerekek.length === 1, 'vallásfa', isf.map((x) => x.elem.id));
  ellenoriz(IS.imadoi('a', kap).length === 1 && IS.imadja('c', kap).length === 1, 'imádók és imádott');
  ellenoriz(JSON.stringify(IS.fajtaSzamok(elemek)) === JSON.stringify({ vallas: 1, isten: 4, kultusz: 2 }), 'fajtaszámok');
  // lépések
  ellenoriz(IS.lepesKulcsok({ fajta: 'vallas', szerkezet: 'egy' }).indexOf('panteon') < 0 && IS.lepesKulcsok({ fajta: 'vallas', szerkezet: 'panteon' }).includes('panteon'), 'a vallás panteon lépése a szerkezettől függ');
  ellenoriz(IS.lepesKulcsok({ fajta: 'isten' }, { testverekSzama: 1 }).includes('panteon') && !IS.lepesKulcsok({ fajta: 'isten' }).includes('panteon'), 'az isten panteon lépése a testvérektől függ');
  ellenoriz(IS.lepesKulcsok({ fajta: 'kultusz' })[1] === 'tevekenysegek', 'a kultusz lépései');
  ellenoriz(IS.lepesKulcsok({ fajta: 'vallas' }).concat(IS.lepesKulcsok({ fajta: 'isten' }), IS.lepesKulcsok({ fajta: 'kultusz' })).every((k) => IS.ISTENI_LEPESEK[k]), 'minden lépésnek van leírása');
  const all = IS.lepesAllapot({ fajta: 'vallas', szerkezet: 'csaladi', valosag: 'valodi', jelenlet: 'jelek', tudas: 'hit', jelkep: 'tölgylevél', tanok: 'vess és arass' }, { istenekSzama: 3, parokSzama: 3, kotottParok: 1 });
  ellenoriz(all.fajta === 'kesz' && all.valosag === 'kesz' && all.panteon === 'resz' && all.kulsosegek === 'kesz' && all.unnepek === 'ures', 'lépésállapot', all);
  // figyelmeztetések
  const fv = IS.figyelmeztetesek({ fajta: 'vallas', szerkezet: 'csaladi', jelenlet: 'tavol', isteni_szabalyok: ['hitvalsag', 'jamborsag'], arkanumok: ['ark_fire'], tiltott_arkanumok: ['ark_fire'] },
    { istenekSzama: 1, parokSzama: 0, kotottParok: 0 });
  ['fajta', 'valosag', 'magia'].forEach((l) => ellenoriz(fv.some((x) => x.lepes === l), 'figyelmeztetés: ' + l, fv));
  ellenoriz(fv.filter((x) => x.lepes === 'magia').length === 3, 'hitválság mutatványok nélkül, jámborság hit nélkül, ütköző arkánum');
  ellenoriz(IS.figyelmeztetesek({ fajta: 'isten' }).some((x) => x.lepes === 'isten_fajta') && !IS.figyelmeztetesek({ fajta: 'isten', szerep: 'elo_isten' }).length, 'tartomány nélküli isten (az élő isten kivétel)');
  const fk = IS.figyelmeztetesek({ fajta: 'kultusz' }, { szuloFajta: 'vallas' });
  ellenoriz(fk.some((x) => x.lepes === 'tevekenysegek') && fk.some((x) => x.lepes === 'elteres') && !fk.some((x) => x.lepes === 'kultusz_fajta'), 'leágazó kultusz figyelmeztetései', fk);
  ellenoriz(IS.figyelmeztetesek({ fajta: 'kultusz', tevekenysegek: [{ nev: 'x' }] }).some((x) => x.lepes === 'kultusz_fajta'), 'önálló kultusz imádott nélkül');
  ellenoriz(IS.osszefoglalo({ fajta: 'isten', szerep: 'ellenhatalom', tartomanyok: [{ nev: 'Tűz' }] }, { imadokSzama: 2 }) === 'Isten, ellenhatalom, tűz, 2 imádó', 'összefoglaló');
  if (process.env.FAGE_SZABALYOK) {
    const valodi = JSON.parse(fs.readFileSync(process.env.FAGE_SZABALYOK, 'utf8'))['Dobótáblák'] || [];
    const ujak = valodi.filter((t) => [IS.SZERKEZET_TABLA, IS.TARTOMANY_TABLA, IS.TEVEKENYSEG_TABLA, IS.UNNEP_TABLA, IS.ISTEN_TABLA, IS.KULTUSZ_TABLA].includes(t.id));
    if (ujak.length) {
      ellenoriz(ujak.length === 6 && ujak.every((t) => G.tablaHibak(t, valodi).length === 0), 'az Import 15 táblái hibátlanok', ujak.map((t) => [t.id, G.tablaHibak(t, valodi)]));
      const tt = valodi.find((x) => x.id === IS.TARTOMANY_TABLA);
      ellenoriz(G.reszletek(tt).sorok.length === 108, 'a tartománytábla 108 sora');
      for (let i = 0; i < 100; i++) { const x = IS.unnepFabol(G.general(IS.UNNEP_TABLA, { tablak: valodi })); if (!x || !x.tema) { ellenoriz(false, 'az ünnepnek mindig van témája', x); break; } }
    }
  }
}

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
