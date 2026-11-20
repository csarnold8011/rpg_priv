// A kampány jegyzetfüzetének tiszta függvényei (web/js/kampany/jegyzetfuzet.js, 6.3).
// Futtatás: node tools/teszt/jegyzetfuzet.mjs
import * as J from '../../web/js/kampany/jegyzetfuzet.js';
import * as A from '../../web/js/kampany/anyag.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---- Új jegyzet, mentés ----
const uj = J.ujJegyzet({ kampanyId: 'k1', szerzoId: 'u_b', szerzoNev: 'Bence', lathatosag: 'csapat', szoveg: 'Szia' });
ellenoriz(/^j_[a-z0-9]{10}$/.test(uj.id) && uj.verzio === 0 && uj.lathatosag === 'csapat' && uj.aktiv, 'új jegyzet j_ azonosítóval, 0. verzióval', uj);
ellenoriz(J.ujJegyzet({ lathatosag: 'rossz' }).lathatosag === 'sajat', 'ismeretlen láthatóság: saját');
let m = J.mentendo({ ...uj, cimkek: 'a, B, b,  ,c' });
ellenoriz(m.uj && m.kampany_id === 'k1' && m.verzio === undefined && m.cimkek.join('|') === 'a|B|c', 'új jegyzet mentése: kampány, „uj” jel, címkék egyszer', m);
m = J.mentendo({ ...uj, verzio: 3 });
ellenoriz(!m.uj && m.verzio === 3 && m.kampany_id === undefined, 'módosítás mentése a verzióval');
ellenoriz(J.uresE({ cim: ' ', szoveg: '\n' }) && !J.uresE({ szoveg: 'x' }), 'üres jegyzet felismerése');
ellenoriz(J.cimkekSzovegge(['a', 'b']) === 'a, b' && J.cimkekSzovegbol('x,'.repeat(20)).length === 1, 'címkék szöveggé és vissza');

// ---- Optimista nézet ----
const sz = [
  { id: 'j_1', verzio: 2, szoveg: 'szerver', aktiv: true, lathatosag: 'csapat', modositva: '2026-11-20T10:00:00Z' },
  { id: 'j_2', verzio: 1, szoveg: 'másik', aktiv: true, lathatosag: 'sajat', modositva: '2026-11-20T09:00:00Z' }
];
let helyi = new Map([
  ['j_1', { jegyzet: { id: 'j_1', verzio: 2, szoveg: 'helyi gépelés', aktiv: true }, fuggo: true }],
  ['j_3', { jegyzet: { id: 'j_3', verzio: 0, szoveg: 'új', aktiv: true }, fuggo: true }],
  ['j_2', { jegyzet: { id: 'j_2', verzio: 2, aktiv: false }, fuggo: false }]
]);
let ossz = J.osszefesul(sz, helyi);
ellenoriz(ossz.length === 2 && ossz.find((j) => j.id === 'j_1').szoveg === 'helyi gépelés' && ossz.some((j) => j.id === 'j_3'),
  'a függő helyi változat és az új jegyzet látszik, a helyben törölt nem', ossz);
helyi = new Map([['j_1', { jegyzet: { id: 'j_1', verzio: 2, szoveg: 'mentve', aktiv: true }, fuggo: false }], ['j_9', { jegyzet: { id: 'j_9', verzio: 2, aktiv: false }, fuggo: false }]]);
ellenoriz(J.utolertHelyiek(sz, helyi).join() === 'j_1,j_9', 'a szerver utolérte a mentett helyit, a törölt jegyzet eltűnt a szerverről is');
ellenoriz(J.utolertHelyiek([{ id: 'j_1', verzio: 1 }], helyi).join() === 'j_9', 'a régebbi szerverváltozat nem írja felül a helyit');

