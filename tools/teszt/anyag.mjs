// A kiosztható anyagok tiszta függvényeinek tesztje (web/js/kampany/anyag.js, 6.2).
// Futtatás: node tools/teszt/anyag.mjs
import * as A from '../../web/js/kampany/anyag.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---- Olvashatatlan részek ----
let r = A.szovegReszek('Gyertek [[éjfélkor]] a [[régi]] hídhoz.');
ellenoriz(r.length === 5 && r[1].olvashatatlan && r[1].szoveg === 'éjfélkor' && !r[2].olvashatatlan, 'a [[...]] részek olvashatatlanok', r);
r = A.szovegReszek('Eleje [[és a vége');
ellenoriz(r.length === 2 && r[1].olvashatatlan && r[1].szoveg === 'és a vége', 'a lezáratlan [[ a végéig olvashatatlan');
ellenoriz(A.szovegReszek('').length === 0 && A.szovegReszek('[[]]').length === 0, 'üres szöveg és üres jelölés');
ellenoriz(A.olvashatoSzoveg('A [[titok]] itt.') === 'A … itt.', 'előnézetben az olvashatatlan rész helyén három pont');
ellenoriz(A.elonezet('a'.repeat(200), 20).length === 20 && A.elonezet('x  \n y') === 'x y', 'rövid előnézet');

// ---- Kivágás ----
ellenoriz(A.vagasNorm({ x: 0.9, y: 0.1, w: 0.3, h: 0.2 }).x === 0.7, 'a kilógó kivágás a képbe tolódik');
ellenoriz(A.vagasNorm({ x: 0, y: 0, w: 0.01, h: 0.5 }) === null && A.vagasNorm(null) === null, 'túl kicsi vagy hiányzó kivágás nincs');
const v = A.vagasPontokbol({ x: 0.8, y: 0.6 }, { x: 0.2, y: 0.1 });
ellenoriz(v.x === 0.2 && v.y === 0.1 && Math.abs(v.w - 0.6) < 1e-9 && Math.abs(v.h - 0.5) < 1e-9, 'két húzási pontból téglalap (bármelyik irányban)', v);
const p = A.vagasPixel({ x: 0.5, y: 0.5, w: 0.5, h: 0.25 }, 2000, 1000, 768);
ellenoriz(p.sx === 1000 && p.sy === 500 && p.sw === 1000 && p.sh === 250 && p.szel === 768 && p.mag === 192, 'pixeles kivágás 768 px-re méretezve', p);
const p2 = A.vagasPixel(null, 400, 300, 768);
ellenoriz(p2.sw === 400 && p2.szel === 400, 'kivágás nélkül az egész kép, nagyítás nélkül');

// ---- Előkészített anyag ----
let a = A.anyagNorm({ fajta: 'level', szoveg: 'Szia', level: { kezires: 'kapkodo' }, kepek: [{ kep: 'k1' }, {}], alany: { ismert_nev: 'X', kategoria: 'rossz' } });
ellenoriz(a.level.kezires === 'kapkodo' && a.level.allapot === 'ep' && a.kepek.length === 1 && a.kepek[0].belyeg === 'k1' && a.alany.kategoria === 'egyeb',
  'normalizálás: levélmezők alapértékkel, hiányos kép kiesik, ismeretlen kategória egyéb', a);
ellenoriz(A.anyagNorm({ fajta: 'ismeretlen' }).fajta === 'nyom' && A.anyagNorm({}).id, 'ismeretlen fajta nyom, azonosító mindig van');
ellenoriz(A.anyagHibak({ fajta: 'kep' }).length === 1, 'kép fajtához kép kell');
ellenoriz(A.anyagHibak({ fajta: 'kepreszlet', kepek: [{ kep: 'k' }] })[0].includes('kivágandó'), 'képrészlethez kivágás kell');
ellenoriz(A.anyagHibak({ fajta: 'kepreszlet', kepek: [{ kep: 'k', vagas: { x: 0, y: 0, w: 0.5, h: 0.5 } }] }).length === 0, 'kivágással a képrészlet kiosztható');
ellenoriz(A.anyagHibak({ fajta: 'level' }).length === 1 && A.anyagHibak({ fajta: 'reszlet', kepek: [{ kep: 'k' }] }).length === 0, 'levélhez szöveg kell, a részlethez szöveg vagy kép');
ellenoriz(A.anyagCim({ fajta: 'nyom', szoveg: 'Sár a csizmán' }) === 'Nyom: Sár a csizmán' && A.anyagCim({ cim: ' Térkép ' }) === 'Térkép', 'cím: a megadott, vagy a fajta és a szöveg eleje');
ellenoriz(A.anyagCim({ cim: '', adat: { fajta: 'kep' } }) === 'Kép, térkép', 'kiosztott anyag címe az adatból');
ellenoriz(A.alanyKategoriaElemhez('helyszin') === 'hely' && A.alanyKategoriaElemhez('jutalom') === 'targy' && A.alanyKategoriaElemhez('jelenet') === 'egyeb', 'alany kategória az elemtípusból');

