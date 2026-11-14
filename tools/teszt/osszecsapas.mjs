// Az összecsapás-építő és az oldalak tiszta függvényeinek tesztje (web/js/jatek/osszecsapas.js).
// Futtatás: node tools/teszt/osszecsapas.mjs. A minta lények kitaláltak (csak azonosítók és fenyegetés).
import * as O from '../../web/js/jatek/osszecsapas.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

const SZORNYEK = [
  { id: 'szo_farkas', nev_hu: 'Farkas', fenyegetes: 'Csekély' },
  { id: 'szo_ogre', nev_hu: 'Ogre', fenyegetes: 'Mérsékelt' },
  { id: 'szo_sarkany', nev_hu: 'Sárkány', fenyegetes: 'Legendás' },
  { id: 'szo_titok', nev_hu: 'Titok', fenyegetes: '' }
];
const NJKK = [
  { id: 'n_vezer', nev: 'Falkavezér', fenyegetes: 'Csekély', adat: { erosites: { fok: 'elit' } } },
  { id: 'n_kocsmaros', nev: 'Kocsmáros', fajta: 'rovid', fenyegetes: '' }
];
const KARAKTEREK = [{ id: 'k1', nev: 'Dorn', szint: 3 }, { id: 'k2', nev: 'Lia', szint: 3 }, { id: 'k3', nev: 'Pöttöm', szint: 2 }, { id: 'k4', nev: 'Áruló', szint: 4 }];
const korny = { szornyek: SZORNYEK, njkk: NJKK, karakterek: KARAKTEREK };

// ---- alapszerkezet ----
let o = O.uresOsszecsapas();
ellenoriz(o.oldalak.length === 2 && O.viszony(o, O.CSAPAT, O.ELLENFELEK) === 'ellenseges', 'alapból két oldal, egymással ellenséges');
ellenoriz(O.viszony(o, O.CSAPAT, O.CSAPAT) === 'sajat', 'egy oldal önmagához: saját');
ellenoriz(O.ellenorzes(o)[0] === 'Még nincs résztvevő.', 'üres összecsapás: figyelmeztetés');

// ---- résztvevők ----
let r = O.resztvevoHozzaadas(o, { tipus: 'szorny', id: 'szo_farkas', nev: 'Farkas', db: 4 });
o = r.o;
const farkasId = r.id;
let f = o.resztvevok[0];
ellenoriz(f.oldal === O.ELLENFELEK && f.db === 4 && f.csoport && o.csoportok[0].nev === 'Farkas' && !f.fontos, 'a több példányos szörny az Ellenfelekhez kerül, saját kezdeményezési csoporttal, nem fontos');
o = O.resztvevoHozzaadas(o, { tipus: 'szorny', id: 'szo_ogre', nev: 'Ogre' }).o;
ellenoriz(o.resztvevok[1].csoport === '' && o.csoportok.length === 1, 'egy példányos szörny csoport nélkül');
o = O.csapatHozzaadas(o, KARAKTEREK.slice(0, 3));
ellenoriz(o.resztvevok.filter((x) => x.oldal === O.CSAPAT).length === 3 && o.resztvevok.every((x) => x.forras.tipus !== 'karakter' || x.fontos), 'a csapat a Csapat oldalra kerül, fontosként');
o = O.csapatHozzaadas(o, KARAKTEREK.slice(0, 3));
ellenoriz(o.resztvevok.length === 5, 'a csapat másodszor nem kerül be még egyszer');
o = O.resztvevoModositas(o, farkasId, { db: 99 });
ellenoriz(o.resztvevok[0].db === O.MAX_DB, 'a darabszám felső korlátja');
o = O.resztvevoModositas(o, farkasId, { db: 3, oldal: 'nincs_ilyen', csoport: 'nincs_ilyen', forras: { tipus: 'x' } });
ellenoriz(o.resztvevok[0].db === 3 && o.resztvevok[0].oldal === O.ELLENFELEK && o.resztvevok[0].csoport && o.resztvevok[0].forras.tipus === 'szorny', 'módosításnál az ismeretlen oldal, csoport és a forrás nem íródik át');
const karId = o.resztvevok.find((x) => x.forras.id === 'k1').id;
ellenoriz(O.resztvevoModositas(o, karId, { db: 5 }).resztvevok.find((x) => x.id === karId).db === 1, 'karakter darabszáma mindig 1');

