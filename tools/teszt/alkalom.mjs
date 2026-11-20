// Az élő munkamenet és a kalandnapló tiszta függvényei (web/js/kampany/alkalom.js, 6.4).
// Futtatás: node tools/teszt/alkalom.mjs
import * as A from '../../web/js/kampany/alkalom.js';
import { index } from '../../web/js/kampany/elem.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---- A kampány kalandja: kaland, két rész, három jelenet, ütemek ----
const elem = (id, tipus, szulo, sorrend, adat = {}) => ({ id, tipus, nev: adat.nev || id, kampany_id: 'k1', vilag_id: '', alap_id: '', szulo_id: szulo, sorrend, adat: { nev: adat.nev || id, ...adat }, aktiv: true });
const elemek = [
  elem('el_kal', 'kaland', '', 10, { nev: 'A híd titka', utemek: [{ id: 'ut1', szoveg: 'Megérkeznek', jelenet_id: 'el_j1' }, { id: 'ut2', szoveg: 'Pihenő', szunet: true }] }),
  elem('el_r1', 'resz', 'el_kal', 10, { nev: 'Első felvonás', utemek: [{ id: 'ut3', szoveg: 'Rajtaütés', jelenet_id: 'el_j2', nagy_csata: true }] }),
  elem('el_j1', 'jelenet', 'el_r1', 10, { nev: 'A fogadóban', lenyek: [{ id: 'ly1', forras: 'njk', ref_id: 'npc_h', nev: 'Harrigan' }] }),
  elem('el_j2', 'jelenet', 'el_r1', 20, { nev: 'Rajtaütés a hídnál' }),
  elem('el_r2', 'resz', 'el_kal', 20, { nev: 'Második felvonás' }),
  elem('el_j3', 'jelenet', 'el_r2', 10, { nev: 'A torony' }),
  { ...elem('el_jx', 'jelenet', 'el_r2', 20, { nev: 'Archivált' }), aktiv: false },
  elem('el_masik', 'kaland', '', 20, { nev: 'Másik kaland' }),
  { ...elem('el_vilag', 'kaland', '', 5, { nev: 'Világkaland' }), kampany_id: '', vilag_id: 'w1' }
];
const ix = index(elemek);
const kaland = ix.get('el_kal');
const nevek = (id) => (ix.get(id) ? ix.get(id).nev : id);

ellenoriz(A.kampanyKalandjai(elemek, ix, 'k1').map((x) => x.id).join() === 'el_kal,el_masik', 'a kampány aktív kalandjai (a világé nélkül), sorrendben');
const sorok = A.kalandSorok(kaland, elemek, ix);
ellenoriz(sorok.map((s) => s.elem.id + ':' + s.melyseg).join() === 'el_kal:0,el_r1:1,el_j1:2,el_j2:2,el_r2:1,el_j3:2', 'a kaland fája mélységgel, az archivált jelenet nélkül', sorok.map((s) => s.elem.id));
const utemek = A.kalandUtemei(kaland, elemek, ix);
ellenoriz(utemek.length === 3 && utemek[0].jelenet.id === 'el_j1' && !utemek[1].jelenet && utemek[2].jelenet.id === 'el_j2', 'az ütemsor a jelenetek feloldásával');
ellenoriz(A.kalandjaId('el_j3', ix) === 'el_kal' && A.kalandjaId('el_kal', ix) === 'el_kal' && A.kalandjaId('nincs', ix) === '', 'egy elem kalandja');

// ---- Új alkalom, öröklés ----
let al = A.ujAlkalom({ kampanyId: 'k1', jatekbeliDatum: 'Aratás hava 3.', most: '2026-11-20T18:00:00.000Z', id: 'a_teszt00001' });
ellenoriz(al.sorszam === 1 && al.allapot === 'fut' && al.verzio === 0 && al.adat.naplo.length === 1 && al.adat.naplo[0].fajta === 'alkalom', 'az első alkalom', al);
let m = A.mentendo(al);
ellenoriz(m.uj && m.kampany_id === 'k1' && m.kezdet === al.kezdet && m.verzio === 0, 'az új alkalom mentése a kampánnyal és a kezdettel', m);
ellenoriz(!A.mentendo({ ...al, verzio: 3 }).uj && A.mentendo({ ...al, verzio: 3 }).kampany_id === undefined, 'a módosítás mentése a verzióval, kampány nélkül');
ellenoriz(/^a_[a-z0-9]{10}$/.test(A.ujAlkalomId()), 'alkalomazonosító a háttér mintájára');

