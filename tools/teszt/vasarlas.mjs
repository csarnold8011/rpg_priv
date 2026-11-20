// A 6.6 tiszta függvényeinek tesztje: a bolt pillanatképe, a kosár (a „két tételből az olcsóbb féláron” részlettel),
// az eladás, a kérések, a válasz beírása, és a vásárlások az alkalom eseménynaplójában.
// Futtatás: node tools/teszt/vasarlas.mjs
import * as V from '../../web/js/kampany/vasarlas.js';
import * as A from '../../web/js/kampany/alkalom.js';
import * as E from '../../web/js/kampany/elem.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

const LAPOK = {
  'Fegyverek': [
    { id: 'fgy_longsword', nev_hu: 'Hosszú kard', nev_en: 'Long Sword', csoport: 'fcs_heavy_blades', ar: '15 ezüst', reszletek: {} },
    { id: 'fgy_mace', nev_hu: 'Buzogány', nev_en: 'Mace', csoport: 'fcs_bludgeons', ar: '12 ezüst', reszletek: {} }
  ],
  'Fegyvercsoportok': [{ id: 'fcs_heavy_blades', nev_hu: 'Nehéz pengék' }, { id: 'fcs_bludgeons', nev_hu: 'Zúzófegyverek' }],
  'Páncélok': [],
  'Felszerelés': [{ id: 'fel_rope', nev_hu: 'Kötél', kategoria: 'Utazás és kaland', ar: '2 ezüst', reszletek: {} }]
};

// ---------- A pillanatkép ----------
const bolt = {
  uzlet_tipusok: ['fegyverkovacs'], fegyvercsoportok: ['fcs_heavy_blades'], arszint: 120, felvasarlas: 30, kidolgozottsag: 'finom',
  uzlet_reszletek: [{ id: 'r1', e: 'Köszönet a csapatnak', hatas: 'csapat_kedvezmeny', szazalek: 10 }, { id: 'r2', e: 'Szívesen alkuszik', hatas: 'alku', modosito: 1 }],
  kinalat: [
    { id: 'kt1', forras: 'Fegyverek:fcs_heavy_blades', tetel: 'fgy_longsword', nev: '', lista_rez: null, darab: 2, ar_rez: null, megj: '' },
    { id: 'kt2', forras: 'egyedi', tetel: '', nev: 'Fenőkő', lista_rez: 5, darab: null, ar_rez: 4, megj: '' },
    { id: 'kt3', forras: 'egyedi', tetel: '', nev: 'Mágikus: Buzogány', lista_rez: null, darab: 1, ar_rez: 800, megj: 'Sebzés +1',
      magikus: { targy_fajta: 'fegyver', alap_id: 'fgy_mace', alap_nev: 'Buzogány', kidolgozottsag: 'atlagos', elonyok: [{ tipus: 'sebzes', ertek: 1, mire: '' }], atok: { van: false } } },
    { id: 'kt4', forras: 'egyedi', tetel: '', nev: 'Ár nélküli csecsebecse', lista_rez: null, darab: null, ar_rez: null, megj: '' }
  ]
};
const p = V.boltPillanatkep({ elemId: 'el_bolt0001', nev: 'Vasmarok', hely: 'Kőhíd', a: bolt, lapok: LAPOK, szorzo: 100 });
const kard = p.bolt.tetelek.find((t) => t.id === 'kt1');
ellenoriz(kard && kard.ar === 162 && kard.eredeti === 180 && kard.lista === 150 && kard.darab === 2 && kard.nev === 'Hosszú kard',
  'a kard ára: 150 × 120% = 180, a csapatnak 10% kedvezménnyel 162', kard);
ellenoriz(p.bolt.tetelek.find((t) => t.id === 'kt2').ar === 4, 'a kézi ár nyer (a kedvezmény ezen is)', p.bolt.tetelek.find((t) => t.id === 'kt2'));
ellenoriz(p.arNelkul.length === 1 && !p.bolt.tetelek.some((t) => t.id === 'kt4'), 'az ár nélküli tétel kimarad, és a DM látja, melyik', p.arNelkul);
const mag = p.bolt.tetelek.find((t) => t.id === 'kt3');
ellenoriz(mag && mag.magikus.alap_id === 'fgy_mace' && mag.magikus.bejegyzes.fajta === 'targy' && mag.magikus.bejegyzes.elonyok[0].tipus === 'sebzes',
  'a mágikus tétel bejegyzése a karakterlapra (alap és előnyök)', mag);
ellenoriz(p.bolt.felvasarlas === 30 && p.bolt.kedvezmeny === 10 && p.bolt.visszavasarlas && !p.bolt.csere && /finom/.test(p.bolt.megj) && /Alku/.test(p.bolt.megj),
  'a bolt beállításai: felvásárlás, kedvezmény, kidolgozottság és alku', p.bolt);