// ---- csoportok ----
let g = O.csoportHozzaadas(o, 'Íjászok');
o = g.o;
o = O.resztvevoModositas(o, o.resztvevok[1].id, { csoport: g.id });
ellenoriz(O.csoportTagjai(o, g.id).length === 1, 'résztvevő csoportba tehető');
o = O.csoportTorles(o, g.id);
ellenoriz(o.resztvevok[1].csoport === '' && !o.csoportok.some((x) => x.id === g.id), 'csoport törlésekor a tagjai egyénileg dobnak');

// ---- oldalak ----
o = O.oldalHozzaadas(o, 'Harmadik fél');
const harmadik = o.oldalak[2].id;
ellenoriz(O.viszony(o, harmadik, O.CSAPAT) === 'semleges' && O.viszony(o, harmadik, O.ELLENFELEK) === 'semleges', 'új oldal alapból semleges a többihez');
o = O.viszonyBeallitas(o, harmadik, O.ELLENFELEK, 'szovetseges');
ellenoriz(O.viszony(o, O.ELLENFELEK, harmadik) === 'szovetseges', 'viszony beállítása, a sorrend nem számít');
ellenoriz(O.viszonyBeallitas(o, harmadik, harmadik, 'ellenseges') === o && O.viszonyBeallitas(o, harmadik, O.CSAPAT, 'barat') === o, 'önmagához és ismeretlen viszonyra nem állít');
o = O.oldalAtnevezes(o, harmadik, 'Zsoldosok');
// egy játékos karakter is átállhat (játékos karakterek egymás ellen)
o = O.resztvevoHozzaadas(o, { tipus: 'karakter', id: 'k4', nev: 'Áruló' }, { oldal: harmadik }).o;
ellenoriz(o.resztvevok.find((x) => x.forras.id === 'k4').oldal === harmadik, 'játékos karakter más oldalra is kerülhet');
let o2 = O.oldalTorles(o, harmadik);
ellenoriz(o2.oldalak.length === 2 && o2.resztvevok.find((x) => x.forras.id === 'k4').oldal === O.CSAPAT && !Object.keys(o2.viszonyok).some((k) => k.includes(harmadik)),
  'oldal törlése: a résztvevői átkerülnek, a viszonyai törlődnek');
ellenoriz(O.oldalTorles(O.oldalTorles(o2, O.ELLENFELEK), O.CSAPAT).oldalak.length === 1, 'az utolsó oldal nem törölhető');

// ---- összegzés, ellenőrzés ----
const ossz = O.osszegzes(o);
ellenoriz(ossz.osszes === 3 + 1 + 3 + 1 && ossz.oldalak.find((x) => x.id === O.ELLENFELEK).db === 4, 'összegzés oldalanként, a darabszámmal');
ellenoriz(O.ellenorzes(o).length === 0, 'rendben lévő összecsapásra nincs figyelmeztetés', O.ellenorzes(o));
let o3 = O.uresOsszecsapas();
o3 = O.csapatHozzaadas(o3, KARAKTEREK.slice(0, 2));
ellenoriz(O.ellenorzes(o3).some((x) => x.includes('egy oldalon')), 'egyetlen lakott oldal: figyelmeztetés');
o3 = O.resztvevoHozzaadas(o3, { tipus: 'njk', id: 'n_kocsmaros', nev: 'Kocsmáros' }).o;
o3 = O.viszonyBeallitas(o3, O.CSAPAT, O.ELLENFELEK, 'semleges');
ellenoriz(O.ellenorzes(o3).some((x) => x.includes('nincs ellenséges')), 'ellenséges viszony nélkül: figyelmeztetés');
o3 = O.resztvevoHozzaadas(o3, { tipus: 'njk', id: 'n_kocsmaros', nev: 'Kocsmáros' }).o;
ellenoriz(O.ellenorzes(o3).some((x) => x.includes('kétszer')), 'ugyanaz az NJK kétszer: figyelmeztetés');