// ---- Jelenetek és aktuális ----
let d = al.adat;
d = A.aktualisBeallit(d, 'el_j1', { ido: '2026-11-20T18:05:00.000Z', nev: 'A fogadóban', kalandId: 'el_kal' });
ellenoriz(d.aktualis === 'el_j1' && A.jelenetAllapot(d, 'el_j1') === 'folyamatban' && d.kaland_id === 'el_kal', 'az aktuális jelenet elkezdődik');
ellenoriz(d.naplo.filter((e) => e.fajta === 'jelenet').length === 1, 'a jelenet kezdete a naplóba kerül');
ellenoriz(A.aktualisBeallit(d, 'el_j1', {}).naplo.length === d.naplo.length, 'ugyanaz az aktuális nem kerül be újra');
ellenoriz(A.jelenetBeallit(d, 'el_j1', 'rossz').jelenetek.el_j1 === 'folyamatban', 'ismeretlen állapot nem íródik be');
d = A.utemBeallit(d, 'ut1', 'kesz');
ellenoriz(A.utemAllapot(d, 'ut1') === 'kesz' && A.utemAllapot(A.utemBeallit(d, 'ut1', ''), 'ut1') === '', 'ütem megtörtént és vissza');
d = A.gyorsjegyzetHozzaad(d, { id: 'g1', ido: '2026-11-20T18:10:00.000Z', szoveg: '  Harrigan őrmester rossz benyomást szerzett.  ' });
ellenoriz(d.gyorsjegyzetek.length === 1 && d.gyorsjegyzetek[0].jelenet_id === 'el_j1' && d.gyorsjegyzetek[0].szoveg.startsWith('Harrigan'), 'a gyorsjegyzet az aktuális jelenethez kötődik');
ellenoriz(A.gyorsjegyzetHozzaad(d, { szoveg: '   ' }).gyorsjegyzetek.length === 1, 'üres gyorsjegyzet nem kerül be');
ellenoriz(A.gyorsjegyzetTorol(d, 'g1').gyorsjegyzetek.length === 0, 'gyorsjegyzet törlése');
d = A.jelenetBeallit(d, 'el_j1', 'kesz', { ido: '2026-11-20T18:30:00.000Z', nev: 'A fogadóban' });
d = A.aktualisBeallit(d, 'el_j2', { ido: '2026-11-20T18:40:00.000Z', nev: 'Rajtaütés a hídnál' });
ellenoriz(A.jelenetIdoben(d, '2026-11-20T18:20:00.000Z') === 'el_j1' && A.jelenetIdoben(d, '2026-11-20T18:35:00.000Z') === ''
  && A.jelenetIdoben(d, '2026-11-20T19:00:00.000Z') === 'el_j2' && A.jelenetIdoben(d, '2026-11-20T17:00:00.000Z') === '', 'melyik jelenet volt az aktuális egy időpontban');
ellenoriz(A.kovetkezoJelenet(kaland, elemek, ix, d, 'el_j2').id === 'el_j3', 'a következő jelenet a sorrendben');
ellenoriz(A.kovetkezoJelenet(kaland, elemek, ix, A.jelenetBeallit(d, 'el_j3', 'kihagyva'), 'el_j2') === null && A.kovetkezoJelenet(kaland, elemek, ix, A.jelenetBeallit(d, 'el_j3', 'kesz'), 'el_j3').id === 'el_j2',
  'ha a többi kész vagy kimaradt, nincs következő; a még folyó jelenet viszont következő lehet');
ellenoriz(A.kovetkezoJelenet(kaland, elemek, ix, A.adatNorm({}), 'el_j3').id === 'el_j1', 'a végéről az elejére lép');
const h = A.kalandHaladas(kaland, elemek, ix, d);
ellenoriz(h.osszes === 3 && h.kesz === 1 && h.folyamatban === 1, 'a kaland haladása', h);
const vissza = A.jelenetBeallit(d, 'el_j2', '');
ellenoriz(vissza.aktualis === '' && !vissza.jelenetek.el_j2, 'a visszaállított aktuális jelenet már nem aktuális');

