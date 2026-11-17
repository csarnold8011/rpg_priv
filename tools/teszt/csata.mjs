// A csatamotor tiszta függvényeinek tesztje (web/js/jatek/csata.js). Futtatás: node tools/teszt/csata.mjs
import * as C from '../../web/js/jatek/csata.js';
import * as O from '../../web/js/jatek/osszecsapas.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---- összecsapás → csata ----
let o = O.uresOsszecsapas();
o = O.resztvevoHozzaadas(o, { tipus: 'karakter', id: 'k1', nev: 'Dorn' }, { oldal: O.CSAPAT }).o;
o = O.resztvevoHozzaadas(o, { tipus: 'karakter', id: 'k2', nev: 'Lia' }, { oldal: O.CSAPAT }).o;
o = O.resztvevoHozzaadas(o, { tipus: 'szorny', id: 'szo_farkas', nev: 'Farkas', db: 2 }, { oldal: O.ELLENFELEK }).o;
o = O.resztvevoHozzaadas(o, { tipus: 'njk', id: 'n_vezer', nev: 'Vezér' }, { oldal: O.ELLENFELEK, rejtett: true }).o;
const vezerR = o.resztvevok.find((r) => r.forras.id === 'n_vezer').id;
const ADAT = { k1: { egeszseg: 20, egeszseg_max: 25, szivossag: 2 }, k2: { egeszseg_max: 15, szivossag: 1 }, szo_farkas: { egeszseg_max: 12 }, n_vezer: { egeszseg_max: 30 } };
let cs = C.csataOsszecsapasbol(o, (p) => ADAT[p.forras.id], { meglepettOldalak: [O.ELLENFELEK] });
const id = (nev) => cs.resztvevok.find((r) => r.nev === nev).id;
ellenoriz(cs.resztvevok.length === 5 && cs.allapot === 'kezdemenyezes' && cs.kor === 0, 'csata az összecsapásból: példányokkal, kezdeményezés állapotban');
ellenoriz(C.resztvevo(cs, id('Dorn')).egeszseg === 20 && C.resztvevo(cs, id('Lia')).egeszseg === 15, 'a karakter aktuális Egészsége, hiányában a maximum');
ellenoriz(C.resztvevo(cs, id('Farkas 1')).meglepett && !C.resztvevo(cs, id('Dorn')).meglepett, 'a meglepett oldal jelölve');
ellenoriz(C.resztvevo(cs, id('Farkas 1')).csoport && C.resztvevo(cs, id('Farkas 1')).csoport === C.resztvevo(cs, id('Farkas 2')).csoport, 'a farkasok egy csoportban');
ellenoriz(C.kezdemenyezesHianyzik(cs).length === 4, 'a rejtett nem kell kezdeményezéshez');
let hiba = null;
try { C.csataKezdes(JSON.parse(JSON.stringify(cs))); } catch (e) { hiba = e.message; }
ellenoriz(hiba && hiba.includes('Dorn'), 'kezdeményezés nélkül nem indul', hiba);

// ---- kezdeményezés ----
cs = C.lepes(cs, 'Kezdeményezés', (x) => {
  C.kezdemenyezesBeallitas(x, id('Dorn'), { osszeg: 12, sarkany: 3, tul: 2 });
  C.kezdemenyezesBeallitas(x, id('Lia'), { osszeg: 12, sarkany: 5, tul: 1 });
  C.kezdemenyezesBeallitas(x, id('Farkas 1'), { osszeg: 14, sarkany: 2, tul: 2 });
});
ellenoriz(C.resztvevo(cs, id('Farkas 2')).kezdemenyezes.osszeg === 14, 'a csoport egy dobással kap kezdeményezést');
const s = C.sorrendSzamol(cs);
ellenoriz(s.sorrend.join() === [id('Farkas 1'), id('Farkas 2'), id('Lia'), id('Dorn')].join() && s.holtversenyek.length === 0, 'sorrend: összeg, holtversenyben sárkánykocka', s);
let t = JSON.parse(JSON.stringify(cs));
C.kezdemenyezesBeallitas(t, id('Lia'), { osszeg: 12, sarkany: 3, tul: 2 });
ellenoriz(C.sorrendSzamol(t).holtversenyek.length === 1, 'teljes holtverseny: a DM rendez');