// ---- nehézség ----
let n = O.nehezsegBecsles(o, korny);
ellenoriz(n && n.csapat.szint === 3 && n.csapat.letszam === 3 && n.ellenfelek.length === 2, 'a csapat szintje az átlag, az ellenfél az ellenséges oldal', n);
ellenoriz(n.becsles === 'Nehéz' && n.xp === 400, 'Mérsékelt ogre egy 3. szintű csapat ellen: Nehéz', n);
ellenoriz(n.ellenfelek.find((e) => e.nev === 'Ogre').elteres === 1 && n.ellenfelek.find((e) => e.nev === 'Farkas').elteres === 0, 'az eltérés fenyegetési fokban');
let e1 = O.uresOsszecsapas();
e1 = O.csapatHozzaadas(e1, KARAKTEREK.slice(0, 3));
e1 = O.resztvevoHozzaadas(e1, { tipus: 'szorny', id: 'szo_farkas', nev: 'Farkas', db: 2 }).o;
ellenoriz(O.nehezsegBecsles(e1, korny).becsles === 'Átlagos', 'két Csekély farkas három 3. szintű ellen: Átlagos');
e1 = O.resztvevoModositas(e1, e1.resztvevok[3].id, { db: 6 });
ellenoriz(O.nehezsegBecsles(e1, korny).becsles === 'Nehéz', 'kétszeres túlerő: eggyel nehezebb');
e1 = O.resztvevoHozzaadas(e1, { tipus: 'njk', id: 'n_vezer', nev: 'Falkavezér' }).o;
ellenoriz(O.nehezsegBecsles(e1, korny).ellenfelek.find((x) => x.nev === 'Falkavezér').elteres === 1, 'az elit NJK egy fokkal feljebb számít');
e1 = O.resztvevoHozzaadas(e1, { tipus: 'szorny', id: 'szo_sarkany', nev: 'Sárkány' }).o;
ellenoriz(O.nehezsegBecsles(e1, korny).becsles === 'Nagyon nehéz', 'Legendás sárkány alacsony szinten: Nagyon nehéz');
let e2 = O.uresOsszecsapas();
e2 = O.resztvevoHozzaadas(e2, { tipus: 'szorny', id: 'szo_titok', nev: 'Titok' }).o;
let n2 = O.nehezsegBecsles(e2, { ...korny, csapat: [{ id: 'k1', szint: 6 }] });
ellenoriz(n2.csapat.kampanybol && n2.csapat.szint === 6 && n2.becsles === null && n2.megjegyzesek.some((x) => x.includes('fenyegetési szint nélkül')),
  'karakter nélkül a kampány csapata számít; fenyegetés nélküli lényre nincs becslés', n2);
ellenoriz(O.nehezsegBecsles(e2, korny).becsles === null && O.nehezsegBecsles(e2, korny).csapat.letszam === 0, 'csapat nélkül nincs becslés');
ellenoriz(O.nehezsegBecsles(O.uresOsszecsapas(), korny) === null, 'ellenfél nélkül null');
let e3 = O.uresOsszecsapas();
e3 = O.csapatHozzaadas(e3, [{ id: 'k1', nev: 'Dorn' }]);
e3 = O.resztvevoHozzaadas(e3, { tipus: 'karakter', id: 'k4', nev: 'Áruló' }, { oldal: O.ELLENFELEK }).o;
ellenoriz(O.nehezsegBecsles(e3, korny).ellenfelek[0].fenyegetes === '4. szint', 'ellenfél karakter: a szintje számít');
ellenoriz(O.szintSav(1) === 0 && O.szintSav(5) === 1 && O.szintSav(12) === 2 && O.szintSav(13) === 3 && O.szintSav(20) === 4 && O.szintSav(99) === 4, 'szint fenyegetési sávja');

// ---- kibontás ----
const pld = O.resztvevokKibontasa(o);
ellenoriz(pld.length === 8 && pld.filter((p) => p.resztvevo_id === farkasId).map((p) => p.nev).join() === 'Farkas 1,Farkas 2,Farkas 3'
  && new Set(pld.filter((p) => p.resztvevo_id === farkasId).map((p) => p.csoport)).size === 1, 'kibontás: a szörnyek számozott példányai egy csoportban');