// ---- Események az állapotból ----
const allapot = {
  kampany: { id: 'k1' },
  karakterek: [
    { id: 'c_morg', nev: 'Morg', adat: { xp_naplo: [
      { idopont: '2026-11-20T19:10:00.000Z', xp: 250, ok: 'Közepes találkozás', kampany_id: 'k1' },
      { idopont: '2026-11-19T19:10:00.000Z', xp: 100, ok: 'Tegnapi', kampany_id: 'k1' },
      { idopont: '2026-11-20T19:20:00.000Z', xp: 50, ok: 'Más kampány', kampany_id: 'k2' }],
      felszereles: { jatek: [{ tipus: 'penz', penz: 50, megjegyzes: 'a molnártól', idopont: '2026-11-20T19:15:00.000Z' }, { tipus: 'targy', penz: 0, idopont: '2026-11-20T19:16:00.000Z' }] } } },
    { id: 'c_pottom', nev: 'Pöttöm', adat: { xp_naplo: [{ idopont: '2026-11-20T19:10:00.000Z', xp: 250, ok: 'Közepes találkozás', kampany_id: 'k1' }] } }
  ],
  probak: [
    { id: 'p1', cim: 'Keresés', tipus: 'alap', letrehozva: '2026-11-20T18:50:00.000Z', allapot: 'nyitott', allas: { c_morg: { utolso: { eredmeny: 'siker', osszeg: 14 } } } },
    { id: 'p0', cim: 'Régi', letrehozva: '2026-11-19T18:50:00.000Z', allapot: 'lezart', allas: {} }
  ],
  megosztasok: [
    { id: 'm1', tipus: 'anyag', cim: 'Levél a toronyból', idopont: '2026-11-20T18:20:00.000Z', cimzettek: ['mindenki'], alany_id: 'm_al1', adat: { fajta: 'level' } },
    { id: 'm2', tipus: 'anyag', cim: 'Titkos nyom', idopont: '2026-11-20T18:21:00.000Z', cimzettek: ['c_morg'], adat: { fajta: 'nyom' } },
    { id: 'm_al1', tipus: 'alany', cim: 'A kapucnis idegen', idopont: '2026-11-20T18:19:00.000Z' }
  ],
  alanyok: [{ id: 'm_al1', tipus: 'alany', cim: 'A kapucnis idegen', adat: { valodi: { tipus: 'njk', id: 'npc_v', nev: 'Varga' } } }],
  csatak: [{ id: 'cs1', cim: 'Rablók a hídnál', allapot: 'lezart', letrehozva: '2026-11-20T18:45:00.000Z', lezarva: '2026-11-20T19:05:00.000Z' }],
  njkk: [{ id: 'npc_h', nev: 'Harrigan őrmester' }]
};
const futo = { ...al, adat: d };
let j = A.esemenyekAllapotbol(allapot, futo);
ellenoriz(j.map((e) => e.fajta).join() === 'anyag,anyag,csata,proba,xp,penz', 'a jelöltek időrendben: anyagok, csata, próba, XP, pénz (a korábbiak és más kampány XP-je nélkül)', j.map((e) => e.kulcs));
const xpE = j.find((e) => e.fajta === 'xp');
ellenoriz(xpE.adat.tetelek.length === 2 && xpE.szoveg === 'Közepes találkozás', 'az egyszerre kiosztott XP egy esemény, karakterenként', xpE);
let b = A.esemenyekBeolvasztasa(d, j);
ellenoriz(b.valtozott && b.adat.naplo.filter((e) => e.kulcs).length === 6, 'a jelöltek bekerülnek a naplóba');
ellenoriz(b.adat.naplo.find((e) => e.kulcs === 'anyag:m1').jelenet_id === 'el_j1' && b.adat.naplo.find((e) => e.kulcs === 'proba:p1').jelenet_id === 'el_j2'
  && b.adat.naplo.find((e) => e.kulcs === 'csata:cs1').jelenet_id === 'el_j2', 'az esemény ahhoz a jelenethez kötődik, amelyik akkor aktuális volt');
ellenoriz(!A.esemenyekBeolvasztasa(b.adat, j).valtozott, 'ugyanazok a jelöltek másodszor nem változtatnak');
const allapot2 = { ...allapot, probak: [{ ...allapot.probak[0], allapot: 'lezart', allas: { ...allapot.probak[0].allas, c_pottom: { utolso: { eredmeny: 'kudarc', osszeg: 9 } } } }] };
const b2 = A.esemenyekBeolvasztasa(b.adat, A.esemenyekAllapotbol(allapot2, futo));
const pr = b2.adat.naplo.find((e) => e.kulcs === 'proba:p1');
ellenoriz(b2.valtozott && pr.adat.lezart && pr.adat.eredmenyek.length === 2 && pr.id === b.adat.naplo.find((e) => e.kulcs === 'proba:p1').id && b2.adat.naplo.length === b.adat.naplo.length,
  'a próba eredménye frissíti a meglévő eseményt (ugyanazzal az azonosítóval)');