const p2 = V.boltPillanatkep({ elemId: 'el_x', nev: 'Kiárusítás', a: { ...bolt, uzlet_reszletek: [{ id: 'k', e: 'Végkiárusítás', hatas: 'kiarusitas' }, { id: 'c', e: 'Csere', hatas: 'csere' }, { id: 'b', e: '1+1', hatas: 'bogo' }] }, lapok: LAPOK });
ellenoriz(!p2.bolt.visszavasarlas && p2.bolt.csere && p2.bolt.bogo && p2.bolt.arszint === 50, 'végkiárusítás: nincs felvásárlás, féláron; csere és 1+1 jelölve', p2.bolt);

// ---------- Boltok a helyszínek alatt ----------
const elemek = [
  { id: 'v', tipus: 'helyszin', adat: { fajta: 'telepules' } },
  { id: 'b1', tipus: 'helyszin', szulo_id: 'v', adat: { fajta: 'uzlet' } },
  { id: 'n', tipus: 'helyszin', szulo_id: 'v', adat: { fajta: 'negyed' } },
  { id: 'b2', tipus: 'helyszin', szulo_id: 'n', adat: { fajta: 'uzlet' } },
  { id: 'b3', tipus: 'helyszin', szulo_id: 'n', adat: { fajta: 'uzlet' }, aktiv: false }
];
const megj = (e) => e.adat;
ellenoriz(V.helyszinBoltjai([elemek[0]], elemek, megj).map((e) => e.id).join() === 'b1,b2', 'a település boltjai két szintig, az archivált nélkül');
ellenoriz(V.helyszinBoltjai([elemek[1]], elemek, megj).map((e) => e.id).join() === 'b1', 'a helyszín maga is bolt');
ellenoriz(V.boltElemek(elemek, megj).length === 2, 'a kampány boltjai');

// ---------- A kosár ----------
const nyitott = { id: 'bo_1', nev: 'Vasmarok', nyitva: true, bogo: false, tetelek: [
  { id: 'a', nev: 'Kard', ar: 100, keszlet: 2 }, { id: 'b', nev: 'Fenőkő', ar: 4, keszlet: null }, { id: 'c', nev: 'Mágikus buzogány', ar: 800, keszlet: 1, magikus: { alap_id: 'fgy_mace' } }
] };
let k = V.kosarValt({}, nyitott.tetelek[0], 1);
k = V.kosarValt(k, nyitott.tetelek[0], 5);
ellenoriz(k.a === 2, 'a kosár nem lépi túl a készletet', k);
k = V.kosarValt(k, nyitott.tetelek[2], 3);
ellenoriz(k.c === 1, 'mágikus tárgyból egy', k);
k = V.kosarValt(k, nyitott.tetelek[1], 3);
let o = V.kosarOsszesites(nyitott, k);
ellenoriz(o.osszeg === 200 + 800 + 12 && o.darab === 6 && !o.hibak.length && !o.engedmeny, 'a kosár összege', o);
ellenoriz(!V.kosarValt({ b: 1 }, nyitott.tetelek[1], -1).b, 'nullára csökkentve kikerül');
ellenoriz(V.kosarOsszesites(nyitott, { a: 3 }).hibak.length === 1, 'a készletnél több hibát jelez');
ellenoriz(V.kosarArak([{ ar: 100, db: 1 }, { ar: 60, db: 1 }], true).join() === '100,30', '1+1: az olcsóbb fele áron');
ellenoriz(V.kosarArak([{ ar: 7, db: 3 }], true).join() === '18', '1+1: három egyforma, a második 3 réz engedménnyel (lefelé kerekítve)');
o = V.kosarOsszesites({ ...nyitott, bogo: true }, { a: 2, b: 1 });
ellenoriz(o.osszeg === 100 + 50 + 4 && o.engedmeny === 50, '1+1 a kosárban: engedmény látszik', o);

// ---------- Eladás ----------
const adat = { felszereles: { targyak: [{ id: 'fgy_longsword', db: 1, felszerelve: true }, { id: 'fel_rope', db: 2 }, { id: 'fgy_mace~vb_x', db: 1, nev: 'Lángoló buzogány' }, { id: 'sajat:gyogyir', db: 3, nev: 'Gyógyír' }] } };
const el = V.eladhatoTargyak(adat, LAPOK, { felvasarlas: 25 }, (id) => LAPOK['Fegyverek'].concat(LAPOK['Felszerelés']).find((x) => x.id === id).nev_hu);
ellenoriz(el.targyak.length === 2 && el.egyeb === 2 && el.targyak.find((t) => t.id === 'fgy_longsword').ar === 38 && el.targyak.find((t) => t.id === 'fel_rope').ar === 5,
  'eladható: a szabályadat tárgyai a felvásárlási áron (a mágikus és a saját nem)', el);