cs = C.lepes(cs, 'A csata elkezdődik', (x) => C.csataKezdes(x));
ellenoriz(cs.allapot === 'fut' && cs.kor === 1 && cs.soron === id('Lia'), 'első kör: a meglepett farkasok kimaradnak, Lia kezd', cs.soron);
cs = C.lepes(cs, 'tovább', (x) => C.kovetkezo(x));
ellenoriz(cs.soron === id('Dorn'), 'következő: Dorn');
cs = C.lepes(cs, 'tovább', (x) => C.kovetkezo(x));
ellenoriz(cs.kor === 2 && cs.soron === id('Farkas 1') && !C.resztvevo(cs, id('Farkas 1')).meglepett, '2. kör: a farkasok már cselekszenek');
ellenoriz(C.kovetkezoNev(cs) === 'Farkas 2', 'a következő neve');

// ---- cselekvések ----
let f1 = C.resztvevo(cs, id('Farkas 1'));
ellenoriz(C.cselekvesEngedett(f1, 'fo') && C.cselekvesEngedett(f1, 'mellek'), 'kör elején fő és mellék is mehet');
cs = C.lepes(cs, 'Mozgás', (x) => C.cselekvesRogzites(x, id('Farkas 1'), 'mellek', 'Mozgás'));
cs = C.lepes(cs, 'Mozgás', (x) => C.cselekvesRogzites(x, id('Farkas 1'), 'mellek', 'Mozgás'));
f1 = C.resztvevo(cs, id('Farkas 1'));
ellenoriz(!C.cselekvesEngedett(f1, 'fo') && !C.cselekvesEngedett(f1, 'mellek') && C.cselekvesEngedett(f1, 'szabad'), 'két mellék után nincs több (a szabad mindig)');
cs = C.lepes(cs, 'Feloldás', (x) => C.cselekvesFeloldas(x, id('Farkas 1')));
ellenoriz(C.cselekvesEngedett(C.resztvevo(cs, id('Farkas 1')), 'fo'), 'a DM feloldása további cselekvést ad');
cs = C.lepes(cs, 'Támadás', (x) => C.cselekvesRogzites(x, id('Farkas 1'), 'fo', 'Támadás'));
ellenoriz(C.resztvevo(cs, id('Farkas 1')).cselekves.plusz === 0 && !C.cselekvesEngedett(C.resztvevo(cs, id('Farkas 1')), 'fo'), 'a feloldás elfogy');
let r0 = { cselekves: { fo: 1, mellek: 0, plusz: 0 } };
ellenoriz(!C.cselekvesEngedett(r0, 'fo') && C.cselekvesEngedett(r0, 'mellek'), 'egy fő után még egy mellék');

// ---- sebzés, Páncélérték ----
ellenoriz(JSON.stringify(C.sebzesKifejezes('2d6+3')) === '{"kocka":2,"plusz":3}' && C.sebzesKifejezes('d6').kocka === 1
  && C.sebzesKifejezes('1d6 − 1').plusz === -1 && C.sebzesKifejezes('4').kocka === 0 && C.sebzesKifejezes('2d8') === null, 'sebzéskifejezés');
ellenoriz(C.sebzesSzamol({ osszeg: 13, pancelertek: 4 }).vegso === 9, 'Páncélérték levonása (AK példa: 10 + 3 − 4 = 9)');
ellenoriz(C.sebzesSzamol({ osszeg: 3, pancelertek: 5 }).vegso === 0, 'a sebzés nem negatív');
ellenoriz(C.sebzesSzamol({ osszeg: 10, pancelertek: 5, atuto: true }).vegso === 10 && C.sebzesSzamol({ osszeg: 10, pancelertek: 5, atuto: true, atuto_ellen: true }).vegso === 5, 'átütő sebzés, kivéve az ellene védőt');
ellenoriz(C.sebzesSzamol({ osszeg: 10, pancelertek: 5, fel_pancel: true }).vegso === 8, 'Páncéltörés: fél Páncélérték lefelé');