ellenoriz(A.esemenySzoveg(pr) === 'Próba: Keresés (Morg siker, Pöttöm kudarc)', 'a próba szövege az eredményekkel', A.esemenySzoveg(pr));
ellenoriz(A.esemenySzoveg(b.adat.naplo.find((e) => e.kulcs === 'anyag:m2')) === 'Anyag: Titkos nyom (Morg)', 'a titkos anyag a címzettel');
ellenoriz(A.esemenySzoveg(b.adat.naplo.find((e) => e.fajta === 'penz')) === 'Pénz: Morg +5 ezüst (a molnártól)', 'a pénz ezüstben', A.esemenySzoveg(b.adat.naplo.find((e) => e.fajta === 'penz')));
ellenoriz(new Set(b2.adat.naplo.map((e) => e.id)).size === b2.adat.naplo.length, 'az események azonosítói egyediek');
ellenoriz(!A.esemenyekAllapotbol(allapot, { ...futo, allapot: 'lezart', veg: '2026-11-20T18:30:00.000Z' }).some((e) => e.fajta === 'proba'), 'lezárt alkalomnál csak a végéig gyűjt');

// ---- Szereplők ----
const futo2 = { ...futo, adat: b2.adat };
const jel = A.szereploJeloltek(futo2, { allapot, elemek, ix });
ellenoriz(jel.length === 2 && jel[0].tipus === 'njk' && jel[0].nev === 'Harrigan őrmester' && jel[1].tipus === 'alany' && jel[1].ref_id === 'm_al1',
  'jelöltek: a lejátszott jelenet NJK-ja és a kiosztott anyag alanya', jel);
let sz = A.szereplokFelvetele(b2.adat, jel, (() => { let i = 0; return () => 'sz' + (++i); })());
ellenoriz(sz.szereplok.length === 2 && sz.osszefoglalo.itt.join() === 'sz1,sz2', 'a jelöltek a fontos szereplők közé, és ebben az alkalomban szerepeltek');
ellenoriz(A.szereplokFelvetele(sz, jel).szereplok.length === 2, 'a meglévő szereplő nem kerül be újra');

// ---- Vázlat és lezárás ----
const ctx = { jelenetNev: nevek, helyszinek: (id) => (id === 'el_j2' ? ['A Vén híd'] : id === 'el_j1' ? ['Vén Csuka fogadó'] : []) };
const zaras = A.lezar({ ...futo, adat: b2.adat }, { most: '2026-11-20T22:00:00.000Z', jatekbeliVeg: 'Aratás hava 5.', jeloltek: jel, ctx });
const v = zaras.adat.osszefoglalo;
ellenoriz(zaras.allapot === 'lezart' && zaras.veg === '2026-11-20T22:00:00.000Z' && zaras.jatekbeli_veg === 'Aratás hava 5.' && zaras.adat.naplo.slice(-1)[0].fajta === 'alkalom', 'a lezárás: vég, játékbeli vég, a napló utolsó sora');
ellenoriz(v.szoveg.includes('Játékbeli idő: Aratás hava 3. → Aratás hava 5.') && v.szoveg.includes('Helyszínek: Vén Csuka fogadó, A Vén híd.'), 'a vázlat a dátumokkal és a helyszínekkel', v.szoveg);
ellenoriz(v.szoveg.indexOf('• A fogadóban (kész)') < v.szoveg.indexOf('• Rajtaütés a hídnál (folyamatban)') && v.szoveg.includes('◦ Jegyzet: Harrigan őrmester rossz benyomást')
  && v.szoveg.includes('◦ Próba: Keresés (Morg siker, Pöttöm kudarc)'), 'a jelenetek a lejátszás sorrendjében, alattuk az események és a gyorsjegyzetek', v.szoveg);
ellenoriz(v.szoveg.includes('XP összesen: Morg 250, Pöttöm 250.') && v.xp.length === 2 && v.kincsek === 'Morg +5 ezüst', 'XP és pénz összesítve');
ellenoriz(v.jatekosoknak.includes('Amit kaptatok: Levél a toronyból.') && !v.jatekosoknak.includes('Titkos nyom') && v.jatekosoknak.includes('Csaták: Rablók a hídnál.'),
  'a játékosoknak szóló vázlatban csak a mindenkinek kiosztott anyag', v.jatekosoknak);