const kad = A.kiosztasAdat({ fajta: 'kepreszlet', cim: 'Arc', kepek: [{ kep: 'eredeti', cim: 'portré', vagas: { x: 0, y: 0, w: 0.5, h: 0.5 } }], alany: { ismert_nev: 'X' } },
  [{ kep: 'masolat', belyeg: 'mb', szel: 768, mag: 768 }], { tipus: 'helyszin', id: 'el_1', nev: 'Torony', anyag: 'a1' });
ellenoriz(kad.kepek[0].kep === 'masolat' && kad.kepek[0].cim === 'portré' && !JSON.stringify(kad).includes('eredeti') && !kad.alany && kad.forras.anyag === 'a1',
  'a kiosztás adata a másolatra mutat, az eredeti kép és a kivágás nem kerül bele', kad);
const vaz = A.kiosztottbolVazlat({ id: 'm_1', cim: 'Levél', adat: { fajta: 'level', szoveg: 'x [[y]]', level: { kezires: 'diszes' }, kepek: [{ kep: 'k', belyeg: 'b' }] } });
ellenoriz(vaz.elozo === 'm_1' && vaz.level.kezires === 'diszes' && vaz.kepek[0].kep === 'k' && vaz.szoveg === 'x [[y]]', 'újabb változat vázlata a kiosztottból');
ellenoriz(A.kiosztasAdat(vaz, [{ kep: 'k2' }]).elozo === 'm_1', 'az újabb változat hivatkozik az előzőre');

// ---- Alanyok ----
const dmAlanyok = [
  { id: 'al1', tipus: 'alany', cim: 'A kapucnis idegen', adat: { kategoria: 'szemely', valodi: { tipus: 'njk', id: 'n1', nev: 'Varga mester' }, osszekapcsolva: 'al2' } },
  { id: 'al2', tipus: 'alany', cim: 'Varga mester', adat: { kategoria: 'szemely', valodi: { tipus: 'njk', id: 'n1', nev: 'Varga mester' } } },
  { id: 'al3', tipus: 'alany', cim: 'A torony', adat: { kategoria: 'hely', valodi: { tipus: 'helyszin', id: 'e1', nev: 'Fekete torony' }, felfedve: true } },
  { id: 'al4', tipus: 'alany', cim: 'Kör A', adat: { osszekapcsolva: 'al5' } },
  { id: 'al5', tipus: 'alany', cim: 'Kör B', adat: { osszekapcsolva: 'al4' } }
];
ellenoriz(A.alanyNezet(dmAlanyok[2]).nev === 'Fekete torony' && A.alanyNezet(dmAlanyok[0]).nev === 'A kapucnis idegen', 'a DM sorából: felfedve a valódi név, különben az ismert');
ellenoriz(A.alanyNezet({ id: 'x', ismert_nev: 'Y', nev: 'Z', kategoria: 'targy' }).nev === 'Z', 'a játékos nézetéből is');
ellenoriz(A.alanyCel(dmAlanyok, 'al1') === 'al2' && A.alanyCel(dmAlanyok, 'al3') === 'al3', 'az összekapcsolás lánca a célnál ér véget');
ellenoriz(['al4', 'al5'].includes(A.alanyCel(dmAlanyok, 'al4')), 'körbe érő láncnál is megáll');
ellenoriz(A.alanyNevDm(dmAlanyok[0]) === 'A kapucnis idegen (valójában Varga mester)' && A.alanyNevDm(dmAlanyok[1]) === 'Varga mester', 'a DM nevei');
ellenoriz(A.alanyNevDm(dmAlanyok[2]) === 'A torony (felfedve: Fekete torony)', 'felfedett alany a DM listájában');
const cel = A.osszekapcsolhato(dmAlanyok.slice(0, 3), 'al2').map((x) => x.id);
ellenoriz(!cel.includes('al2') && !cel.includes('al1') && cel.includes('al3'), 'összekapcsolni nem lehet magával és a rá mutatóval', cel);