// ---- haldoklás, kiesés ----
cs = C.lepes(cs, 'Sebzés', (x) => C.sebzesAlkalmazas(x, id('Dorn'), 30));
let dorn = C.resztvevo(cs, id('Dorn'));
ellenoriz(dorn.egeszseg === 0 && dorn.allapot === 'haldoklik' && dorn.haldoklas_kor === 2 + 2 + 2, 'a karakter nullán haldoklik (2 + Szívósság kör)', dorn);
const ertekek = C.karakterValtozasok(cs.visszavonas.length ? cs : cs, cs);
ellenoriz(Object.keys(ertekek).length === 0, 'változatlan állapotban nincs karakter-változás');
cs = C.lepes(cs, 'Sebzés', (x) => C.sebzesAlkalmazas(x, id('Farkas 2'), 50));
ellenoriz(C.resztvevo(cs, id('Farkas 2')).allapot === 'kiesett', 'a szörny nullán kiesik');
t = C.lepes(cs, 'Gyógyítás', (x) => C.gyogyitas(x, id('Dorn'), 5, { heal: true }));
dorn = C.resztvevo(t, id('Dorn'));
ellenoriz(dorn.allapot === 'aktiv' && dorn.egeszseg === 5 && dorn.haldoklas_kor === null && dorn.gyogyithato === false, 'gyógyítás: a haldokló újra harcol, Gyógyítás nem jár újra');
ellenoriz(JSON.stringify(C.karakterValtozasok(cs, t)) === JSON.stringify({ k1: { egeszseg: 5 } }), 'karakter-változás a háttérnek');
t = C.lepes(t, 'Sebzés', (x) => C.sebzesAlkalmazas(x, id('Dorn'), 1));
ellenoriz(C.resztvevo(t, id('Dorn')).gyogyithato === true, 'újabb sebzés után ismét gyógyítható');
t = C.gyogyitas(JSON.parse(JSON.stringify(t)), id('Dorn'), 100);
ellenoriz(C.resztvevo(t, id('Dorn')).egeszseg === 25, 'gyógyítás legfeljebb a maximumig');

// a haldokló a végső köre elején meghal; addig a köre kimarad
let h = JSON.parse(JSON.stringify(cs));
let lepesek = 0;
while (C.resztvevo(h, id('Dorn')).allapot !== 'halott' && lepesek++ < 40) { if (h.kor === 5) ellenoriz(C.resztvevo(h, id('Dorn')).allapot === 'haldoklik', '5. körben még haldoklik'); h = C.kovetkezo(h); }
ellenoriz(C.resztvevo(h, id('Dorn')).allapot === 'halott' && h.naplo.some((n) => n.szoveg === 'Dorn meghalt.' && n.kor === 6), 'a 6. kör saját köre elején meghal', C.resztvevo(h, id('Dorn')));
ellenoriz(!h.sorrend.some((x) => h.soron === x && x === id('Dorn')), 'haldokló és halott nem kerül sorra');

// ---- visszavonás ----
const elotte = JSON.stringify(cs.resztvevok);
let u = C.lepes(cs, 'Farkas 1 sebzést kap: 5', (x) => C.sebzesAlkalmazas(x, id('Farkas 1'), 5));
ellenoriz(C.resztvevo(u, id('Farkas 1')).egeszseg === 7 && C.utolsoLepes(u).startsWith('Farkas 1'), 'lépés: sebzés');
u = C.visszavon(u);
ellenoriz(JSON.stringify(u.resztvevok) === elotte && u.naplo[u.naplo.length - 1].szoveg.startsWith('Visszavonva'), 'visszavonás: az előző állapot, a naplóban jelezve');
let kor = C.lepes(cs, 'tovább', (x) => C.kovetkezo(x));
kor = C.visszavon(kor);
ellenoriz(kor.soron === cs.soron && kor.kor === cs.kor && JSON.stringify(kor.leptek) === JSON.stringify(cs.leptek), 'visszavonás: a kör léptetése is');
let tobb = cs;
for (let i = 0; i < 20; i++) tobb = C.lepes(tobb, 'x' + i, (x) => C.cselekvesFeloldas(x, id('Lia')));
ellenoriz(tobb.visszavonas.length === C.MAX_VISSZAVONAS, 'a visszavonási lista korlátos');
const kulcsos = C.lepes(cs, 'k', (x) => x, 'kulcs1');
ellenoriz(kulcsos.kulcsok.includes('kulcs1'), 'a lépés kulcsa megmarad (dupla küldés szűrése)');