ellenoriz(!/ [–—] /.test(v.szoveg + v.jatekosoknak), 'a vázlatban nincs gondolatjel');
ellenoriz(!v.szoveg.includes('..') && v.szoveg.includes('Aratás hava 5.\n'), 'a ponttal végződő dátum után nincs dupla pont');
ellenoriz(zaras.adat.szereplok.length === 2 && zaras.adat.osszefoglalo.itt.length === 2, 'a lezáráskor a jelöltek felkerülnek');
const kezi = A.lezar({ ...futo, adat: { ...b2.adat, osszefoglalo: { szoveg: 'Saját szöveg.' } } }, { ctx });
ellenoriz(kezi.adat.osszefoglalo.szoveg === 'Saját szöveg.' && kezi.adat.osszefoglalo.jatekosoknak.length > 0, 'a már megírt összefoglalót a lezárás nem írja felül');
const ujra = A.ujranyit({ ...zaras, kozzeteve: true });
ellenoriz(ujra.allapot === 'fut' && !ujra.veg && !ujra.kozzeteve, 'újranyitás');

// ---- Következő alkalom: öröklés ----
const zarasSzallal = { ...zaras, adat: { ...zaras.adat, szalak: [{ id: 'sl1', cim: 'Ki küldte a levelet?', allapot: 'nyitott' }, { id: 'sl2', cim: 'A híd', allapot: 'lezart' }] } };
const kov = A.ujAlkalom({ kampanyId: 'k1', elozo: zarasSzallal, jatekbeliDatum: 'Aratás hava 6.', most: '2026-11-27T18:00:00.000Z' });
ellenoriz(kov.sorszam === 2 && kov.adat.jelenetek.el_j1 === 'kesz' && kov.adat.aktualis === 'el_j2' && kov.adat.kaland_id === 'el_kal', 'a következő alkalom örökli a jelenetek állapotát és az aktuálist');
ellenoriz(kov.adat.szalak.length === 1 && kov.adat.szalak[0].id === 'sl1' && kov.adat.szereplok.length === 2 && !kov.adat.osszefoglalo.itt.length && kov.adat.naplo.length === 1 && !kov.adat.gyorsjegyzetek.length,
  'a nyitott szálak és a szereplők öröklődnek, a napló, a gyorsjegyzetek és az összefoglaló nem');

// ---- Méret ----
let nagy = A.adatNorm({});
for (let i = 0; i < 400; i++) nagy.naplo.push({ id: 'e' + i, ido: '2026-11-20T18:00:00.000Z', fajta: 'egyeb', szoveg: 'x'.repeat(200) });
ellenoriz(A.meretAllapot({ adat: nagy }).tul, 'a túl nagy alkalom felismerése');
const karcsu = A.karcsusit(nagy);
ellenoriz(JSON.stringify(karcsu).length <= A.MAX_MERET && karcsu.naplo.slice(-1)[0].id === 'e399', 'karcsúsítás: a legrégebbi események esnek ki', JSON.stringify(karcsu).length);
ellenoriz(A.adatNorm({ naplo: [{ szoveg: 'y'.repeat(1000) }] }).naplo[0].szoveg.length === A.MAX_ESEMENY_SZOVEG, 'az esemény szövege korlátozott');

// ---- Szövegek ----
ellenoriz(A.alkalomCim({ sorszam: 3, cim: ' A híd ' }) === '3. alkalom: A híd' && A.alkalomCim({ sorszam: 1, cim: '' }) === '1. alkalom', 'az alkalom címe');
ellenoriz(A.jatekbeliIdoSzoveg({ jatekbeli_datum: 'X', jatekbeli_veg: 'X' }) === 'X' && A.jatekbeliIdoSzoveg({ jatekbeli_veg: 'Y' }) === 'Y', 'a játékbeli idő egy dátummal');
ellenoriz(/óta$/.test(A.valosIdoSzoveg({ kezdet: '2026-11-20T18:00:00.000Z' })) && A.valosIdoSzoveg({ kezdet: '2026-11-20T18:00:00.000Z', veg: '2026-11-20T21:30:00.000Z' }).includes('–'),
  'a valós idő futó és lezárt alkalomnál');

// ---- A játékosoknak: a szereplő alanya ----
const alanyokDm = [{ id: 'm_al1', adat: { valodi: { id: 'npc_v' } } }, { id: 'm_al2', adat: { valodi: { id: 'npc_h' } } }];
ellenoriz(A.szereploAlanya({ tipus: 'njk', ref_id: 'npc_v' }, alanyokDm, ['m_al1']) === 'm_al1' && A.szereploAlanya({ tipus: 'njk', ref_id: 'npc_h' }, alanyokDm, ['m_al1']) === ''
  && A.szereploAlanya({ tipus: 'alany', ref_id: 'm_al2' }, alanyokDm, ['m_al2']) === 'm_al2', 'a szereplő csak a játékos által látott alanyon keresztül jut el');

console.log(`\n${db} ellenőrzés, ${hibak ? hibak + ' HIBA' : 'mind sikeres'}.`);
process.exit(hibak ? 1 : 0);