// ---- Kiosztott anyagok ----
const m = (id, ido, fajta, alany, extra = {}) => ({ id, tipus: 'anyag', idopont: ido, cim: id, alany_id: alany || '', adat: { fajta, szoveg: id }, ...extra });
const megosztasok = [
  m('m1', '2026-11-20T10:00:00Z', 'nyom', 'al1', { latta: { u_bence: 'x' } }),
  m('m2', '2026-11-20T11:00:00Z', 'kep', 'al2'),
  m('m3', '2026-11-20T09:00:00Z', 'level', 'al3', { allapot: 'visszavont' }),
  m('m4', '2026-11-20T12:00:00Z', 'nyom', '', { megmutat: '2026-11-20T12:00:00Z' }),
  { id: 'r1', tipus: 'njk', cim: 'Grimbold', idopont: '2026-11-20T13:00:00Z' }
];
ellenoriz(A.idorendben(megosztasok).map((x) => x.id).join() === 'm4,m2,m1,m3', 'időrendben a legújabb elöl, csak az anyagok');
ellenoriz(A.idorendben(megosztasok, 'nyom').length === 2, 'fajtaszűrő');
const ism = A.ismeretek(megosztasok, dmAlanyok);
ellenoriz(ism.length === 2 && ism[0].alany.id === 'al2' && ism[0].anyagok.map((x) => x.id).join() === 'm2,m1' && ism[0].korabbi[0] === 'A kapucnis idegen',
  'Ismeretek: az összekapcsolt alanyok egy csoportban, a korábbi névvel', ism);
ellenoriz(ism[1].alany.id === 'al3' && ism[1].kategoria === 'hely' && ism[1].korabbi[0] === 'A torony', 'felfedett hely, a korábbi ismert név');
const jatekosAlanyok = [{ id: 'al1', ismert_nev: 'A kapucnis idegen', nev: 'A kapucnis idegen', kategoria: 'szemely', osszekapcsolva: 'al2' },
  { id: 'al2', ismert_nev: 'Varga mester', nev: 'Varga mester', kategoria: 'szemely', osszekapcsolva: '' }];
ellenoriz(A.ismeretek(megosztasok.slice(0, 2), jatekosAlanyok)[0].anyagok.length === 2, 'a játékos nézetében is összeolvad');
ellenoriz(A.lattaE(megosztasok[0], 'u_bence') && !A.lattaE(megosztasok[1], 'u_bence') && A.lattaE({ latta_en: true }, 'x'), 'látta (DM sorából és a játékos jeléből)');
ellenoriz(A.ujakSzama(megosztasok, 'u_bence') === 2, 'új anyagok száma (a visszavont nem számít)');
ellenoriz(A.lattak(megosztasok[0], (id) => (id === 'u_bence' ? 'Bence' : '')).join() === 'Bence', 'kik nyitották meg');
const most = Date.parse('2026-11-20T12:05:00Z');
ellenoriz(A.megmutatandok(megosztasok, new Set(), most).map((x) => x.id).join() === 'm4', 'a friss megmutatás felugrik');
ellenoriz(A.megmutatandok(megosztasok, new Set(['m4@2026-11-20T12:00:00Z']), most).length === 0, 'egyszer mutatja eszközönként');
ellenoriz(A.megmutatandok(megosztasok, new Set(), most + 3600000).length === 0, 'a régi megmutatás új eszközön már nem ugrik fel');
ellenoriz(A.cimzettSzoveg(['k1', 'k2'], [{ id: 'k1', nev: 'Morg' }]) === 'Morg, ismeretlen karakter' && A.cimzettSzoveg([], []) === 'mindenki', 'címzettek szövege');
ellenoriz(A.mindenkinekE({ cimzett: 'mindenki' }) && !A.mindenkinekE({ cimzettek: ['k1'] }), 'mindenkinek szól-e');
const valt = A.ujabbValtozatok([m('u1', '2026-11-20T14:00:00Z', 'level', '', { adat: { fajta: 'level', elozo: 'm3' } })]);
ellenoriz(valt.get('m3').id === 'u1', 'az újabb változat felismerése');
ellenoriz(A.kiosztvaE([{ tipus: 'anyag', adat: { forras: { id: 'el_1', anyag: 'a1' } } }], 'el_1', 'a1') && !A.kiosztvaE([], 'el_1', 'a1'), 'kiosztva-e az előkészített anyag');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