// ---- hatások: Védekezés, Célzás, fekvő célpont ----
let v = C.lepes(cs, 'Védekezés', (x) => C.hatasHozzaadas(x, id('Farkas 1'), { nev: 'Védekezés', cel: 'vedekezes', ertek: 2, lejar: 'sajat' }));
ellenoriz(C.vedekezes(C.resztvevo(v, id('Farkas 1')), 12) === 14, 'Védekezés: +2');
v = C.lepes(v, 'Célzás', (x) => C.hatasHozzaadas(x, id('Lia'), { nev: 'Célzás', cel: 'tamadas', ertek: 1, lejar: 'kovetkezo_tamadas' }));
v = C.lepes(v, 'Földre döntés', (x) => C.feltetelHozzaadas(x, id('Farkas 1'), { kulcs: 'fekszik' }));
const mods = C.tamadasModositok(C.resztvevo(v, id('Lia')), C.resztvevo(v, id('Farkas 1')));
ellenoriz(mods.length === 2 && mods.reduce((a, m) => a + m.ertek, 0) === 2, 'támadás módosítói: Célzás és fekvő célpont', mods);
ellenoriz(C.tamadasModositok(C.resztvevo(v, id('Lia')), C.resztvevo(v, id('Farkas 1')), { tavolsagi: true }).length === 1, 'távolsági támadásnál a fekvés nem számít');
v = C.tamadasUtan(v, id('Lia'));
ellenoriz(C.hatasOsszeg(C.resztvevo(v, id('Lia')), 'tamadas') === 0, 'a Célzás a támadással elfogy');
// a „saját köre elejéig” hatás lejár
let w = JSON.parse(JSON.stringify(v));
let n = 0;
while (!(w.soron === id('Farkas 1') && w.kor === 3) && n++ < 20) w = C.kovetkezo(w);
ellenoriz(w.kor === 3 && C.hatasOsszeg(C.resztvevo(w, id('Farkas 1')), 'vedekezes') === 0, 'a Védekezés a következő köre elején lejár');
ellenoriz(C.resztvevo(w, id('Farkas 1')).feltetelek.some((f) => f.kulcs === 'fekszik'), 'a fekvés időtartam nélkül megmarad');
let fe = C.feltetelHozzaadas(JSON.parse(JSON.stringify(cs)), id('Lia'), { nev: 'Kábult', korok: 1 });
const kezdKor = fe.kor;
n = 0;
while (fe.kor === kezdKor && n++ < 10) fe = C.kovetkezo(fe);
ellenoriz(!C.resztvevo(fe, id('Lia')).feltetelek.length, 'az 1 körös feltétel a következő kör elején lejár');
ellenoriz(C.feltetelTorles(JSON.parse(JSON.stringify(v)), id('Farkas 1'), C.resztvevo(v, id('Farkas 1')).feltetelek[0].id).resztvevok.find((r) => r.id === id('Farkas 1')).feltetelek.length === 0, 'feltétel levétele');

// ---- mutatványok ----
const LAPOK = { 'Mutatványok': [{ id: 'mut_cs_x', reszletek: { osszetevok: ['mut_mighty_blow', 'mut_knock_prone'] } }, { id: 'mut_taunt', nev_hu: 'Gúnyolás' }] };
const mh = C.mutatvanyHatasok([{ id: 'mut_mighty_blow', db: 1 }, { id: 'mut_lethal_blow' }, { id: 'mut_pierce_armor' }, { id: 'mut_cs_x' }, { id: 'mut_taunt', nev: 'Gúnyolás' }, { id: 'sajat:harapas', nev: 'Marcangolás' }], LAPOK);
ellenoriz(mh.sebzes_kocka === 4 && mh.fel_pancel && mh.fekszik && mh.szoveges.join() === 'Gúnyolás,Marcangolás', 'mutatványok gépi hatása, csomag kibontva', mh);
let sz = C.lepes(cs, 'Átvétel', (x) => C.sorrendElere(x, id('Dorn')));
ellenoriz(sz.sorrend[0] === id('Dorn'), 'Kezdeményezés átvétele: a sorrend élére');
sz = C.athelyezes(JSON.parse(JSON.stringify(sz)), id('Dorn'), 1);
ellenoriz(sz.sorrend[1] === id('Dorn'), 'kézi átrendezés');