ellenoriz(new Set(pld.map((p) => p.id)).size === pld.length, 'a példányok azonosítója egyedi');

// ---- normalizálás, másolat ----
const nrm = O.normalizal({ oldalak: [{ id: 'a', nev: 'A' }], resztvevok: [{ forras: { tipus: 'szorny', id: 'x' }, db: '0', oldal: 'zz', csoport: 'q' }, { nev: 'hibás' }] });
ellenoriz(nrm.oldalak.length === 1 && nrm.resztvevok.length === 1 && nrm.resztvevok[0].db === 1 && nrm.resztvevok[0].oldal === 'a' && nrm.resztvevok[0].csoport === '' && nrm.leiras === '',
  'normalizálás: hiányos adatból teljes szerkezet', nrm);
ellenoriz(O.normalizal(null).oldalak.length === 2, 'üres adatból alap összecsapás');
const mas = O.osszecsapasMasolat(o);
ellenoriz(mas.resztvevok.length === o.resztvevok.length && mas.resztvevok.every((x, i) => x.id !== o.resztvevok[i].id) && mas.csoportok.length === o.csoportok.length, 'másolat új résztvevő-azonosítókkal');
let t = O.resztvevoTorles(o, farkasId);
ellenoriz(!t.resztvevok.some((x) => x.id === farkasId) && t.csoportok.length === 0, 'törléskor a kiürült csoport is megszűnik');

// ---- célpontok és láthatóság ----
const resz = [{ id: 'a', nev: 'Dorn', oldal: O.CSAPAT }, { id: 'b', nev: 'Lia', oldal: O.CSAPAT }, { id: 'c', nev: 'Ogre', oldal: O.ELLENFELEK }, { id: 'd', nev: 'Zsoldos', oldal: harmadik }];
const sorr = O.celpontSorrend(o, resz, O.CSAPAT, 'a');
ellenoriz(sorr.map((x) => x.id).join() === 'c,d,b' && sorr[2].viszony === 'sajat', 'célpontok: ellenség elöl, a saját oldal hátul, önmaga nincs benne');
ellenoriz(O.celpontFigyelmeztetes(o, O.CSAPAT, O.CSAPAT) && O.celpontFigyelmeztetes(o, O.ELLENFELEK, harmadik).includes('szövetséges') && O.celpontFigyelmeztetes(o, O.CSAPAT, O.ELLENFELEK) === null,
  'figyelmeztetés a saját és a szövetséges oldal támadásakor');
ellenoriz(O.egeszsegLathatosag({}, { nezoOldalak: [O.CSAPAT], celOldal: O.ELLENFELEK }) === 'leiro', 'más oldal Egészsége alapból leíró');
ellenoriz(O.egeszsegLathatosag({ csata_egeszseg: 'rejtett' }, { nezoOldalak: [O.CSAPAT], celOldal: O.CSAPAT }) === 'pontos'
  && O.egeszsegLathatosag({ csata_egeszseg: 'rejtett' }, { nezoOldalak: [O.CSAPAT], celOldal: harmadik }) === 'rejtett'
  && O.egeszsegLathatosag({ csata_egeszseg: 'rejtett' }, { dm: true, celOldal: harmadik }) === 'pontos', 'saját oldal és DM: pontos; más oldal a beállítás szerint');
ellenoriz([O.leiroEgeszseg(20, 20), O.leiroEgeszseg(10, 20), O.leiroEgeszseg(9, 20), O.leiroEgeszseg(0, 20), O.leiroEgeszseg(-3, 20)].join() === 'ép,sérült,súlyosan sérült,földön,földön', 'leíró Egészség');
ellenoriz(O.egeszsegSzoveg(7, 20, 'pontos') === '7/20' && O.egeszsegSzoveg(7, 20, 'rejtett') === '?' && O.egeszsegSzoveg(7, 20, 'leiro') === 'súlyosan sérült', 'Egészség szövege a láthatóság szerint');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