const eo = V.eladasOsszesites(el.targyak, { fel_rope: 5, fgy_longsword: 1 });
ellenoriz(eo.osszeg === 38 + 10 && eo.sorok.find((s) => s.t.id === 'fel_rope').db === 2, 'az eladás összege, legfeljebb a meglévő darab', eo);

// ---------- Kérések és válasz ----------
const vk = V.vetelKeres({ kampanyId: 'c1', bolt: nyitott, karakterId: 'k_1', kosar: { a: 1, b: 0 }, id: 'vb_teszt0001' });
ellenoriz(vk.fajta === 'vetel' && vk.tetelek.length === 1 && vk.tetelek[0].tetel_id === 'a' && vk.bolt_id === 'bo_1', 'a vétel kérése', vk);
const ek = V.eladasKeres({ kampanyId: 'c1', bolt: nyitott, karakterId: 'k_1', eladando: { fel_rope: 2 } });
ellenoriz(ek.fajta === 'eladas' && /^vb_[a-z0-9]{6,16}$/.test(ek.id) && ek.targyak[0].targy === 'fel_rope', 'az eladás kérése, érvényes azonosítóval', ek);
const st0 = { kampany: { id: 'c1' }, karakterek: [{ id: 'k_1', nev: 'Vilma', verzio: 3, adat: {} }], boltok: [nyitott] };
let st = V.allapotraAlkalmaz(st0, { bolt: { ...nyitott, tetelek: [] }, karakter: { id: 'k_1', verzio: 4, adat: { x: 1 } } });
ellenoriz(st.boltok[0].tetelek.length === 0 && st.karakterek[0].verzio === 4 && st.karakterek[0].adat.x === 1, 'a válasz beírása: bolt és karakter');
st = V.allapotraAlkalmaz(st, { torolve: 'bo_1' });
ellenoriz(!st.boltok.length, 'a törölt bolt kikerül');
ellenoriz(V.elemBoltja({ boltok: [{ id: 'bo_2', elem_id: 'el_1' }] }, 'el_1').id === 'bo_2', 'az elem boltja az állapotban');

// ---------- Szöveg és eseménynapló ----------
const x = { id: 'vb_1', fajta: 'vetel', idopont: '2026-11-20T18:05:00.000Z', karakter_id: 'k_1', karakter_nev: 'Vilma', osszeg: -210,
  tetelek: [{ nev: 'Hosszú kard', db: 1 }, { nev: 'Gyógyír', db: 3 }] };
ellenoriz(V.vasarlasSzoveg(x) === 'Vilma vett: Hosszú kard, 3 × Gyógyír (−21 ezüst)', 'a napló sora', V.vasarlasSzoveg(x));
const allapot = { kampany: { id: 'c1' }, karakterek: [{ id: 'k_1', nev: 'Vilma', adat: { felszereles: { jatek: [{ tipus: 'vetel', penz: -150, vasarlas_id: 'vb_1', idopont: x.idopont }] } } }],
  boltok: [{ id: 'bo_1', nev: 'Vasmarok', naplo: [x, { ...x, id: 'vb_2', fajta: 'eladas', osszeg: 38, tetelek: [{ nev: 'Hosszú kard', db: 1 }], visszavonva: '2026-11-20T18:10:00Z' }] }] };
const alk = { kezdet: '2026-11-20T18:00:00.000Z', allapot: 'fut' };
const es = A.esemenyekAllapotbol(allapot, alk);
const penzes = es.filter((e) => e.fajta === 'penz');
ellenoriz(penzes.length === 2 && penzes[0].kulcs === 'vasarlas:vb_1' && penzes[0].adat.penz === -210 && /Vásárlás: Hosszú kard, 3 × Gyógyír, Vasmarok/.test(penzes[0].szoveg),
  'a vásárlás egy pénzesemény a bolt naplójából (a karakter tételei nem duplikálnak)', es);
ellenoriz(penzes[1].adat.visszavont && /Eladás/.test(penzes[1].szoveg), 'a visszavont eladás „visszavonva” jelet kap');
const beolv = A.esemenyekBeolvasztasa(A.adatNorm({}), es);
const vazlatPenz = A.esemenySzoveg(beolv.adat.naplo.find((e) => e.kulcs === 'vasarlas:vb_1'));
ellenoriz(/Pénz: Vilma −21 ezüst \(Vásárlás/.test(vazlatPenz), 'az esemény szövege', vazlatPenz);
ellenoriz(E && typeof E.megjelenitett === 'function', 'az elem modul betölthető a vásárlással együtt');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzés)` : `\nMinden teszt sikeres (${db}).`);
process.exit(hibak ? 1 : 0);