// ---- rejtett belépés, új résztvevő, oldalváltás ----
let b = C.lepes(cs, 'Belép', (x) => C.belepes(x, vezerR, { osszeg: 20, sarkany: 6, tul: 3 }));
ellenoriz(!C.resztvevo(b, vezerR).rejtett && b.sorrend[0] === vezerR && b.leptek.includes(vezerR), 'a rejtett belép: a sorrendbe kerül, a következő körtől cselekszik');
b = C.lepes(b, 'Új', (x) => C.resztvevoHozzaadas(x, { forras: { tipus: 'szorny', id: 'szo_patkany' }, nev: 'Patkány', oldal: O.ELLENFELEK, egeszseg_max: 5, kezdemenyezes: { osszeg: 1, sarkany: 1, tul: 0 } }));
ellenoriz(b.resztvevok.length === 6 && b.sorrend[b.sorrend.length - 1] === b.resztvevok[5].id, 'új résztvevő a sorrend végén');
let g = C.resztvevoHozzaadas(JSON.parse(JSON.stringify(b)), { forras: { tipus: 'szorny', id: 'szo_x' }, nev: 'Goblin 1', oldal: O.ELLENFELEK, egeszseg_max: 8, csoportNev: 'Goblin' });
g = C.resztvevoHozzaadas(g, { forras: { tipus: 'szorny', id: 'szo_x' }, nev: 'Goblin 2', oldal: O.ELLENFELEK, egeszseg_max: 8, csoportNev: 'Goblin' });
const gob = g.resztvevok.slice(-2);
ellenoriz(gob[0].csoport && gob[0].csoport === gob[1].csoport && gob.every((r) => r.rejtett), 'futó csatában az új lények egy csoportban, belépésre várnak');
g = C.resztvevoTorles(g, gob[0].id);
ellenoriz(!g.resztvevok.some((r) => r.id === gob[0].id), 'résztvevő eltávolítása');
b = C.oldalValtas(b, id('Lia'), O.ELLENFELEK);
ellenoriz(C.resztvevo(b, id('Lia')).oldal === O.ELLENFELEK, 'oldalváltás (árulás)');
const ossz = C.csataOsszegzes(b);
ellenoriz(ossz.haldoklok.includes('Dorn') && ossz.kiesettek.includes('Farkas 2'), 'összegzés', ossz);

// ---- karakterek frissítése a karakterlapról ----
let kf = JSON.parse(JSON.stringify(cs));
const valt = C.karakterekFrissitese(kf, { k1: { egeszseg: 10, egeszseg_max: 26 }, k2: { egeszseg: 15, egeszseg_max: 15, szivossag: 1 } });
ellenoriz(valt && C.resztvevo(kf, id('Dorn')).egeszseg === 10 && C.resztvevo(kf, id('Dorn')).allapot === 'aktiv' && C.resztvevo(kf, id('Dorn')).egeszseg_max === 26, 'a karakterlapon gyógyított karakter átvétele');
ellenoriz(!C.karakterekFrissitese(kf, { k1: { egeszseg: 10, egeszseg_max: 26, szivossag: 2 } }), 'egyező értéknél nincs változás');

// ---- állapot kézzel ----
let ak = C.allapotBeallitas(JSON.parse(JSON.stringify(cs)), id('Farkas 2'), 'aktiv');
ellenoriz(C.resztvevo(ak, id('Farkas 2')).allapot === 'aktiv' && C.resztvevo(ak, id('Farkas 2')).egeszseg === 1, 'a DM visszahozhatja (1 Egészséggel)');
ak = C.fontosBeallitas(ak, id('Farkas 1'), true);
ak = C.sebzesAlkalmazas(ak, id('Farkas 1'), 99);
ellenoriz(C.resztvevo(ak, id('Farkas 1')).allapot === 'haldoklik', 'a fontossá tett NJK haldoklik');
ellenoriz(JSON.stringify(cs).length < 20000, 'a csata állapota elfér egy cellában', JSON.stringify(cs).length);

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