// ---- Sorrend, szűrés, címkék ----
const lista = [
  { id: 'a', cim: 'Bevásárlás', szoveg: 'kötél, lámpás', cimkek: ['Teendő'], lathatosag: 'csapat', modositva: '2026-11-20T08:00:00Z', szerzo_nev: 'Anna' },
  { id: 'b', cim: 'Gyanú', szoveg: 'A sánta idegen követ.', cimkek: ['gyanú', 'teendő'], lathatosag: 'sajat', modositva: '2026-11-20T09:00:00Z', kapcsolodik: 'm_al' },
  { id: 'c', cim: 'Térkép', szoveg: 'Északon a torony.', lathatosag: 'csapat', rogzitett: true, modositva: '2026-11-19T08:00:00Z' }
];
ellenoriz(J.sorrend(lista).map((j) => j.id).join('') === 'cba', 'rögzített elöl, aztán a legutóbb módosított');
ellenoriz(J.szur(lista, { nezet: 'csapat' }).map((j) => j.id).join('') === 'ca', 'szűrés láthatóságra');
ellenoriz(J.szur(lista, { kereses: 'santa' }).map((j) => j.id).join('') === 'b', 'keresés ékezet nélkül is talál');
ellenoriz(J.szur(lista, { kereses: 'anna lámpás' }).map((j) => j.id).join('') === 'a', 'több szó: mindegyiknek szerepelnie kell (az író nevében is)');
ellenoriz(J.szur(lista, { kereses: 'kapucnis' }, (j) => (j.kapcsolodik === 'm_al' ? 'A kapucnis idegen' : '')).map((j) => j.id).join('') === 'b', 'a keresés a kapcsolódó alany nevére is talál');
ellenoriz(J.szur(lista, { cimke: 'TEENDŐ' }).map((j) => j.id).join('') === 'ba', 'címkeszűrés kisbetűtől függetlenül');
const c = J.cimkek(lista);
ellenoriz(c[0].cimke === 'Teendő' && c[0].db === 2 && c[1].cimke === 'gyanú', 'címkék gyakoriság szerint', c);
ellenoriz(J.darab(lista, 'csapat') === 2 && J.darab(lista) === 3, 'darabszám nézetenként');

// ---- Kapcsolat ----
const megosztasok = [
  { id: 'm_1', tipus: 'anyag', cim: 'Levél', idopont: '2026-11-20T08:00:00Z', adat: { fajta: 'level', szoveg: 'x' } },
  { id: 'm_2', tipus: 'anyag', cim: 'Visszavont', allapot: 'visszavont', idopont: '2026-11-20T09:00:00Z', adat: { fajta: 'nyom' } }
];
const alanyok = [
  { id: 'm_al', tipus: 'alany', ismert_nev: 'A kapucnis idegen', nev: 'A kapucnis idegen', kategoria: 'szemely', osszekapcsolva: 'm_al2' },
  { id: 'm_al2', tipus: 'alany', ismert_nev: 'Varga mester', nev: 'Varga mester', kategoria: 'szemely' }
];
let k = J.kapcsolat({ kapcsolodik: 'm_1' }, megosztasok, alanyok);
ellenoriz(k && k.tipus === 'anyag' && k.nev === 'Levél' && k.m.id === 'm_1', 'kapcsolat anyaghoz', k);
k = J.kapcsolat({ kapcsolodik: 'm_al' }, megosztasok, alanyok);
ellenoriz(k && k.tipus === 'alany' && k.nev === 'Varga mester', 'összekapcsolt alanynál a lánc végének neve', k);
ellenoriz(J.kapcsolat({ kapcsolodik: 'm_2' }, megosztasok, alanyok) === null && J.kapcsolat({ kapcsolodik: 'm_x' }, megosztasok, alanyok) === null
  && J.kapcsolat({}, megosztasok, alanyok) === null, 'visszavont, ismeretlen vagy hiányzó kapcsolat: nincs');
const op = J.kapcsolatOpciok(megosztasok, alanyok);
ellenoriz(op.length === 3 && op[0].label.startsWith('Alany: ') && op[2].label === 'Anyag: Levél', 'választható kapcsolatok: alanyok, aztán a nem visszavont anyagok', op);
ellenoriz(J.kapcsolodok(lista, ['m_al', 'm_1']).map((j) => j.id).join('') === 'b', 'a megadott anyagokhoz vagy alanyokhoz kötött jegyzetek');
const cs = A.ismeretek([{ ...megosztasok[0], alany_id: 'm_al' }], alanyok);
ellenoriz(cs.length === 1 && cs[0].alanyIdk.includes('m_al') && cs[0].alanyIdk.includes('m_al2'), 'az Ismeretek csoportja ismeri az összekapcsolt alanyokat (a jegyzetekhez)', cs);

// ---- Háromutas összefésülés ----
const alap = { id: 'j', cim: 'Napló', szoveg: 'Első nap.', cimkek: ['napló', 'régi'], lathatosag: 'csapat', kapcsolodik: '', karakter_id: '', rogzitett: false, verzio: 2 };
let r = J.haromUtas(alap, { ...alap, cim: 'Kalandnapló' }, { ...alap, szoveg: 'Első nap. Eső.', verzio: 3 });
ellenoriz(!r.utkozo.length && r.jegyzet.cim === 'Kalandnapló' && r.jegyzet.szoveg === 'Első nap. Eső.' && r.jegyzet.verzio === 3, 'más-más mező változott: mindkettő megmarad', r);
r = J.haromUtas(alap, { ...alap, szoveg: 'Első nap.\nÉn: farkasok.' }, { ...alap, szoveg: 'Első nap.\nAnna: eső.', verzio: 3 });
ellenoriz(!r.utkozo.length && r.jegyzet.szoveg === 'Első nap.\nAnna: eső.\nÉn: farkasok.', 'mindketten a végére írtak: a két hozzáírás egymás után', r.jegyzet.szoveg);
r = J.haromUtas(alap, { ...alap, szoveg: 'Átírtam.' }, { ...alap, szoveg: 'Én is átírtam.', verzio: 3 });
ellenoriz(r.utkozo.join() === 'szoveg' && r.jegyzet.szoveg === 'Átírtam.', 'mindketten átírták a szöveget: ütközés, kérdezni kell');
r = J.haromUtas(alap, { ...alap, cimkek: ['napló', 'új'] }, { ...alap, cimkek: ['napló', 'régi', 'másik'], verzio: 3 });
ellenoriz(r.jegyzet.cimkek.join('|') === 'napló|másik|új', 'címkék: a törölt eltűnik, mindkét fél újja megmarad', r.jegyzet.cimkek);
r = J.haromUtas(alap, { ...alap, rogzitett: true }, { ...alap, rogzitett: true, verzio: 3 });
ellenoriz(!r.utkozo.length && r.jegyzet.rogzitett === true, 'azonos változtatás nem ütközés');
const e = J.egymasAla({ ...alap, szoveg: 'Az enyém.' }, { ...alap, szoveg: 'Az övé.', verzio: 3 });
ellenoriz(e.szoveg === 'Az övé.\n\nAz enyém.' && e.verzio === 3, '„Mindkettő”: a másik alatt a saját');

// ---- Megjelenítés ----
const karakterek = [{ id: 'kar_m', nev: 'Morg' }];
ellenoriz(J.szerzoSzoveg({ szerzo_id: 'u_b', szerzo_nev: 'Bence', karakter_id: 'kar_m' }, karakterek, 'u_x') === 'Bence (Morg)'
  && J.szerzoSzoveg({ szerzo_id: 'u_b', szerzo_nev: 'Bence' }, karakterek, 'u_b') === 'te', 'az író neve, a karakterrel; a sajátnál „te”');
ellenoriz(J.ujCsapatjegyzetek(lista, '2026-11-19T12:00:00Z', 'Bence') === 1 && J.ujCsapatjegyzetek(lista, '2026-11-19T12:00:00Z', 'Anna') === 1
  && J.ujCsapatjegyzetek(lista, '', 'Bence') === 0, 'mások új csapatjegyzetei a legutóbbi megnézés óta');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzés)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
